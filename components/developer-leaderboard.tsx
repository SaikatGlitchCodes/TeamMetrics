"use client"

import type { Developer, GitHubMetrics } from "@/lib/types"
import { ArrowUp, Trophy } from "lucide-react"

interface DeveloperLeaderboardProps {
  developers: Developer[]
  metrics: GitHubMetrics[]
  limit?: number
}

export function DeveloperLeaderboard({ developers, metrics, limit = 5 }: DeveloperLeaderboardProps) {
  const leaderboard = metrics
    .map((m) => {
      const dev = developers.find((d) => d.id === m.developerId)
      const overallScore = (m.productivityScore + m.collaborationScore + m.reviewQualityScore) / 3
      return { developer: dev, metrics: m, overallScore }
    })
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.developer?.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-foreground">{entry.developer?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{entry.developer?.username}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg text-primary">{Math.round(entry.overallScore)}%</div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <ArrowUp size={12} />
                Overall Score
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
