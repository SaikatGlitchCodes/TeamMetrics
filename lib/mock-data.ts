import type { Developer, Team, GitHubMetrics } from "./types"

export const mockDevelopers: Developer[] = [
  { id: "1", name: "Alice Johnson", username: "alice-j", email: "alice@company.com" },
  { id: "2", name: "Bob Smith", username: "bob-smith", email: "bob@company.com" },
  { id: "3", name: "Carol Williams", username: "carol-w", email: "carol@company.com" },
  { id: "4", name: "David Chen", username: "david-chen", email: "david@company.com" },
  { id: "5", name: "Emma Davis", username: "emma-d", email: "emma@company.com" },
  { id: "6", name: "Frank Miller", username: "frank-m", email: "frank@company.com" },
  { id: "7", name: "Grace Lee", username: "grace-lee", email: "grace@company.com" },
  { id: "8", name: "Henry Brown", username: "henry-b", email: "henry@company.com" },
]

export const mockTeams: Team[] = [
  {
    id: "team-1",
    name: "Pharmacy",
    description: "Pharmacy management system",
    members: ["1", "2", "3"],
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "team-2",
    name: "RedBox",
    description: "RedBox platform features",
    members: ["4", "5", "6"],
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "team-3",
    name: "Grocery",
    description: "Grocery delivery system",
    members: ["7", "8", "1"],
    createdAt: new Date("2025-02-01"),
  },
  {
    id: "team-4",
    name: "Infrastructure",
    description: "Core infrastructure & DevOps",
    members: ["2", "4", "7"],
    createdAt: new Date("2025-02-15"),
  },
]

// Generate mock metrics with realistic variation
function generateMetrics(developerId: string): GitHubMetrics {
  const baseScore = Math.random() * 100
  const reviewActivityMultiplier = Math.random() * 2

  return {
    developerId,
    period: "2025-11-01:2025-11-05",
    prCreated: Math.floor(Math.random() * 8) + 2,
    prMerged: Math.floor(Math.random() * 7) + 1,
    prRejected: Math.floor(Math.random() * 3),
    prReviewTime: Math.floor(Math.random() * 24) + 4,
    commitCount: Math.floor(Math.random() * 25) + 5,
    reviewCommentsGiven: Math.floor(Math.random() * 50 * reviewActivityMultiplier) + 10,
    reviewCommentsReceived: Math.floor(Math.random() * 30 * reviewActivityMultiplier) + 5,
    issuesCreated: Math.floor(Math.random() * 5),
    issuesClosed: Math.floor(Math.random() * 4),
    linesAdded: Math.floor(Math.random() * 2000) + 500,
    linesDeleted: Math.floor(Math.random() * 1500) + 300,
    collaborationScore: Math.min(100, baseScore + Math.random() * 30),
    productivityScore: Math.min(100, baseScore + Math.random() * 35),
    reviewQualityScore: Math.min(100, baseScore + Math.random() * 40),
    updatedAt: new Date(),
  }
}

export const mockMetrics: GitHubMetrics[] = mockDevelopers.map((dev) => generateMetrics(dev.id))
