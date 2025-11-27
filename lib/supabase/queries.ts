import { measureAsync } from "@/lib/metrics";
import { SupabaseClient } from "@supabase/supabase-js";

export async function getTimeline(
	supabase: SupabaseClient,
	userId: string,
	filter: "all" | "following"
) {
	return measureAsync("db.timeline.query", async () => {
		if (filter === "following") {
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

			const tweets =
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

			return tweets;
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
			return data || [];
		}
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
