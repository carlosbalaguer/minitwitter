"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeTweetsProps {
	userId: string;
	filter: "all" | "following";
	onNewTweet?: (tweet: any) => void;
}

export function useRealtimeTweets({
	userId,
	filter,
	onNewTweet,
}: RealtimeTweetsProps) {
	const [newTweetsCount, setNewTweetsCount] = useState(0);
	const [channel, setChannel] = useState<RealtimeChannel | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const supabase = createClient();

	useEffect(() => {
		const realtimeChannel = supabase
			.channel("tweets-channel")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "tweets",
				},
				async (payload) => {
					console.log("🔴 New tweet received:", payload);

					const { data: tweet } = await supabase
						.from("tweets")
						.select(
							`
              *,
              profiles (*)
            `
						)
						.eq("id", payload.new.id)
						.single();

					if (!tweet) return;

					if (filter === "following") {
						const { data: isFollowing } = await supabase
							.from("follows")
							.select("follower_id")
							.eq("follower_id", userId)
							.eq("following_id", tweet.user_id)
							.single();

						if (!isFollowing && tweet.user_id !== userId) {
							console.log(
								"🚫 Tweet from user not followed, skipping"
							);
							return;
						}
					}

					setNewTweetsCount((prev) => prev + 1);

					if (onNewTweet) {
						onNewTweet(tweet);
					}
				}
			)
			.subscribe((status) => {
				console.log("📡 Realtime status:", status);

				if (status === "SUBSCRIBED") {
					console.log("✅ Successfully connected to realtime");
					setIsConnected(true);
				} else if (
					status === "CHANNEL_ERROR" ||
					status === "TIMED_OUT"
				) {
					console.error("❌ Realtime connection error:", status);
					setIsConnected(false);
				} else if (status === "CLOSED") {
					console.log("🔌 Realtime connection closed");
					setIsConnected(false);
				}
			});

		setChannel(realtimeChannel);

		return () => {
			console.log("🔌 Unsubscribing from realtime");
			setIsConnected(false);
			realtimeChannel.unsubscribe();
		};
	}, [userId, filter]);

	const resetCount = () => {
		setNewTweetsCount(0);
	};

	return {
		newTweetsCount,
		resetCount,
		isConnected,
	};
}
