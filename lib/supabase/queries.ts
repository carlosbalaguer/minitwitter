import { measureAsync } from "@/lib/metrics";
import { cacheKeys, cacheTTL, redis } from "@/lib/redis";
import { SupabaseClient } from "@supabase/supabase-js";

export async function getTimeline(
	supabase: SupabaseClient,
	userId: string,
	filter: "all" | "following",
	cursor?: string,
	limit: number = 20
) {
	const totalStart = performance.now();

	return measureAsync("db.timeline.query", async () => {
		const shouldCache = !cursor;
		const cacheKey = cacheKeys.timeline(userId, filter);

		if (shouldCache) {
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
				return cachedTimeline as any;
			}
		}

		const dbStart = performance.now();
		console.log(`💾 Cache MISS - fetching from DB...`);

		let tweets: any[] = [];

		if (filter === "following") {
			const { data: followedCelebrities } = await supabase
				.from("follows")
				.select(
					"following_id, profiles!follows_following_id_fkey(is_celebrity)"
				)
				.eq("follower_id", userId);

			const celebrityIds =
				followedCelebrities
					?.filter((f: any) => f.profiles?.is_celebrity)
					?.map((f: any) => f.following_id) || [];

			let timelineQuery = supabase
				.from("timelines")
				.select(
					`
          tweet_id,
          created_at,
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
              bio,
              is_celebrity
            )
          )
        `
				)
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (cursor) timelineQuery = timelineQuery.lt("created_at", cursor);

			const { data: timelineTweets } = await timelineQuery.limit(limit);

			let celebrityTweets: any[] = [];
			if (celebrityIds.length > 0) {
				let celebrityQuery = supabase
					.from("tweets")
					.select(
						`
            *,
            profiles (*)
          `
					)
					.in("user_id", celebrityIds)
					.order("created_at", { ascending: false });

				if (cursor) {
					celebrityQuery = celebrityQuery.lt("created_at", cursor);
				}

				const { data } = await celebrityQuery.limit(limit);
				celebrityTweets = data || [];
			}

			const timelineTweetsFormatted =
				timelineTweets
					?.map((item: any) => {
						if (!item.tweets) return null;
						return {
							id: item.tweets.id,
							content: item.tweets.content,
							created_at: item.tweets.created_at,
							user_id: item.tweets.user_id,
							profiles: item.tweets.profiles,
							source: "precomputed", // para debugging
						};
					})
					.filter((tweet: any) => tweet !== null) || [];

			const celebrityTweetsFormatted = celebrityTweets.map((tweet) => ({
				...tweet,
				source: "celebrity", // para debugging
			}));

			const allTweets = [
				...timelineTweetsFormatted,
				...celebrityTweetsFormatted,
			];

			const uniqueTweetsMap = new Map();
			allTweets.forEach((tweet) => {
				if (!uniqueTweetsMap.has(tweet.id)) {
					uniqueTweetsMap.set(tweet.id, tweet);
				}
			});

			tweets = Array.from(uniqueTweetsMap.values())
				.sort(
					(a, b) =>
						new Date(b.created_at).getTime() -
						new Date(a.created_at).getTime()
				)
				.slice(0, limit);
		} else {
			let query = supabase
				.from("tweets")
				.select(
					`
          *,
          profiles (*)
        `
				)
				.order("created_at", { ascending: false })
				.limit(limit);

			if (cursor) {
				query = query.lt("created_at", cursor);
			}

			const { data, error } = await query;

			if (error) throw error;
			tweets = data || [];
		}

		const dbTime = performance.now() - dbStart;

		if (shouldCache) {
			const cacheSetStart = performance.now();
			await measureAsync("cache.timeline.set", async () => {
				try {
					await redis.setex(
						cacheKey,
						cacheTTL.timeline,
						JSON.stringify({
							tweets,
							hasMore: tweets.length === limit,
							nextCursor:
								tweets.length > 0
									? tweets[tweets.length - 1].created_at
									: null,
						})
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
		}

		return {
			tweets,
			hasMore: tweets.length === limit,
			nextCursor:
				tweets.length > 0 ? tweets[tweets.length - 1].created_at : null,
		};
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
	} catch (error) {
		console.error("Error invalidating followers cache:", error);
	}
}
