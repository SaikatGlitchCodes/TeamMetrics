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

interface ExportData {
  teamName: string;
  teamMembers: string[];
  teamMetrics: TeamMember[];
  exportDate: string;
  period: string;
  quarterlyData?: any[];
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