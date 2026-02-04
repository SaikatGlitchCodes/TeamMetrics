# Engineer Monthly Export Documentation

## Overview

The enhanced export system allows you to export comprehensive monthly performance data for each engineer in your team with multiple sheets containing detailed metrics and trends.

## Features

### Multi-Sheet Export Formats

#### 1. **Summary Sheet**
- Team overview information
- Each engineer's totals and averages:
  - Total PRs, Merged PRs, Total Commits
  - Total Reviews and Comments
  - Average Productivity, Collaboration, and Review Quality Scores

#### 2. **Monthly Trends Sheet**
- Combined metrics across all engineers by month
- Aggregated data including:
  - Total PRs, Merged PRs, Commits
  - Reviews given, Team comments, External comments
  - Average scores across the team

#### 3. **Individual Engineer Sheets**
- One sheet per engineer with detailed monthly breakdown
- Includes:
  - PR metrics (created, merged, rejected)
  - Merge rates
  - Commit counts
  - Review statistics
  - Issue tracking
  - Code changes (lines added/deleted)
  - Comment distribution
  - Performance scores (Productivity, Collaboration, Review Quality)

#### 4. **CSV Export**
- All data combined in a single CSV file
- Sections for:
  - Team summary
  - Monthly trends
  - Individual engineer details

## Data Structure

### EngineerData Interface
```typescript
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
```

### MonthlyMetrics Interface
```typescript
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
```

## Usage Examples

### Basic Export from PR Comment Analysis Component

The `PRCommentAnalysis` component now includes an "Export Monthly Details" button that automatically:
1. Transforms quarterly data into monthly metrics
2. Extracts engineer data from top commenters
3. Generates an Excel file with all sheets

```jsx
<Button onClick={handleExportMonthlyEngineerData} disabled={!data || exportingMonthly}>
  {exportingMonthly ? <Loader2 className="animate-spin" /> : <Download />}
  Export Monthly Details
</Button>
```

### Using the Engineer Export Helper

Import the helper utilities:

```typescript
import { 
  fetchAndExportEngineerMetrics,
  exportEngineerMetricsFromLocalData,
  transformApiDataForExport
} from '@/lib/engineer-export-helper';
```

#### Option 1: Fetch and Export from API
```typescript
await fetchAndExportEngineerMetrics(
  teamId,
  'Engineering Team',
  'excel' // or 'csv'
);
```

#### Option 2: Export Local Data
```typescript
const engineers = [/* your engineer data */];
exportEngineerMetricsFromLocalData(
  'Engineering Team',
  engineers,
  'excel'
);
```

#### Option 3: Direct Export Function
```typescript
import { exportEngineerMonthlyData } from '@/lib/export-utils';

const engineerData = [/* transformed data */];
exportEngineerMonthlyData(
  'Engineering Team',
  engineerData,
  'Last 12 months',
  'excel'
);
```

## File Naming Convention

Files are named with the following pattern:
- **Excel**: `{teamName}_engineer_monthly_analysis_{YYYY-MM-DD}.xlsx`
- **CSV**: `{teamName}_engineer_monthly_analysis_{YYYY-MM-DD}.csv`

## Data Processing

### Aggregation
- Monthly totals are summed across all engineers
- Scores are averaged across the team

### Calculations
- **Merge Rate**: (Merged PRs / Total PRs) × 100
- **Productivity Score**: Based on commits, PRs, and code changes
- **Collaboration Score**: Based on reviews and comments
- **Review Quality Score**: Based on merge rate and review quality

## Integration Points

### 1. Dashboard Components
Add export button to any component that displays team metrics:

```jsx
import { exportEngineerMonthlyData } from '@/lib/export-utils';

function MyTeamDashboard() {
  const handleExport = () => {
    exportEngineerMonthlyData(
      teamName,
      engineerData,
      'Last 3 months',
      'excel'
    );
  };

  return <Button onClick={handleExport}>Export Data</Button>;
}
```

### 2. API Routes
Create an API endpoint that returns engineer metrics:

```typescript
// app/api/team-management/engineer-metrics/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  
  // Fetch and aggregate metrics
  const metrics = await getEngineerMetrics(teamId);
  
  return Response.json(metrics);
}
```

### 3. Scheduled Reports
Generate monthly reports automatically:

```typescript
// scripts/generate-monthly-reports.ts
async function generateMonthlyReports() {
  const teams = await getAllTeams();
  
  for (const team of teams) {
    const engineers = await fetchAndExportEngineerMetrics(
      team.id,
      team.name,
      'excel'
    );
    // Save or email the report
  }
}
```

## Excel File Structure

### Summary Sheet
| Engineer | Total PRs | Merged PRs | ... | Avg Quality |
|----------|-----------|-----------|-----|------------|
| john.doe | 45 | 42 | ... | 87.3 |

### Monthly Trends Sheet
| Month | Total PRs | Merged | Commits | ... | Avg Quality |
|-------|-----------|--------|---------|-----|------------|
| 01-2025 | 180 | 168 | 450 | ... | 85.2 |

### Engineer Sheet (john.doe)
| Month | PRs | Merged | Merge Rate | Commits | Reviews | ... |
|-------|-----|--------|-----------|---------|---------|-----|
| 01-2025 | 12 | 11 | 91.7 | 35 | 28 | ... |

## CSV Structure

The CSV contains sections:
1. **Header Information** - Team name, report date, period
2. **Engineer Overview** - Summary table
3. **Monthly Trends** - Aggregated monthly data
4. **Individual Details** - Complete monthly breakdown per engineer

## Performance Considerations

- **Memory**: Suitable for teams up to 100+ engineers
- **File Size**: Typically 200KB-2MB depending on data volume
- **Generation Time**: < 2 seconds for typical data

## Future Enhancements

Potential improvements:
- PDF export with charts
- Google Sheets integration
- Automated email delivery
- Data comparison (month-over-month, year-over-year)
- Custom report templates
- Performance alerts based on thresholds

## Troubleshooting

### "No engineer data available to export"
- Ensure data has been loaded from the API
- Check that top commenters data is available
- Verify team has active PRs

### File not downloading
- Check browser console for errors
- Verify pop-up blocker isn't preventing download
- Try different format (CSV vs Excel)

### Missing columns in exported data
- Verify source data includes all required fields
- Check that MonthlyMetrics interface is properly populated
- Review data transformation logic in helper functions
