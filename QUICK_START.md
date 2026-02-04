# Quick Start: Engineer Monthly Export

## 🚀 Quick Usage

### From UI Component
In `PRCommentAnalysis` component, click the **"Export Monthly Details"** button:
- Downloads Excel file with multiple sheets
- No additional setup needed
- Automatically transforms quarterly data to monthly

### Programmatic Export
```typescript
import { exportEngineerMonthlyData } from '@/lib/export-utils';

// Your engineer data array
const engineers = [
  {
    username: 'jane.smith',
    name: 'Jane Smith',
    email: 'jane@company.com',
    totalPRs: 48,
    totalMergedPRs: 45,
    totalCommits: 120,
    totalReviews: 87,
    totalTeamComments: 156,
    totalExternalComments: 89,
    monthlyData: [
      {
        month: '01',
        year: 2025,
        prCount: 4,
        mergedPRs: 4,
        rejectedPRs: 0,
        mergeRate: 100,
        commitCount: 10,
        reviewCommentsGiven: 12,
        reviewCommentsReceived: 8,
        issuesCreated: 2,
        issuesClosed: 1,
        linesAdded: 520,
        linesDeleted: 145,
        teamComments: 18,
        externalComments: 9,
        productivityScore: 82,
        collaborationScore: 75,
        reviewQualityScore: 88
      },
      // ... more months
    ],
    averageProductivity: 80,
    averageCollaboration: 76,
    averageReviewQuality: 85
  },
  // ... more engineers
];

// Export to Excel (default)
exportEngineerMonthlyData('Engineering Team', engineers);

// Or export to CSV
exportEngineerMonthlyData('Engineering Team', engineers, 'Last 12 months', 'csv');
```

### Using Helper Utilities
```typescript
import { fetchAndExportEngineerMetrics } from '@/lib/engineer-export-helper';

// Fetch and export in one call
await fetchAndExportEngineerMetrics(
  'team-123',
  'My Engineering Team',
  'excel'
);
```

## 📊 What Gets Exported

### Summary Sheet
Shows totals and averages for each engineer:
- Total PRs & Merged PRs
- Total Commits & Reviews
- Average Performance Scores

### Monthly Trends Sheet
Team-wide aggregated metrics by month:
- Combined PR statistics
- Team vs External comments
- Average performance trends

### Individual Engineer Sheets
Detailed monthly breakdown per engineer:
- Complete monthly metrics
- All 17 data points per month
- Performance trends

## 📁 Output Files

**Excel**: `TeamName_engineer_monthly_analysis_2025-01-18.xlsx`
**CSV**: `TeamName_engineer_monthly_analysis_2025-01-18.csv`

## 🔑 Key Metrics Included

Per Month Per Engineer:
- `prCount` - PRs created
- `mergedPRs` - Successfully merged
- `rejectedPRs` - Closed without merge
- `mergeRate` - Merge percentage
- `commitCount` - Total commits
- `reviewCommentsGiven` - Review feedback given
- `reviewCommentsReceived` - Feedback received
- `issuesCreated` / `issuesClosed` - Issue tracking
- `linesAdded` / `linesDeleted` - Code changes
- `teamComments` / `externalComments` - Comment distribution
- `productivityScore` - 0-100 performance metric
- `collaborationScore` - 0-100 collaboration metric
- `reviewQualityScore` - 0-100 review quality

## 🔄 Data Flow

```
API Data / Component State
         ↓
Transform to EngineerData format
         ↓
exportEngineerMonthlyData()
         ↓
Excel Workbook / CSV File
         ↓
User Download
```

## 💾 File Support

- ✅ Excel (`.xlsx`) - Recommended, multi-sheet with formatting
- ✅ CSV (`.csv`) - Compatible with all spreadsheet apps
- ✅ Auto-formatted columns for readability

## 🎯 Common Use Cases

**1. Monthly Performance Review**
```typescript
exportEngineerMonthlyData(
  'Q1 Engineering Team',
  engineerDataQ1,
  'Q1 2025'
);
```

**2. Automated Reports**
```typescript
// Run monthly via cron job
const teams = await getAllTeams();
teams.forEach(team => {
  exportEngineerMonthlyData(team.name, team.engineers);
});
```

**3. Performance Analysis**
```typescript
// Compare engineer performance
const topPerformers = engineers.filter(e => e.averageProductivity > 80);
exportEngineerMonthlyData('Top Performers', topPerformers);
```

## ⚙️ Configuration

All export functions support:
- **Format**: `'excel'` or `'csv'`
- **Period**: Custom string (e.g., "Q1 2025", "Last 90 days")
- **Team Name**: Used in filename

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| File won't download | Disable popup blocker, try CSV format |
| Excel won't open | Ensure .xlsx format, try importing CSV |
| Missing data | Verify `monthlyData` array is populated |
| Encoding issues | Use UTF-8, try CSV if Excel fails |

## 📞 Integration Support

The export system integrates with:
- `PRCommentAnalysis` component (built-in)
- Custom dashboards (import functions)
- Backend APIs (helper utilities)
- Scheduled tasks (programmatic)

## 📚 Full Documentation

See `ENGINEER_EXPORT_GUIDE.md` for:
- Complete interface definitions
- Advanced integration examples
- Performance considerations
- Future enhancement roadmap
