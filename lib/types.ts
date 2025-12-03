// Data models for the dashboard
export interface Developer {
  id: string
  name: string
  username: string
  avatar?: string
  email: string
}

export interface Team {
  id: string
  name: string
  description: string
  members: string[] // developer IDs
  createdAt: Date
}

export interface GitHubMetrics {
  developerId: string
  period: string // e.g., "2025-11-01:2025-11-05"

  // Pull Request Metrics
  prCreated: number
  prMerged: number
  prRejected: number
  prReviewTime: number // average hours

  // Commits
  commitCount: number

  // Code Review
  reviewCommentsGiven: number
  reviewCommentsReceived: number

  // Issues
  issuesCreated: number
  issuesClosed: number

  // Code Changes
  linesAdded: number
  linesDeleted: number

  // Calculated Metrics
  collaborationScore: number // 0-100
  productivityScore: number // 0-100
  reviewQualityScore: number // 0-100

  updatedAt: Date
}

export interface FilterOptions {
  teams: string[]
  minComments: number
  maxComments: number
  dateRange: {
    start: Date
    end: Date
  }
  sortBy: "name" | "productivity" | "collaboration" | "reviews" | "comments"
  sortOrder: "asc" | "desc"
  metricsFilter: {
    minPRs: number
    minCommits: number
    minCommentCount: number
  }
}

// PR Comment Analysis Types
export interface GitHubUser {
  login: string
  id: number
  name: string | null
  avatar_url: string
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  html_url: string
  state: "open" | "closed"
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  user: GitHubUser
  comments: number
  review_comments: number
  commits: number
  additions: number
  deletions: number
  changed_files: number
}

export interface GitHubComment {
  id: number
  user: GitHubUser
  created_at: string
  updated_at: string
  body: string
  html_url: string
  author_association: "OWNER" | "MEMBER" | "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIME_CONTRIBUTOR" | "FIRST_TIMER" | "NONE"
}

export interface PRCommentAnalysis {
  pr: GitHubPullRequest
  totalComments: number
  teamMemberComments: number
  externalComments: number
  comments: GitHubComment[]
  teamMembersList: string[] // list of team member usernames
}

export interface QuarterlyCommentData {
  quarter: string
  totalPRs: number
  totalComments: number
  teamMemberComments: number
  externalComments: number
  teamMemberPercent: number
  externalPercent: number
}

export interface TeamMember {
  id: string
  team_id: string
  github_user_id: string
  github_user: {
    id: string
    github_username: string
    github_id: number
    display_name: string
    avatar_url: string
  }
}

export interface PRCommentAnalysisProps {
  teamId: string
  teamName: string
  comparisonTeamId?: string
  comparisonTeamName?: string
  githubToken?: string
  githubOrg?: string
  useEnterprise?: boolean
  repositories?: Array<{ owner: string; repo: string }>
}
