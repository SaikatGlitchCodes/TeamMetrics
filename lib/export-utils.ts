import * as XLSX from 'xlsx';

interface TeamMember {
  member: string;
  prCount: number;
  mergedPRs: number;
  mergeRate: number;
  repos: any[];
  averageComments: number;
  issueComments: any[];
  reviewComments: any[];
  teamIssueComments: any[];
  teamReviewComments: any[];
  otherIssueComments: any[];
  otherReviewComments: any[];
  teamCommentsCount: number;
  otherCommentsCount: number;
}

interface MonthlyMetrics {
  month: string;
  year: number;
  prCount: number;
  mergedPRs: number;
  rejectedPRs: number;
  mergeRate: number;
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
}

interface EngineerData {
  username: string;
  name?: string;
  email?: string;
  joinDate?: string;
  totalPRs: number;
  totalMergedPRs: number;
  totalCommits: number;
  totalReviews: number;
  totalTeamComments: number;
  totalExternalComments: number;
  monthlyData: MonthlyMetrics[];
  averageProductivity: number;
  averageCollaboration: number;
  averageReviewQuality: number;
}

interface ExportData {
  teamName: string;
  teamMembers: string[];
  teamMetrics: TeamMember[];
  exportDate: string;
  period: string;
  quarterlyData?: any[];
}

interface EngineerMonthlyExportData {
  teamName: string;
  engineers: EngineerData[];
  exportDate: string;
  period: string;
  generatedAt: string;
}

export function exportToCSV(data: ExportData): void {
  const csvContent = generateCSVContent(data);
  downloadFile(csvContent, `${data.teamName}_performance_report_${data.exportDate}.csv`, 'text/csv');
}

