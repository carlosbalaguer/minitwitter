"use client";

import { Profile } from "@/types/database.types";
import { useState } from "react";
import FollowButton from "./follow-button";

interface SuggestedUsersProps {
	initialProfiles: Profile[];
	initialFollowingIds: Set<string>;
}

export default function SuggestedUsers({
	initialProfiles,
	initialFollowingIds,
}: SuggestedUsersProps) {
	const [profiles] = useState<Profile[]>(initialProfiles);
	const [followingIds, setFollowingIds] =
		useState<Set<string>>(initialFollowingIds);

	const handleFollowChange = (userId: string, isFollowing: boolean) => {
		setFollowingIds((prev) => {
			const newSet = new Set(prev);
			if (isFollowing) {
				newSet.delete(userId);
			} else {
				newSet.add(userId);
			}
			return newSet;
		});
	};

	// Filtrar usuarios que NO seguimos
	const suggestedProfiles = profiles.filter(
		(profile) => !followingIds.has(profile.id)
	);

	if (suggestedProfiles.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-4">
			<h2 className="text-xl font-bold mb-4">Suggested Users</h2>
			<div className="space-y-4">
				{suggestedProfiles.map((profile) => (
					<div
						key={profile.id}
						className="flex items-center justify-between"
					>
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
								{profile.username[0].toUpperCase()}
							</div>
							<div>
								<p className="font-semibold">
									{profile.full_name || profile.username}
								</p>
								<p className="text-sm text-gray-500">
									@{profile.username}
								</p>
							</div>
						</div>
						<FollowButton
							followingId={profile.id}
							initialIsFollowing={followingIds.has(profile.id)}
							onFollowChange={(isFollowing) =>
								handleFollowChange(profile.id, isFollowing)
							}
							username={profile.username}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
