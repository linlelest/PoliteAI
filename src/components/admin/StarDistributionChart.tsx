"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"

interface DistributionData {
  "1": number
  "2": number
  "3": number
  "4": number
  "5": number
}

const barColors = [
  "#ef4444", // 1 - red
  "#f97316", // 2 - orange
  "#eab308", // 3 - yellow
  "#84cc16", // 4 - light green
  "#22c55e", // 5 - green
]

export function StarDistributionChart({ dimId }: { dimId: string }) {
  const [data, setData] = useState<DistributionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/stats/distribution/${dimId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dimId])

  if (loading) {
    return <div className="h-[200px] animate-pulse rounded bg-muted" />
  }

  if (!data) return null

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  const chartData = [1, 2, 3, 4, 5].map((star) => ({
    name: `${star} 星`,
    count: data[String(star) as keyof DistributionData] || 0,
    pct: total > 0 ? Math.round(((data[String(star) as keyof DistributionData] || 0) / total) * 100) : 0,
    fill: barColors[star - 1],
  }))

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={barColors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}