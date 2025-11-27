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

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error("Not authenticated");

			if (isFollowing) {
				// Unfollow
				const { error } = await supabase
					.from("follows")
					.delete()
					.eq("follower_id", user.id)
					.eq("following_id", userId);

				if (error) throw error;
				setIsFollowing(false);
			} else {
				// Follow
				const { error } = await supabase.from("follows").insert({
					follower_id: user.id,
					following_id: userId,
				});

				if (error) throw error;
				setIsFollowing(true);
			}

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
