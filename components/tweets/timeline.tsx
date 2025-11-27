import { createClient } from "@/lib/supabase/server";
import { TweetWithProfile } from "@/types/database.types";
import TweetCard from "./tweet-card";

interface TimelineProps {
	filter?: "all" | "following";
}

export default async function Timeline({ filter = "all" }: TimelineProps) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	let query = supabase
		.from("tweets")
		.select(
			`
      *,
      profiles (*)
    `
		)
		.order("created_at", { ascending: false });

	if (filter === "following") {
		const { data: followingData } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", user.id);

		const followingIds = followingData?.map((f) => f.following_id) || [];

		followingIds.push(user.id);

		query = query.in("user_id", followingIds);
	}

	const { data: tweets, error } = await query.limit(50);

	if (error) {
		console.error("Error fetching tweets:", error);
		return <div>Error loading timeline</div>;
	}

	if (!tweets || tweets.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-8 text-center">
				<p className="text-gray-500">
					{filter === "following"
						? "No tweets from people you follow. Try following some users!"
						: "No tweets yet. Start tweeting!"}
				</p>
			</div>
		);
	}

	return (
		<div>
			{tweets.map((tweet) => (
				<TweetCard key={tweet.id} tweet={tweet as TweetWithProfile} />
			))}
		</div>
	);
}
