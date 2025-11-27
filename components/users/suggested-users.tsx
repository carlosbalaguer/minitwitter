import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database.types";
import FollowButton from "./follow-button";

export default async function SuggestedUsers() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	// Get users you're not following (excluding yourself)
	const { data: profiles } = await supabase
		.from("profiles")
		.select("*")
		.neq("id", user.id)
		.limit(5);

	if (!profiles || profiles.length === 0) {
		return null;
	}

	// Check which users you're already following
	const { data: followingData } = await supabase
		.from("follows")
		.select("following_id")
		.eq("follower_id", user.id);

	const followingIds = new Set(
		followingData?.map((f) => f.following_id) || []
	);

	return (
		<div className="bg-white rounded-lg shadow-md p-4">
			<h2 className="font-bold text-lg mb-4">Suggested Users</h2>

			<div className="space-y-3">
				{profiles.map((profile: Profile) => (
					<div
						key={profile.id}
						className="flex items-center justify-between"
					>
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
								{profile.username[0].toUpperCase()}
							</div>
							<div>
								<div className="font-medium text-gray-900">
									{profile.full_name || profile.username}
								</div>
								<div className="text-sm text-gray-500">
									@{profile.username}
								</div>
							</div>
						</div>

						<FollowButton
							userId={profile.id}
							isFollowing={followingIds.has(profile.id)}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
