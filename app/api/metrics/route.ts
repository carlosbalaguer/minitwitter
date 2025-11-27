import { NextRequest, NextResponse } from 'next/server'

const metrics: any[] = []

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    metrics.push({
      ...data,
      receivedAt: new Date().toISOString(),
    })

    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Calculate aggregates
  const metricsByName = new Map<string, number[]>()

  metrics.forEach((m) => {
    if (!metricsByName.has(m.metric)) {
      metricsByName.set(m.metric, [])
    }
    metricsByName.get(m.metric)!.push(m.duration)
  })

  const aggregated: Record<string, any> = {}

  metricsByName.forEach((values, name) => {
    const sorted = [...values].sort((a, b) => a - b)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    aggregated[name] = {
      count: values.length,
      avg: Math.round(avg),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
    }
  })

  return NextResponse.json({
    totalMetrics: metrics.length,
    aggregated,
    recentMetrics: metrics.slice(-20),
  })
}