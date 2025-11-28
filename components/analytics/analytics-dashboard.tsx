"use client";

import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface AnalyticsDashboardProps {
	dailyActiveUsers: any[];
	userActivity: any[];
	topUsers: any[];
	realtimeStats: any;
	engagementMetrics: any;
	eventStats: any;
}

export default function AnalyticsDashboard({
	dailyActiveUsers: initialDailyActiveUsers,
	userActivity: initialUserActivity,
	topUsers: initialTopUsers,
	realtimeStats: initialRealtimeStats,
	engagementMetrics: initialEngagementMetrics,
	eventStats: initialEventStats,
}: AnalyticsDashboardProps) {
	const [realtimeStats, setRealtimeStats] = useState(initialRealtimeStats);
	const [lastUpdate, setLastUpdate] = useState(new Date());
	const [isRefreshing, setIsRefreshing] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			refreshRealtimeStats();
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, []);

	const refreshRealtimeStats = async () => {
		setIsRefreshing(true);
		try {
			window.location.reload();
		} catch (error) {
			console.error("Error refreshing stats:", error);
		} finally {
			setIsRefreshing(false);
			setLastUpdate(new Date());
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<div
						className={`w-3 h-3 rounded-full ${
							isRefreshing
								? "bg-yellow-500 animate-pulse"
								: "bg-green-500"
						}`}
					/>
					<span className="text-sm text-gray-600">
						Last updated: {formatTime(lastUpdate)}
					</span>
				</div>
				<button
					onClick={refreshRealtimeStats}
					disabled={isRefreshing}
					className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isRefreshing ? "Refreshing..." : "🔄 Refresh"}
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<StatCard
					title="Active Users (1h)"
					value={realtimeStats.active_users}
					icon="👥"
					color="blue"
				/>
				<StatCard
					title="Total Events (1h)"
					value={realtimeStats.total_events}
					icon="⚡"
					color="green"
				/>
				<StatCard
					title="Avg Events/User (7d)"
					value={initialEngagementMetrics.avg_events_per_user}
					icon="📊"
					color="purple"
				/>
				<StatCard
					title="Engagement Rate (7d)"
					value={`${initialEngagementMetrics.engagement_rate}%`}
					icon="🎯"
					color="orange"
				/>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">
					📈 Engagement Summary (Last 7 Days)
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<MetricBox
						label="Unique Users"
						value={initialEngagementMetrics.unique_users}
					/>
					<MetricBox
						label="Page Views"
						value={initialEngagementMetrics.page_views}
					/>
					<MetricBox
						label="Tweets Created"
						value={initialEngagementMetrics.tweets_created}
					/>
					<MetricBox
						label="New Follows"
						value={initialEngagementMetrics.follows}
					/>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">
					📅 Daily Active Users
				</h2>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={initialDailyActiveUsers}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line
							type="monotone"
							dataKey="active_users"
							stroke="#3b82f6"
							strokeWidth={2}
							name="Active Users"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">
					🔥 User Activity Breakdown
				</h2>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={initialUserActivity}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="date" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar
							dataKey="page_views"
							fill="#3b82f6"
							name="Page Views"
						/>
						<Bar
							dataKey="tweets_created"
							fill="#10b981"
							name="Tweets Created"
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">🏆 Most Active Users</h2>
				<div className="space-y-3">
					{initialTopUsers.map((user, index) => (
						<div
							key={user.user_id}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
						>
							<div className="flex items-center space-x-3">
								<span className="text-2xl font-bold text-gray-400">
									#{index + 1}
								</span>
								<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
									{user.username[0].toUpperCase()}
								</div>
								<div>
									<p className="font-semibold">
										{user.full_name || user.username}
									</p>
									<p className="text-sm text-gray-500">
										@{user.username}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-2xl font-bold text-blue-600">
									{user.event_count}
								</p>
								<p className="text-xs text-gray-500">events</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-4">
					🎯 Event Types (Last Hour)
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{Object.entries(realtimeStats.events_by_type).map(
						([type, count]: [string, any]) => (
							<div
								key={type}
								className="p-4 bg-gray-50 rounded-lg text-center"
							>
								<p className="text-2xl font-bold text-blue-600">
									{count}
								</p>
								<p className="text-sm text-gray-600 mt-1 capitalize">
									{type.replace("_", " ")}
								</p>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}

function StatCard({ title, value, icon, color }: any) {
	const colorClasses = {
		blue: "bg-blue-500",
		green: "bg-green-500",
		purple: "bg-purple-500",
		orange: "bg-orange-500",
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-600 mb-1">{title}</p>
					<p className="text-3xl font-bold">{value}</p>
				</div>
				<div
					className={`w-12 h-12 ${
						colorClasses[color as keyof typeof colorClasses]
					} rounded-lg flex items-center justify-center text-2xl`}
				>
					{icon}
				</div>
			</div>
		</div>
	);
}

function MetricBox({ label, value }: any) {
	return (
		<div className="text-center">
			<p className="text-3xl font-bold text-blue-600">{value}</p>
			<p className="text-sm text-gray-600 mt-1">{label}</p>
		</div>
	);
}
