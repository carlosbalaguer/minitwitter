"use client";

import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface RealtimeFollowsProps {
	userId: string;
	onNewFollower?: (follower: any) => void;
}

export function useRealtimeFollows({
	userId,
	onNewFollower,
}: RealtimeFollowsProps) {
	const [newFollowersCount, setNewFollowersCount] = useState(0);
	const [channel, setChannel] = useState<RealtimeChannel | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [latestFollower, setLatestFollower] = useState<string | null>(null);
	const supabase = createClient();

	useEffect(() => {
		const realtimeChannel = supabase
			.channel("follows-channel")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "follows",
					filter: `following_id=eq.${userId}`,
				},
				async (payload) => {
					console.log("👤 New follower received:", payload);

					const { data: follower } = await supabase
						.from("profiles")
						.select("*")
						.eq("id", payload.new.follower_id)
						.single();

					if (!follower) return;

					console.log(
						`✨ ${follower.username} started following you!`
					);

					setNewFollowersCount((prev) => prev + 1);
					setLatestFollower(follower.username);

					if (onNewFollower) {
						onNewFollower(follower);
					}

					setTimeout(() => {
						setLatestFollower(null);
					}, 5000);
				}
			)
			.subscribe((status) => {
				console.log("📡 Follows realtime status:", status);

				if (status === "SUBSCRIBED") {
					console.log(
						"✅ Successfully connected to follows realtime"
					);
					setIsConnected(true);
				} else if (
					status === "CHANNEL_ERROR" ||
					status === "TIMED_OUT"
				) {
					console.error(
						"❌ Follows realtime connection error:",
						status
					);
					setIsConnected(false);
				} else if (status === "CLOSED") {
					console.log("🔌 Follows realtime connection closed");
					setIsConnected(false);
				}
			});

		setChannel(realtimeChannel);

		return () => {
			console.log("🔌 Unsubscribing from follows realtime");
			setIsConnected(false);
			realtimeChannel.unsubscribe();
		};
	}, [userId]);

	const dismissNotification = () => {
		setLatestFollower(null);
	};

	return {
		newFollowersCount,
		latestFollower,
		isConnected,
		dismissNotification,
	};
}
