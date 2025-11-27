"use client";

import FollowNotification from "@/components/notifications/follow-notification";
import CreateTweet from "@/components/tweets/create-tweet";
import Timeline from "@/components/tweets/timeline";
import TimelineTabs from "@/components/tweets/timeline-tabs";
import SuggestedUsers from "@/components/users/suggested-users";
import { useRealtimeFollows } from "@/hooks/use-realtime-follows";
import { Profile, TweetWithProfile } from "@/types/database.types";

interface HomeWrapperProps {
	userId: string;
	initialTweets: TweetWithProfile[];
	filter: "all" | "following";
	hasMore: boolean;
	nextCursor: string | null;
	suggestedUsers: Profile[];
	followingIds: Set<string>;
}

export default function HomeWrapper({
	userId,
	initialTweets,
	filter,
	hasMore,
	nextCursor,
	suggestedUsers,
	followingIds,
}: HomeWrapperProps) {
	const { latestFollower, dismissNotification } = useRealtimeFollows({
		userId,
	});

	return (
		<>
			{latestFollower && (
				<FollowNotification
					username={latestFollower}
					onDismiss={dismissNotification}
				/>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<CreateTweet />
					<TimelineTabs />
					<Timeline
						initialTweets={initialTweets}
						filter={filter}
						hasMore={hasMore}
						nextCursor={nextCursor}
						userId={userId}
					/>
				</div>

				<div className="lg:col-span-1">
					<SuggestedUsers
						initialProfiles={suggestedUsers}
						initialFollowingIds={followingIds}
					/>
				</div>
			</div>
		</>
	);
}
