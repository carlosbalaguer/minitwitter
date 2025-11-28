"use client";

import { trackFollow, trackUnfollow } from "@/lib/analytics";
import { useState } from "react";

interface FollowButtonProps {
	followingId: string;
	initialIsFollowing: boolean;
	onFollowChange?: (isFollowing: boolean) => void;
	username?: string;
}

export default function FollowButton({
	followingId,
	initialIsFollowing,
	onFollowChange,
	username,
}: FollowButtonProps) {
	const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = async () => {
		setIsLoading(true);

		try {
			const response = await fetch("/api/follows", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					following_id: followingId,
					is_following: isFollowing,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to toggle follow");
			}

			const newFollowingState = !isFollowing;
			setIsFollowing(newFollowingState);

			if (username) {
				if (newFollowingState) {
					trackFollow(followingId, username);
				} else {
					trackUnfollow(followingId, username);
				}
			}

			if (onFollowChange) {
				onFollowChange(newFollowingState);
			}
		} catch (error) {
			console.error("Error toggling follow:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleClick}
			disabled={isLoading}
			className={`px-4 py-1 rounded-full font-semibold transition-colors ${
				isFollowing
					? "bg-gray-200 text-gray-800 hover:bg-gray-300"
					: "bg-blue-500 text-white hover:bg-blue-600"
			} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			{isLoading ? "..." : isFollowing ? "Following" : "Follow"}
		</button>
	);
}
