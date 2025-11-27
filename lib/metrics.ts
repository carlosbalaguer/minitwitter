export class PerformanceMetrics {
	private static metrics: Map<string, number[]> = new Map();

	static record(metricName: string, value: number) {
		if (!this.metrics.has(metricName)) {
			this.metrics.set(metricName, []);
		}
		this.metrics.get(metricName)!.push(value);
	}

	static getMetrics() {
		const result: Record<string, any> = {};

		this.metrics.forEach((values, name) => {
			const sorted = [...values].sort((a, b) => a - b);
			const avg = values.reduce((a, b) => a + b, 0) / values.length;
			const p50 = sorted[Math.floor(sorted.length * 0.5)];
			const p95 = sorted[Math.floor(sorted.length * 0.95)];
			const p99 = sorted[Math.floor(sorted.length * 0.99)];
			const max = sorted[sorted.length - 1];
			const min = sorted[0];

			result[name] = {
				count: values.length,
				avg: Math.round(avg),
				min: Math.round(min),
				max: Math.round(max),
				p50: Math.round(p50),
				p95: Math.round(p95),
				p99: Math.round(p99),
			};
		});

		return result;
	}

	static clear() {
		this.metrics.clear();
	}
}

export function measureAsync<T>(
	metricName: string,
	fn: () => Promise<T>
): Promise<T> {
	const start = performance.now();

	return fn().finally(() => {
		const duration = performance.now() - start;
		PerformanceMetrics.record(metricName, duration);
	});
}

export function measure<T>(metricName: string, fn: () => T): T {
	const start = performance.now();

	try {
		return fn();
	} finally {
		const duration = performance.now() - start;
		PerformanceMetrics.record(metricName, duration);
	}
}
