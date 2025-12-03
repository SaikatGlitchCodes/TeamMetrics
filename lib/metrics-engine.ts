import type { GitHubMetrics } from "./types"

export interface RawGitHubData {
  prsCreated: number
  prsMerged: number
  prsRejected: number
  prReviewTimeHours: number
  commitCount: number
  reviewCommentsGiven: number
  reviewCommentsReceived: number
  issuesCreated: number
  issuesClosed: number
  linesAdded: number
  linesDeleted: number
  reviewParticipationRate: number // 0-1
}

export class MetricsEngine {
  /**
   * Calculate performance scores based on raw GitHub metrics
   */
  static calculateScores(data: RawGitHubData): {
    productivityScore: number
    collaborationScore: number
    reviewQualityScore: number
  } {
    // Productivity Score: based on commits, PRs created, and code changes
    const productivityScore = this.calculateProductivityScore(
      data.commitCount,
      data.prsCreated,
      data.linesAdded,
      data.linesDeleted,
    )

    // Collaboration Score: based on PR reviews, comments, and issues
    const collaborationScore = this.calculateCollaborationScore(
      data.reviewCommentsGiven,
      data.reviewCommentsReceived,
      data.issuesCreated,
      data.prReviewTimeHours,
      data.reviewParticipationRate,
    )

    // Review Quality Score: based on review comments and merge rate
    const reviewQualityScore = this.calculateReviewQualityScore(
      data.prsMerged,
      data.prsCreated,
      data.reviewCommentsGiven,
      data.prReviewTimeHours,
    )

    return {
      productivityScore: Math.min(100, productivityScore),
      collaborationScore: Math.min(100, collaborationScore),
      reviewQualityScore: Math.min(100, reviewQualityScore),
    }
  }

  private static calculateProductivityScore(
    commits: number,
    prsCreated: number,
    linesAdded: number,
    linesDeleted: number,
  ): number {
    // Normalize metrics to 0-100 scale
    const commitScore = Math.min(100, (commits / 20) * 100) // 20 commits = 100
    const prScore = Math.min(100, (prsCreated / 8) * 100) // 8 PRs = 100
    const codeChangeScore = Math.min(100, ((linesAdded + linesDeleted) / 3000) * 100) // 3000 lines = 100

    // Weighted average: 40% commits, 35% PRs, 25% code changes
    return commitScore * 0.4 + prScore * 0.35 + codeChangeScore * 0.25
  }

  private static calculateCollaborationScore(
    commentsGiven: number,
    commentsReceived: number,
    issuesCreated: number,
    reviewTimeHours: number,
    participationRate: number,
  ): number {
    const commentScore = Math.min(100, ((commentsGiven + commentsReceived) / 80) * 100) // 80 comments = 100
    const issueScore = Math.min(100, (issuesCreated / 5) * 100) // 5 issues = 100
    const responseTimeScore = Math.max(0, 100 - reviewTimeHours * 2) // Faster response = higher score
    const participationScore = participationRate * 100

    // Weighted average: 35% comments, 25% issues, 20% response time, 20% participation
    return commentScore * 0.35 + issueScore * 0.25 + responseTimeScore * 0.2 + participationScore * 0.2
  }

  private static calculateReviewQualityScore(
    prsMerged: number,
    prsCreated: number,
    reviewComments: number,
    reviewTimeHours: number,
  ): number {
    const mergeRate = prsCreated > 0 ? (prsMerged / prsCreated) * 100 : 0
    const commentDepthScore = Math.min(100, (reviewComments / 40) * 100) // Average 40 comments = 100
    const responseTimeScore = Math.max(0, 100 - reviewTimeHours) // Lower review time = higher score

    // Weighted average: 50% merge rate, 30% comment depth, 20% response time
    return mergeRate * 0.5 + commentDepthScore * 0.3 + responseTimeScore * 0.2
  }

  /**
   * Convert raw GitHub data to GitHubMetrics format
   */
  static toMetrics(developerId: string, data: RawGitHubData, period = "2025-11-01:2025-11-05"): GitHubMetrics {
    const scores = this.calculateScores(data)

    return {
      developerId,
      period,
      prCreated: data.prsCreated,
      prMerged: data.prsMerged,
      prRejected: data.prsRejected,
      prReviewTime: Math.round(data.prReviewTimeHours),
      commitCount: data.commitCount,
      reviewCommentsGiven: data.reviewCommentsGiven,
      reviewCommentsReceived: data.reviewCommentsReceived,
      issuesCreated: data.issuesCreated,
      issuesClosed: data.issuesClosed,
      linesAdded: data.linesAdded,
      linesDeleted: data.linesDeleted,
      collaborationScore: scores.collaborationScore,
      productivityScore: scores.productivityScore,
      reviewQualityScore: scores.reviewQualityScore,
      updatedAt: new Date(),
    }
  }
}
