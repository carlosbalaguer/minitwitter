import { getTimeline } from "@/lib/supabase/queries";
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

	const startTime = Date.now();

	let tweets: any[] = [];
	let error = null;

	try {
		tweets = await getTimeline(supabase, user.id, filter);
	} catch (e: any) {
		error = e;
	}

	const queryTime = Date.now() - startTime;

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
			{/* Performance indicator (solo en dev) */}
			{process.env.NODE_ENV === "development" && (
				<div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
					⚡ Query time: {queryTime}ms | Tweets: {tweets.length}
				</div>
			)}

			{tweets.map((tweet) => (
				<TweetCard key={tweet.id} tweet={tweet as TweetWithProfile} />
			))}
		</div>
	);
}
