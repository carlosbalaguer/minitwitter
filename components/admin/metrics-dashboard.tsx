"use client";

import { useEffect, useState } from "react";

interface MetricData {
	count: number;
	avg: number;
	min: number;
	max: number;
	p50: number;
	p95: number;
	p99: number;
}

export default function MetricsDashboard() {
	const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMetrics = async () => {
			try {
				const response = await fetch("/api/metrics");
				const data = await response.json();
				setMetrics(data.aggregated || {});
			} catch (error) {
				console.error("Error fetching metrics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchMetrics();

		// Refresh every 5 seconds
		const interval = setInterval(fetchMetrics, 5000);

		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return <div className="text-center py-8">Loading metrics...</div>;
	}

	const metricEntries = Object.entries(metrics);

	if (metricEntries.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-8 text-center">
				<p className="text-gray-500">
					No metrics collected yet. Navigate around the app to
					generate data.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{metricEntries.map(([name, data]) => (
				<div key={name} className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-bold mb-4">{name}</h2>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<MetricCard
							label="Count"
							value={data.count.toString()}
						/>
						<MetricCard
							label="Average"
							value={`${data.avg}ms`}
							color={getColor(data.avg)}
						/>
						<MetricCard label="P50" value={`${data.p50}ms`} />
						<MetricCard
							label="P95"
							value={`${data.p95}ms`}
							color={getColor(data.p95)}
						/>
						<MetricCard
							label="P99"
							value={`${data.p99}ms`}
							color={getColor(data.p99)}
						/>
						<MetricCard label="Min" value={`${data.min}ms`} />
						<MetricCard
							label="Max"
							value={`${data.max}ms`}
							color={getColor(data.max)}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

function MetricCard({
	label,
	value,
	color = "text-gray-900",
}: {
	label: string;
	value: string;
	color?: string;
}) {
	return (
		<div className="text-center">
			<div className="text-sm text-gray-500 mb-1">{label}</div>
			<div className={`text-2xl font-bold ${color}`}>{value}</div>
		</div>
	);
}

function getColor(ms: number): string {
	if (ms < 100) return "text-green-600";
	if (ms < 500) return "text-yellow-600";
	return "text-red-600";
}
