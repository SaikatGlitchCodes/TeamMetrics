/**
 * Engineer Export Helper
 * 
 * This utility provides helper functions to transform API data into the format
 * required by the monthly engineer export functionality in export-utils.ts
 */

import { exportEngineerMonthlyData } from './export-utils';

export interface EngineerMetricsAPIResponse {
  username: string;
  name?: string;
  email?: string;
  joinDate?: string;
  monthlyMetrics: {
    month: number;
    year: number;
    prCount: number;
    mergedPRs: number;
    rejectedPRs: number;
    commitCount: number;
    reviewCommentsGiven: number;
    reviewCommentsReceived: number;
    issuesCreated: number;
    issuesClosed: number;
    linesAdded: number;
    linesDeleted: number;
    teamComments: number;
    externalComments: number;
    productivityScore: number;
    collaborationScore: number;
    reviewQualityScore: number;
  }[];
}

/**
 * Transform API response data into EngineerData format for export
 */
export function transformApiDataForExport(apiResponse: EngineerMetricsAPIResponse[]) {
  return apiResponse.map(engineer => {
    const monthlyData = engineer.monthlyMetrics.map(metric => ({
      month: String(metric.month).padStart(2, '0'),
      year: metric.year,
      prCount: metric.prCount,
      mergedPRs: metric.mergedPRs,
      rejectedPRs: metric.rejectedPRs,
      mergeRate: metric.prCount > 0 
        ? ((metric.mergedPRs / metric.prCount) * 100)
        : 0,
      commitCount: metric.commitCount,
      reviewCommentsGiven: metric.reviewCommentsGiven,
      reviewCommentsReceived: metric.reviewCommentsReceived,
      issuesCreated: metric.issuesCreated,
      issuesClosed: metric.issuesClosed,
      linesAdded: metric.linesAdded,
      linesDeleted: metric.linesDeleted,
      teamComments: metric.teamComments,
      externalComments: metric.externalComments,
      productivityScore: metric.productivityScore,
      collaborationScore: metric.collaborationScore,
      reviewQualityScore: metric.reviewQualityScore,
    }));

    const totalPRs = engineer.monthlyMetrics.reduce((sum, m) => sum + m.prCount, 0);
    const totalMergedPRs = engineer.monthlyMetrics.reduce((sum, m) => sum + m.mergedPRs, 0);
    const totalCommits = engineer.monthlyMetrics.reduce((sum, m) => sum + m.commitCount, 0);
    const totalReviews = engineer.monthlyMetrics.reduce((sum, m) => sum + m.reviewCommentsGiven, 0);
    const totalTeamComments = engineer.monthlyMetrics.reduce((sum, m) => sum + m.teamComments, 0);
    const totalExternalComments = engineer.monthlyMetrics.reduce((sum, m) => sum + m.externalComments, 0);

    const avgProductivity = engineer.monthlyMetrics.length > 0
      ? engineer.monthlyMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / engineer.monthlyMetrics.length
      : 0;

    const avgCollaboration = engineer.monthlyMetrics.length > 0
      ? engineer.monthlyMetrics.reduce((sum, m) => sum + m.collaborationScore, 0) / engineer.monthlyMetrics.length
      : 0;

    const avgReviewQuality = engineer.monthlyMetrics.length > 0
      ? engineer.monthlyMetrics.reduce((sum, m) => sum + m.reviewQualityScore, 0) / engineer.monthlyMetrics.length
      : 0;

    return {
      username: engineer.username,
      name: engineer.name,
      email: engineer.email,
      joinDate: engineer.joinDate,
      totalPRs,
      totalMergedPRs,
      totalCommits,
      totalReviews,
      totalTeamComments,
      totalExternalComments,
      monthlyData,
      averageProductivity: avgProductivity,
      averageCollaboration: avgCollaboration,
      averageReviewQuality: avgReviewQuality,
    };
  });
}

/**
 * Fetch engineer monthly metrics from API and export to Excel/CSV
 */
export async function fetchAndExportEngineerMetrics(
  teamId: string,
  teamName: string,
  format: 'csv' | 'excel' = 'excel'
) {
  try {
    // Fetch monthly metrics from your backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
    const response = await fetch(
      `${apiUrl}/engineer-metrics/${teamId}/monthly`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch engineer metrics: ${response.status}`);
    }

    const apiData: EngineerMetricsAPIResponse[] = await response.json();

    // Transform data to export format
    const engineerData = transformApiDataForExport(apiData);

    // Determine period based on data
    const allMonths = apiData.flatMap(e => e.monthlyMetrics);
    const minYear = Math.min(...allMonths.map(m => m.year));
    const maxYear = Math.max(...allMonths.map(m => m.year));
    const period = minYear === maxYear 
      ? `Year ${maxYear}`
      : `${minYear}-${maxYear}`;

    // Export the data
    exportEngineerMonthlyData(teamName, engineerData, period, format);
  } catch (error) {
    console.error('Error fetching and exporting engineer metrics:', error);
    throw error;
  }
}

/**
 * Export engineer metrics from local data
 */
export function exportEngineerMetricsFromLocalData(
  teamName: string,
  engineers: EngineerMetricsAPIResponse[],
  format: 'csv' | 'excel' = 'excel'
) {
  try {
    const engineerData = transformApiDataForExport(engineers);
    const period = `Last 12 months`;
    
    exportEngineerMonthlyData(teamName, engineerData, period, format);
  } catch (error) {
    console.error('Error exporting engineer metrics:', error);
    throw error;
  }
}
