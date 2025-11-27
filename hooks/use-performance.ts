"use client";

import { useEffect } from "react";

export function usePerformance(metricName: string) {
	useEffect(() => {
		const start = performance.now();

		return () => {
			const duration = performance.now() - start;

			// Send to metrics endpoint
			fetch("/api/metrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					metric: metricName,
					duration,
					timestamp: new Date().toISOString(),
				}),
			}).catch(console.error);
		};
	}, [metricName]);
}
