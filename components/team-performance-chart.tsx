"use client"

import { useMemo } from "react"
import type { GitHubMetrics } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TeamPerformanceChartProps {
  metrics: GitHubMetrics[]
  developerNames: Record<string, string>
}

export function TeamPerformanceChart({ metrics, developerNames }: TeamPerformanceChartProps) {
  const data = useMemo(() => {
    return metrics.map((m) => ({
      name: developerNames[m.developerId] || `Dev ${m.developerId}`,
      productivity: Math.round(m.productivityScore),
      collaboration: Math.round(m.collaborationScore),
      quality: Math.round(m.reviewQualityScore),
    }))
  }, [metrics, developerNames])

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Performance Scores by Developer</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
          <Legend />
          <Bar dataKey="productivity" fill="hsl(var(--chart-1))" />
          <Bar dataKey="collaboration" fill="hsl(var(--chart-2))" />
          <Bar dataKey="quality" fill="hsl(var(--chart-3))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
