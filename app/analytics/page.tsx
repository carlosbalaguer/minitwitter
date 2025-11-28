import AnalyticsDashboard from "@/components/analytics/analytics-dashboard";
import {
	getDailyActiveUsers,
	getEngagementMetrics,
	getEventStats,
	getRealtimeStats,
	getTopUsers,
	getUserActivity,
} from "@/lib/supabase/analytics-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/");
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	if (profile?.username !== "carlosbalaguer5") {
		redirect("/home");
	}

	const [
		dailyActiveUsers,
		userActivity,
		topUsers,
		realtimeStats,
		engagementMetrics,
		eventStats,
	] = await Promise.all([
		getDailyActiveUsers(supabase, 7),
		getUserActivity(supabase, 7),
		getTopUsers(supabase, 10),
		getRealtimeStats(supabase),
		getEngagementMetrics(supabase),
		getEventStats(supabase, 7),
	]);

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center space-x-6">
						<div>
							<h1 className="text-2xl font-bold">
								📈 Analytics Dashboard
							</h1>
							<p className="text-sm text-gray-600">Last 7 days</p>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<a
							href="/admin"
							className="text-sm text-blue-500 hover:text-blue-600 font-medium"
						>
							📊 Metrics
						</a>
						<a
							href="/home"
							className="text-sm text-gray-600 hover:text-gray-800 font-medium"
						>
							← Back to Home
						</a>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto p-4">
				<AnalyticsDashboard
					dailyActiveUsers={dailyActiveUsers}
					userActivity={userActivity}
					topUsers={topUsers}
					realtimeStats={realtimeStats}
					engagementMetrics={engagementMetrics}
					eventStats={eventStats}
				/>
			</main>
		</div>
	);
}