export function exportToJSON(data: ExportData): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${data.teamName}_performance_report_${data.exportDate}.json`, 'application/json');
}

export function exportToMarkdown(data: ExportData): void {
  const markdownContent = generateMarkdownContent(data);
  downloadFile(markdownContent, `${data.teamName}_performance_report_${data.exportDate}.md`, 'text/markdown');
}

export function exportToExcel(data: ExportData): void {
  const workbook = generateExcelWorkbook(data);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.teamName}_performance_report_${data.exportDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function generateCSVContent(data: ExportData): string {
  const headers = [
    'Member',
    'Total PRs',
    'Merged PRs',
    'Merge Rate (%)',
    'Average Comments',
    'Team Comments',
    'External Comments',
    'Total Comments',
    'Team Comment Ratio (%)',
    'External Comment Ratio (%)'
  ];

  const rows = data.teamMetrics.map(member => [
    member.member,
    member.prCount,
    member.mergedPRs,
    member.mergeRate,
    member.averageComments,
    member.teamCommentsCount,
    member.otherCommentsCount,
    member.teamCommentsCount + member.otherCommentsCount,
    member.teamCommentsCount + member.otherCommentsCount > 0 
      ? ((member.teamCommentsCount / (member.teamCommentsCount + member.otherCommentsCount)) * 100).toFixed(1)
      : '0',
    member.teamCommentsCount + member.otherCommentsCount > 0 
      ? ((member.otherCommentsCount / (member.teamCommentsCount + member.otherCommentsCount)) * 100).toFixed(1)
      : '0'
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateMarkdownContent(data: ExportData): string {
  const teamTotals = {
    totalPRs: data.teamMetrics.reduce((sum, m) => sum + m.prCount, 0),
    totalMergedPRs: data.teamMetrics.reduce((sum, m) => sum + m.mergedPRs, 0),
    totalTeamComments: data.teamMetrics.reduce((sum, m) => sum + m.teamCommentsCount, 0),
    totalExternalComments: data.teamMetrics.reduce((sum, m) => sum + m.otherCommentsCount, 0)
  };

  const averageMergeRate = data.teamMetrics.length > 0 
    ? (data.teamMetrics.reduce((sum, m) => sum + m.mergeRate, 0) / data.teamMetrics.length).toFixed(1)
    : '0';

  let markdown = `# ${data.teamName} Performance Report\n\n`;
  markdown += `**Report Generated:** ${new Date(data.exportDate).toLocaleDateString()}\n`;
  markdown += `**Period:** ${data.period}\n`;
  markdown += `**Team Members:** ${data.teamMembers.length}\n\n`;

  // Team Summary
  markdown += `## Team Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total PRs | ${teamTotals.totalPRs} |\n`;
  markdown += `| Merged PRs | ${teamTotals.totalMergedPRs} |\n`;
  markdown += `| Average Merge Rate | ${averageMergeRate}% |\n`;
  markdown += `| Team Comments | ${teamTotals.totalTeamComments} |\n`;
  markdown += `| External Comments | ${teamTotals.totalExternalComments} |\n`;
  markdown += `| Total Comments | ${teamTotals.totalTeamComments + teamTotals.totalExternalComments} |\n\n`;

  // Individual Performance
  markdown += `## Individual Performance\n\n`;
  markdown += `| Member | PRs | Merged | Merge Rate | Avg Comments | Team Comments | External Comments | Total Comments |\n`;
  markdown += `|--------|-----|--------|------------|--------------|---------------|-------------------|----------------|\n`;
  
  data.teamMetrics.forEach(member => {
    const totalComments = member.teamCommentsCount + member.otherCommentsCount;
    markdown += `| ${member.member} | ${member.prCount} | ${member.mergedPRs} | ${member.mergeRate}% | ${member.averageComments} | ${member.teamCommentsCount} | ${member.otherCommentsCount} | ${totalComments} |\n`;
  });

  markdown += `\n## Detailed Member Analysis\n\n`;

  data.teamMetrics.forEach(member => {
    const totalComments = member.teamCommentsCount + member.otherCommentsCount;
    const teamCommentRatio = totalComments > 0 ? ((member.teamCommentsCount / totalComments) * 100).toFixed(1) : '0';
    const externalCommentRatio = totalComments > 0 ? ((member.otherCommentsCount / totalComments) * 100).toFixed(1) : '0';

    markdown += `### ${member.member}\n\n`;
    markdown += `**Pull Requests:**\n`;
    markdown += `- Total PRs: ${member.prCount}\n`;
    markdown += `- Merged PRs: ${member.mergedPRs}\n`;
    markdown += `- Merge Rate: ${member.mergeRate}%\n\n`;
    
    markdown += `**Comments:**\n`;
    markdown += `- Average Comments per PR: ${member.averageComments}\n`;
    markdown += `- Team Member Comments: ${member.teamCommentsCount} (${teamCommentRatio}%)\n`;
    markdown += `- External Comments: ${member.otherCommentsCount} (${externalCommentRatio}%)\n`;
    markdown += `- Total Comments: ${totalComments}\n\n`;

    if (member.repos.length > 0) {
      markdown += `**Recent PRs:**\n`;
      member.repos.slice(0, 5).forEach(pr => {
        const status = pr.pull_request?.merged_at ? '✅ Merged' : pr.state === 'open' ? '🔄 Open' : '❌ Closed';
        markdown += `- [#${pr.number}](${pr.html_url}) ${pr.title} (${status})\n`;
      });
      if (member.repos.length > 5) {
        markdown += `- ... and ${member.repos.length - 5} more PRs\n`;
      }
      markdown += `\n`;
    }
  });

  // Quarterly Data if available
  if (data.quarterlyData && data.quarterlyData.length > 0) {
    markdown += `## Quarterly Trends\n\n`;
    markdown += `| Quarter | Total PRs | Team Comments | External Comments | Total Comments |\n`;
    markdown += `|---------|-----------|---------------|-------------------|----------------|\n`;
    
    data.quarterlyData.forEach(quarter => {
      markdown += `| ${quarter.quarter} | ${quarter.totalPRs} | ${quarter.teamMemberComments} | ${quarter.externalComments} | ${quarter.totalComments} |\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `*Report generated by Hy-vee Activity Tracker on ${new Date().toLocaleString()}*\n`;

  return markdown;
}

function generateExcelWorkbook(data: ExportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Calculate team totals
  const teamTotals = {
    totalPRs: data.teamMetrics.reduce((sum, m) => sum + m.prCount, 0),
    totalMergedPRs: data.teamMetrics.reduce((sum, m) => sum + m.mergedPRs, 0),
    totalTeamComments: data.teamMetrics.reduce((sum, m) => sum + m.teamCommentsCount, 0),
    totalExternalComments: data.teamMetrics.reduce((sum, m) => sum + m.otherCommentsCount, 0)
  };

  const averageMergeRate = data.teamMetrics.length > 0 
    ? (data.teamMetrics.reduce((sum, m) => sum + m.mergeRate, 0) / data.teamMetrics.length).toFixed(1)
    : '0';

  // Team Summary Sheet
  const summaryData = [
    ['Team Performance Report'],
    [''],
    ['Team Name', data.teamName],
    ['Report Generated', new Date(data.exportDate).toLocaleDateString()],
    ['Period', data.period],
    ['Team Members', data.teamMembers.length],
    [''],
    ['Team Summary'],
    ['Metric', 'Value'],
    ['Total PRs', teamTotals.totalPRs],
    ['Merged PRs', teamTotals.totalMergedPRs],
    ['Average Merge Rate (%)', averageMergeRate],
    ['Team Comments', teamTotals.totalTeamComments],
    ['External Comments', teamTotals.totalExternalComments],
    ['Total Comments', teamTotals.totalTeamComments + teamTotals.totalExternalComments]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Individual Performance Sheet
  const performanceData = [
    ['Member', 'Total PRs', 'Merged PRs', 'Merge Rate (%)', 'Average Comments', 'Team Comments', 'External Comments', 'Total Comments', 'Team Comment Ratio (%)', 'External Comment Ratio (%)'],
    ...data.teamMetrics.map(member => {
      const totalComments = member.teamCommentsCount + member.otherCommentsCount;
      const teamCommentRatio = totalComments > 0 ? ((member.teamCommentsCount / totalComments) * 100).toFixed(1) : '0';
      const externalCommentRatio = totalComments > 0 ? ((member.otherCommentsCount / totalComments) * 100).toFixed(1) : '0';
      
      return [
        member.member,
        member.prCount,
        member.mergedPRs,
        member.mergeRate,
        member.averageComments,
        member.teamCommentsCount,
        member.otherCommentsCount,
        totalComments,
        teamCommentRatio,
        externalCommentRatio
      ];
    })
  ];

  const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
  XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Individual Performance');

  // Quarterly Data Sheet (if available)
  if (data.quarterlyData && data.quarterlyData.length > 0) {
    const quarterlyData = [
      ['Quarter', 'Total PRs', 'Team Comments', 'External Comments', 'Total Comments'],
      ...data.quarterlyData.map(quarter => [
        quarter.quarter,
        quarter.totalPRs,
        quarter.teamMemberComments,
        quarter.externalComments,
        quarter.totalComments
      ])
    ];

    const quarterlySheet = XLSX.utils.aoa_to_sheet(quarterlyData);
    XLSX.utils.book_append_sheet(workbook, quarterlySheet, 'Quarterly Trends');
  }

  // PR Details Sheet
  const prDetailsData = [
    ['Member', 'PR Number', 'PR Title', 'Status', 'Created Date', 'PR URL']
  ];

  data.teamMetrics.forEach(member => {
    member.repos.forEach(pr => {
      const status = pr.pull_request?.merged_at ? 'Merged' : pr.state === 'open' ? 'Open' : 'Closed';
      prDetailsData.push([
        member.member,
        pr.number,
        pr.title,
        status,
        new Date(pr.created_at).toLocaleDateString(),
        pr.html_url
      ]);
    });
  });

  const prDetailsSheet = XLSX.utils.aoa_to_sheet(prDetailsData);
  XLSX.utils.book_append_sheet(workbook, prDetailsSheet, 'PR Details');

  return workbook;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportTeamData(
  teamName: string,
  teamMembers: string[],
  teamMetrics: TeamMember[],
  quarterlyData?: any[],
  format: 'csv' | 'json' | 'markdown' | 'excel' = 'excel'
): void {
  const exportData: ExportData = {
    teamName,
    teamMembers,
    teamMetrics,
    exportDate: new Date().toISOString().split('T')[0],
    period: 'Last 3 months',
    quarterlyData
  };

  switch (format) {
    case 'csv':
      exportToCSV(exportData);
      break;
    case 'json':
      exportToJSON(exportData);
      break;
    case 'markdown':
      exportToMarkdown(exportData);
      break;
    case 'excel':
    default:
      exportToExcel(exportData);
      break;
  }
}

// Monthly Engineer Data Export Functions
export function exportEngineerMonthlyDataToExcel(data: EngineerMonthlyExportData): void {
  const workbook = generateEngineerMonthlyExcelWorkbook(data);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.teamName}_engineer_monthly_analysis_${data.exportDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportEngineerMonthlyDataToCSV(data: EngineerMonthlyExportData): void {
  const csvContent = generateEngineerMonthlyCSVContent(data);
  downloadFile(csvContent, `${data.teamName}_engineer_monthly_analysis_${data.exportDate}.csv`, 'text/csv');
}

function generateEngineerMonthlyExcelWorkbook(data: EngineerMonthlyExportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Engineer Monthly Performance Report'],
    [''],
    ['Team Name', data.teamName],
    ['Report Generated', new Date(data.generatedAt).toLocaleDateString()],
    ['Period', data.period],
    ['Total Engineers', data.engineers.length],
    [''],
    ['Engineer Overview'],
    ['Engineer', 'Total PRs', 'Merged PRs', 'Total Commits', 'Total Reviews', 'Team Comments', 'External Comments', 'Avg Productivity', 'Avg Collaboration', 'Avg Review Quality']
  ];

  data.engineers.forEach(engineer => {
    summaryData.push([
      engineer.username,
      engineer.totalPRs,
      engineer.totalMergedPRs,
      engineer.totalCommits,
      engineer.totalReviews,
      engineer.totalTeamComments,
      engineer.totalExternalComments,
      engineer.averageProductivity.toFixed(1),
      engineer.averageCollaboration.toFixed(1),
      engineer.averageReviewQuality.toFixed(1)
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Monthly Trends Sheet (All Engineers Combined)
  const monthlyTrendsData = [
    ['Month/Year', 'Total PRs', 'Merged PRs', 'Total Commits', 'Reviews Given', 'Team Comments', 'External Comments', 'Avg Productivity Score', 'Avg Collaboration Score', 'Avg Review Quality Score']
  ];

  const monthMap = new Map<string, any>();
  
  data.engineers.forEach(engineer => {
    engineer.monthlyData.forEach(month => {
      const key = `${month.month}-${month.year}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          prCount: 0,
          mergedPRs: 0,
          commitCount: 0,
          reviewCommentsGiven: 0,
          teamComments: 0,
          externalComments: 0,
          productivityScores: [],
          collaborationScores: [],
          reviewQualityScores: [],
          engineerCount: 0
        });
      }
      const monthData = monthMap.get(key);
      monthData.prCount += month.prCount;
      monthData.mergedPRs += month.mergedPRs;
      monthData.commitCount += month.commitCount;
      monthData.reviewCommentsGiven += month.reviewCommentsGiven;
      monthData.teamComments += month.teamComments;
      monthData.externalComments += month.externalComments;
      monthData.productivityScores.push(month.productivityScore);
      monthData.collaborationScores.push(month.collaborationScore);
      monthData.reviewQualityScores.push(month.reviewQualityScore);
      monthData.engineerCount = data.engineers.length;
    });
  });

  Array.from(monthMap.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .forEach(([key, monthData]) => {
      const avgProductivity = monthData.productivityScores.length > 0 
        ? monthData.productivityScores.reduce((a: number, b: number) => a + b, 0) / monthData.productivityScores.length
        : 0;
      const avgCollaboration = monthData.collaborationScores.length > 0
        ? monthData.collaborationScores.reduce((a: number, b: number) => a + b, 0) / monthData.collaborationScores.length
        : 0;
      const avgReviewQuality = monthData.reviewQualityScores.length > 0
        ? monthData.reviewQualityScores.reduce((a: number, b: number) => a + b, 0) / monthData.reviewQualityScores.length
        : 0;

      monthlyTrendsData.push([
        key,
        monthData.prCount,
        monthData.mergedPRs,
        monthData.commitCount,
        monthData.reviewCommentsGiven,
        monthData.teamComments,
        monthData.externalComments,
        avgProductivity.toFixed(1),
        avgCollaboration.toFixed(1),
        avgReviewQuality.toFixed(1)
      ]);
    });

  const monthlyTrendsSheet = XLSX.utils.aoa_to_sheet(monthlyTrendsData);
  monthlyTrendsSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, monthlyTrendsSheet, 'Monthly Trends');

  // Individual Engineer Sheets
  data.engineers.forEach(engineer => {
    const engineerMonthlyData = [
      [`${engineer.username}'s Monthly Performance`],
      [''],
      ['Name', engineer.name || 'N/A'],
      ['Email', engineer.email || 'N/A'],
      ['Join Date', engineer.joinDate || 'N/A'],
      [''],
      ['Month', 'PRs', 'Merged PRs', 'Rejected PRs', 'Merge Rate (%)', 'Commits', 'Reviews Given', 'Reviews Received', 'Issues Created', 'Issues Closed', 'Lines Added', 'Lines Deleted', 'Team Comments', 'External Comments', 'Productivity Score', 'Collaboration Score', 'Review Quality Score']
    ];

    engineer.monthlyData.forEach(month => {
      engineerMonthlyData.push([
        `${month.month}-${month.year}`,
        month.prCount,
        month.mergedPRs,
        month.rejectedPRs,
        month.mergeRate.toFixed(1),
        month.commitCount,
        month.reviewCommentsGiven,
        month.reviewCommentsReceived,
        month.issuesCreated,
        month.issuesClosed,
        month.linesAdded,
        month.linesDeleted,
        month.teamComments,
        month.externalComments,
        month.productivityScore.toFixed(1),
        month.collaborationScore.toFixed(1),
        month.reviewQualityScore.toFixed(1)
      ]);
    });

    const engineerSheet = XLSX.utils.aoa_to_sheet(engineerMonthlyData);
    engineerSheet['!cols'] = [
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 17 },
      { wch: 18 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, engineerSheet, engineer.username.substring(0, 30));
  });

  return workbook;
}

