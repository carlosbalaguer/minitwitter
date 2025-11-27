import { measureAsync } from "@/lib/metrics";
import { cacheKeys, cacheTTL, redis } from "@/lib/redis";
import { SupabaseClient } from "@supabase/supabase-js";

export async function getTimeline(
	supabase: SupabaseClient,
	userId: string,
	filter: "all" | "following"
) {
	const totalStart = performance.now();

	return measureAsync("db.timeline.query", async () => {
		const cacheKey = cacheKeys.timeline(userId, filter);

		// Try to get from cache first
		const cacheStart = performance.now();
		const cachedTimeline = await measureAsync(
			"cache.timeline.get",
			async () => {
				try {
					return await redis.get(cacheKey);
				} catch (error) {
					console.error("Redis error:", error);
					return null;
				}
			}
		);
		const cacheTime = performance.now() - cacheStart;

		if (cachedTimeline) {
			const totalTime = performance.now() - totalStart;
			console.log(
				`✨ Cache HIT - Cache: ${cacheTime.toFixed(
					0
				)}ms | Total: ${totalTime.toFixed(0)}ms`
			);
			return cachedTimeline as any[];
		}

		const dbStart = performance.now();
		console.log(`💾 Cache MISS - fetching from DB...`);

		// Cache miss - fetch from database
		let tweets: any[] = [];

		if (filter === "following") {
			// Use pre-computed timeline (FAST!)
			const { data, error } = await supabase
				.from("timelines")
				.select(
					`
          tweet_id,
          tweets (
            id,
            content,
            created_at,
            user_id,
            profiles (
              id,
              username,
              full_name,
              avatar_url,
              bio
            )
          )
        `
				)
				.eq("user_id", userId)
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;

			tweets =
				data
					?.map((item: any) => {
						if (!item.tweets) return null;

						return {
							id: item.tweets.id,
							content: item.tweets.content,
							created_at: item.tweets.created_at,
							user_id: item.tweets.user_id,
							profiles: item.tweets.profiles,
						};
					})
					.filter((tweet: any) => tweet !== null) || [];
		} else {
			const { data, error } = await supabase
				.from("tweets")
				.select(
					`
          *,
          profiles (*)
        `
				)
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;
			tweets = data || [];
		}

		const dbTime = performance.now() - dbStart;

		// Store in cache
		const cacheSetStart = performance.now();
		await measureAsync("cache.timeline.set", async () => {
			try {
				await redis.setex(
					cacheKey,
					cacheTTL.timeline,
					JSON.stringify(tweets)
				);
			} catch (error) {
				console.error("Redis set error:", error);
			}
		});
		const cacheSetTime = performance.now() - cacheSetStart;

		const totalTime = performance.now() - totalStart;
		console.log(
			`💾 Cache MISS - DB: ${dbTime.toFixed(
				0
			)}ms | Cache Set: ${cacheSetTime.toFixed(
				0
			)}ms | Total: ${totalTime.toFixed(0)}ms`
		);

		return tweets;
	});
}

export async function createTweet(
	supabase: SupabaseClient,
	userId: string,
	content: string
) {
	return measureAsync("db.tweet.create", async () => {
		const { data, error } = await supabase
			.from("tweets")
			.insert({
				content: content.trim(),
				user_id: userId,
			})
			.select();

		if (error) throw error;

		await invalidateTimelineCache(userId);

		await invalidateFollowersCache(supabase, userId);

		return data;
	});
}

export async function toggleFollow(
	supabase: SupabaseClient,
	followerId: string,
	followingId: string,
	isFollowing: boolean
) {
	return measureAsync("db.follow.toggle", async () => {
		if (isFollowing) {
			const { error } = await supabase
				.from("follows")
				.delete()
				.eq("follower_id", followerId)
				.eq("following_id", followingId);

			if (error) throw error;
		} else {
			const { error } = await supabase.from("follows").insert({
				follower_id: followerId,
				following_id: followingId,
			});

			if (error) throw error;
		}

		await invalidateTimelineCache(followerId);
	});
}

export async function getSuggestedUsers(
	supabase: SupabaseClient,
	userId: string
) {
	return measureAsync("db.suggested_users.query", async () => {
		const { data: profiles } = await supabase
			.from("profiles")
			.select("*")
			.neq("id", userId)
			.limit(5);

		const { data: followingData } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		return {
			profiles: profiles || [],
			followingIds: new Set(
				followingData?.map((f) => f.following_id) || []
			),
		};
	});
}

async function invalidateTimelineCache(userId: string) {
	try {
		await redis.del(cacheKeys.timeline(userId, "all"));
		await redis.del(cacheKeys.timeline(userId, "following"));
		console.log("🗑️  Invalidated cache for user:", userId);
	} catch (error) {
		console.error("Error invalidating cache:", error);
	}
}

async function invalidateFollowersCache(
	supabase: SupabaseClient,
	userId: string
) {
	try {
		const { data: followers } = await supabase
			.from("follows")
			.select("follower_id")
			.eq("following_id", userId);

		if (!followers) return;

		const promises = followers.map((f) =>
			invalidateTimelineCache(f.follower_id)
		);
		await Promise.all(promises);

		console.log(`🗑️  Invalidated cache for ${followers.length} followers`);
	} catch (error) {
		console.error("Error invalidating followers cache:", error);
	}
}
