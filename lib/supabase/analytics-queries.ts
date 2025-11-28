import { SupabaseClient } from "@supabase/supabase-js";

export interface EventStats {
	event_type: string;
	count: number;
	date: string;
}

export interface UserActivity {
	date: string;
	active_users: number;
	page_views: number;
	tweets_created: number;
}

export interface TopUser {
	user_id: string;
	username: string;
	full_name: string;
	event_count: number;
}

export async function getEventStats(
	supabase: SupabaseClient,
	days: number = 7
) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const { data, error } = await supabase
		.from("analytics_events")
		.select("event_type, created_at")
		.gte("created_at", startDate.toISOString())
		.order("created_at", { ascending: true });

	if (error) throw error;

	const stats: { [key: string]: { [date: string]: number } } = {};

	data?.forEach((event) => {
		const date = new Date(event.created_at).toISOString().split("T")[0];

		if (!stats[event.event_type]) {
			stats[event.event_type] = {};
		}

		if (!stats[event.event_type][date]) {
			stats[event.event_type][date] = 0;
		}

		stats[event.event_type][date]++;
	});

	return stats;
}

export async function getDailyActiveUsers(
	supabase: SupabaseClient,
	days: number = 7
) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const { data, error } = await supabase
		.from("analytics_events")
		.select("user_id, created_at")
		.gte("created_at", startDate.toISOString())
		.not("user_id", "is", null);

	if (error) throw error;

	const dailyUsers: { [date: string]: Set<string> } = {};

	data?.forEach((event) => {
		const date = new Date(event.created_at).toISOString().split("T")[0];

		if (!dailyUsers[date]) {
			dailyUsers[date] = new Set();
		}

		dailyUsers[date].add(event.user_id);
	});

	return Object.entries(dailyUsers)
		.map(([date, users]) => ({
			date,
			active_users: users.size,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserActivity(
	supabase: SupabaseClient,
	days: number = 7
): Promise<UserActivity[]> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const { data, error } = await supabase
		.from("analytics_events")
		.select("event_type, created_at, user_id")
		.gte("created_at", startDate.toISOString());

	if (error) throw error;

	const activity: { [date: string]: UserActivity } = {};

	data?.forEach((event) => {
		const date = new Date(event.created_at).toISOString().split("T")[0];

		if (!activity[date]) {
			activity[date] = {
				date,
				active_users: 0,
				page_views: 0,
				tweets_created: 0,
			};
		}

		if (event.event_type === "page_view") {
			activity[date].page_views++;
		}

		if (event.event_type === "tweet_create") {
			activity[date].tweets_created++;
		}
	});

	const uniqueUsers: { [date: string]: Set<string> } = {};
	data?.forEach((event) => {
		if (!event.user_id) return;
		const date = new Date(event.created_at).toISOString().split("T")[0];
		if (!uniqueUsers[date]) uniqueUsers[date] = new Set();
		uniqueUsers[date].add(event.user_id);
	});

	Object.entries(uniqueUsers).forEach(([date, users]) => {
		if (activity[date]) {
			activity[date].active_users = users.size;
		}
	});

	return Object.values(activity).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopUsers(
	supabase: SupabaseClient,
	limit: number = 10
): Promise<TopUser[]> {
	const { data, error } = await supabase
		.from("analytics_events")
		.select(
			`
      user_id,
      profiles (username, full_name)
    `
		)
		.not("user_id", "is", null)
		.gte(
			"created_at",
			new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
		);

	if (error) throw error;

	const userCounts: {
		[userId: string]: {
			count: number;
			username: string;
			full_name: string;
		};
	} = {};

	data?.forEach((event: any) => {
		if (!event.user_id || !event.profiles) return;

		if (!userCounts[event.user_id]) {
			userCounts[event.user_id] = {
				count: 0,
				username: event.profiles.username,
				full_name: event.profiles.full_name,
			};
		}

		userCounts[event.user_id].count++;
	});

	return Object.entries(userCounts)
		.map(([user_id, data]) => ({
			user_id,
			username: data.username,
			full_name: data.full_name,
			event_count: data.count,
		}))
		.sort((a, b) => b.event_count - a.event_count)
		.slice(0, limit);
}

export async function getRealtimeStats(supabase: SupabaseClient) {
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

	const { data, error } = await supabase
		.from("analytics_events")
		.select("event_type, user_id, created_at")
		.gte("created_at", oneHourAgo.toISOString());

	if (error) throw error;

	const uniqueUsers = new Set(
		data?.filter((e) => e.user_id).map((e) => e.user_id)
	);

	const eventCounts = data?.reduce((acc: any, event) => {
		acc[event.event_type] = (acc[event.event_type] || 0) + 1;
		return acc;
	}, {});

	return {
		total_events: data?.length || 0,
		active_users: uniqueUsers.size,
		events_by_type: eventCounts || {},
		time_range: "Last hour",
	};
}

export async function getEngagementMetrics(supabase: SupabaseClient) {
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const { data, error } = await supabase
		.from("analytics_events")
		.select("event_type, user_id")
		.gte("created_at", sevenDaysAgo.toISOString());

	if (error) throw error;

	const totalEvents = data?.length || 0;
	const uniqueUsers = new Set(
		data?.filter((e) => e.user_id).map((e) => e.user_id)
	).size;

	const tweets =
		data?.filter((e) => e.event_type === "tweet_create").length || 0;
	const follows = data?.filter((e) => e.event_type === "follow").length || 0;
	const pageViews =
		data?.filter((e) => e.event_type === "page_view").length || 0;

	return {
		total_events: totalEvents,
		unique_users: uniqueUsers,
		avg_events_per_user:
			uniqueUsers > 0 ? (totalEvents / uniqueUsers).toFixed(2) : 0,
		tweets_created: tweets,
		follows: follows,
		page_views: pageViews,
		engagement_rate:
			uniqueUsers > 0
				? (((tweets + follows) / uniqueUsers) * 100).toFixed(2)
				: 0,
	};
}
