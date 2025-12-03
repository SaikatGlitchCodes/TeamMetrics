export function calculateMetricTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function getMetricColor(score: number, threshold = 70): string {
  if (score >= threshold) return "text-green-600 dark:text-green-400"
  if (score >= threshold - 20) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export function formatMetricValue(value: number, type: "number" | "hours" | "score"): string {
  if (type === "hours") return `${Math.round(value)}h`
  if (type === "score") return `${Math.round(value)}%`
  return value.toString()
}

export function getMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    prCreated: "PRs Created",
    prMerged: "PRs Merged",
    prRejected: "PRs Rejected",
    prReviewTime: "Avg Review Time",
    commitCount: "Commits",
    reviewCommentsGiven: "Comments Given",
    reviewCommentsReceived: "Comments Received",
    issuesCreated: "Issues Created",
    issuesClosed: "Issues Closed",
    linesAdded: "Lines Added",
    linesDeleted: "Lines Deleted",
    collaborationScore: "Collaboration",
    productivityScore: "Productivity",
    reviewQualityScore: "Review Quality",
  }
  return labels[key] || key
}