function generateEngineerMonthlyCSVContent(data: EngineerMonthlyExportData): string {
  let csvContent = 'Engineer Monthly Performance Report\n\n';
  
  csvContent += `Team Name,${data.teamName}\n`;
  csvContent += `Report Generated,${new Date(data.generatedAt).toLocaleDateString()}\n`;
  csvContent += `Period,${data.period}\n`;
  csvContent += `Total Engineers,${data.engineers.length}\n\n`;

  // Summary Section
  csvContent += 'Engineer Overview\n';
  csvContent += 'Engineer,Total PRs,Merged PRs,Total Commits,Total Reviews,Team Comments,External Comments,Avg Productivity,Avg Collaboration,Avg Review Quality\n';
  
  data.engineers.forEach(engineer => {
    csvContent += `${engineer.username},${engineer.totalPRs},${engineer.totalMergedPRs},${engineer.totalCommits},${engineer.totalReviews},${engineer.totalTeamComments},${engineer.totalExternalComments},${engineer.averageProductivity.toFixed(1)},${engineer.averageCollaboration.toFixed(1)},${engineer.averageReviewQuality.toFixed(1)}\n`;
  });

  csvContent += '\n\nMonthly Trends (All Engineers Combined)\n';
  csvContent += 'Month/Year,Total PRs,Merged PRs,Total Commits,Reviews Given,Team Comments,External Comments,Avg Productivity Score,Avg Collaboration Score,Avg Review Quality Score\n';

  const monthMap = new Map<string, any>();
  
  data.engineers.forEach(engineer => {
    engineer.monthlyData.forEach(month => {
      const key = `${month.month}-${month.year}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          prCount: 0,
          mergedPRs: 0,
          commitCount: 0,
          reviewCommentsGiven: 0,
          teamComments: 0,
          externalComments: 0,
          productivityScores: [],
          collaborationScores: [],
          reviewQualityScores: []
        });
      }
      const monthData = monthMap.get(key);
      monthData.prCount += month.prCount;
      monthData.mergedPRs += month.mergedPRs;
      monthData.commitCount += month.commitCount;
      monthData.reviewCommentsGiven += month.reviewCommentsGiven;
      monthData.teamComments += month.teamComments;
      monthData.externalComments += month.externalComments;
      monthData.productivityScores.push(month.productivityScore);
      monthData.collaborationScores.push(month.collaborationScore);
      monthData.reviewQualityScores.push(month.reviewQualityScore);
    });
  });

  Array.from(monthMap.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .forEach(([key, monthData]) => {
      const avgProductivity = monthData.productivityScores.length > 0 
        ? monthData.productivityScores.reduce((a: number, b: number) => a + b, 0) / monthData.productivityScores.length
        : 0;
      const avgCollaboration = monthData.collaborationScores.length > 0
        ? monthData.collaborationScores.reduce((a: number, b: number) => a + b, 0) / monthData.collaborationScores.length
        : 0;
      const avgReviewQuality = monthData.reviewQualityScores.length > 0
        ? monthData.reviewQualityScores.reduce((a: number, b: number) => a + b, 0) / monthData.reviewQualityScores.length
        : 0;

      csvContent += `${key},${monthData.prCount},${monthData.mergedPRs},${monthData.commitCount},${monthData.reviewCommentsGiven},${monthData.teamComments},${monthData.externalComments},${avgProductivity.toFixed(1)},${avgCollaboration.toFixed(1)},${avgReviewQuality.toFixed(1)}\n`;
    });

  // Individual Engineer Details
  data.engineers.forEach(engineer => {
    csvContent += `\n\n${engineer.username}'s Monthly Performance\n`;
    csvContent += `Name,${engineer.name || 'N/A'}\n`;
    csvContent += `Email,${engineer.email || 'N/A'}\n`;
    csvContent += `Join Date,${engineer.joinDate || 'N/A'}\n\n`;
    csvContent += 'Month,PRs,Merged PRs,Rejected PRs,Merge Rate (%),Commits,Reviews Given,Reviews Received,Issues Created,Issues Closed,Lines Added,Lines Deleted,Team Comments,External Comments,Productivity Score,Collaboration Score,Review Quality Score\n';

    engineer.monthlyData.forEach(month => {
      csvContent += `${month.month}-${month.year},${month.prCount},${month.mergedPRs},${month.rejectedPRs},${month.mergeRate.toFixed(1)},${month.commitCount},${month.reviewCommentsGiven},${month.reviewCommentsReceived},${month.issuesCreated},${month.issuesClosed},${month.linesAdded},${month.linesDeleted},${month.teamComments},${month.externalComments},${month.productivityScore.toFixed(1)},${month.collaborationScore.toFixed(1)},${month.reviewQualityScore.toFixed(1)}\n`;
    });
  });

  return csvContent;
}

export function exportEngineerMonthlyData(
  teamName: string,
  engineers: EngineerData[],
  period: string = 'Last 12 months',
  format: 'csv' | 'excel' = 'excel'
): void {
  const exportData: EngineerMonthlyExportData = {
    teamName,
    engineers,
    exportDate: new Date().toISOString().split('T')[0],
    period,
    generatedAt: new Date().toISOString()
  };

  switch (format) {
    case 'csv':
      exportEngineerMonthlyDataToCSV(exportData);
      break;
    case 'excel':
    default:
      exportEngineerMonthlyDataToExcel(exportData);
      break;
  }
}