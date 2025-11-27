export type Profile = {
	id: string;
	username: string;
	full_name: string | null;
	bio: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	is_celebrity?: boolean;
};

export type Tweet = {
	id: string;
	user_id: string;
	content: string;
	created_at: string;
	profiles?: Profile;
	source?: "precomputed" | "celebrity";
};

export type Follow = {
	follower_id: string;
	following_id: string;
	created_at: string;
};

export type TweetWithProfile = Tweet & {
	profiles: Profile;
};

export type Timeline = {
	id: string;
	user_id: string;
	tweet_id: string;
	created_at: string;
};

export type TimelineWithTweet = Timeline & {
	tweets: TweetWithProfile;
};
