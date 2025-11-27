"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FollowButtonProps {
	userId: string;
	isFollowing: boolean;
}

export default function FollowButton({
	userId,
	isFollowing: initialIsFollowing,
}: FollowButtonProps) {
	const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
	const [loading, setLoading] = useState(false);

	const router = useRouter();
	const supabase = createClient();

	const handleToggleFollow = async () => {
		setLoading(true);

		const startTime = performance.now();

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error("Not authenticated");

			const response = await fetch("/api/follows", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					follower_id: user.id,
					following_id: userId,
					is_following: isFollowing,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to toggle follow");
			}

			setIsFollowing(!isFollowing);

			const duration = performance.now() - startTime;

			// Send metric
			fetch("/api/metrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					metric: `client.follow.${
						isFollowing ? "unfollow" : "follow"
					}`,
					duration,
					timestamp: new Date().toISOString(),
				}),
			}).catch(console.error);

			router.refresh();
		} catch (error: any) {
			console.error("Error toggling follow:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={handleToggleFollow}
			disabled={loading}
			className={`px-4 py-1.5 rounded-full font-medium text-sm transition-colors disabled:opacity-50 ${
				isFollowing
					? "bg-gray-200 text-gray-900 hover:bg-gray-300"
					: "bg-blue-500 text-white hover:bg-blue-600"
			}`}
		>
			{loading ? "Loading..." : isFollowing ? "Following" : "Follow"}
		</button>
	);
}
