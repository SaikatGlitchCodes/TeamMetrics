# Architecture Overview: Engineer Monthly Export System

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PR COMMENT ANALYSIS COMPONENT                │
│                   (pr-comment-analysis.jsx)                     │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  Quarterly Data      │         │  Export Buttons      │     │
│  │  from Backend API    │─────────▶ Export Quarterly ◀──┤     │
│  │                      │         │ Export Monthly       │     │
│  └──────────────────────┘         └──────────┬───────────┘     │
│                                              │                 │
│                                     handleExportMonthlyEngineerData()
│                                              │                 │
└──────────────────────────────────────────────┼─────────────────┘
                                               │
                          ┌────────────────────▼────────────────────┐
                          │   Data Transformation                   │
                          │ (Group Quarterly → Monthly)             │
                          │ (Extract Engineer Data)                 │
                          │ (Calculate Metrics)                     │
                          └────────────────────┬────────────────────┘
                                               │
                ┌──────────────────────────────▼──────────────────────┐
                │     export-utils.ts                                 │
                │                                                    │
                │  ┌─ exportEngineerMonthlyData()                   │
                │  │  ├─ Excel Format                               │
                │  │  └─ CSV Format                                 │
                │  │                                                │
                │  └─ generateEngineerMonthlyExcelWorkbook()       │
                │     ├─ Summary Sheet                              │
                │     ├─ Monthly Trends Sheet                       │
                │     ├─ Individual Engineer Sheets                 │
                │     └─ Auto-formatted Columns                     │
                │                                                    │
                └────────────────────┬─────────────────────────────┘
                                     │
                ┌────────────────────▼────────────────────┐
                │  XLSX Library / Blob Creation           │
                │  ├─ Workbook Generation                │
                │  ├─ Sheet Creation & Formatting         │
                │  └─ Binary Export                       │
                └────────────────────┬────────────────────┘
                                     │
                ┌────────────────────▼────────────────────┐
                │  Browser File Download                  │
                │                                        │
                │  File: TeamName_engineer_monthly_     │
                │        analysis_YYYY-MM-DD.xlsx       │
                │                                        │
                └────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Quarterly   │  │  Top          │  │  Year Summary│             │
│  │  Data Array  │  │  Commenters   │  │  Metrics     │             │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                ┌────────────▼─────────────┐
                │   TRANSFORMATION LAYER   │
                │                          │
                │  handleExportMonthly()   │
                │  - Parse quarters       │
                │  - Create months         │
                │  - Extract engineers     │
                │  - Calculate metrics     │
                │  - Build MonthlyMetrics  │
                └────────────┬─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼──────┐    ┌──────▼────┐    ┌────────▼──┐
    │ Engineer 1 │    │ Engineer 2 │    │ Engineer N│
    │ with 12    │    │ with 12    │    │ with 12   │
    │ months     │    │ months     │    │ months    │
    └────┬───────┘    └──────┬─────┘    └────┬──────┘
         │                   │               │
         └───────────────────┼───────────────┘
                             │
         ┌───────────────────▼───────────────┐
         │  EXPORT GENERATION                │
         │                                   │
         │  exportEngineerMonthlyData()       │
         │  ├─ Build Workbook                │
         │  ├─ Create Sheets                 │
         │  │  ├─ Summary                    │
         │  │  ├─ Monthly Trends             │
         │  │  └─ Individual Engineers       │
         │  └─ Format & Export               │
         └───────────────────┬───────────────┘
                             │
         ┌───────────────────▼───────────────┐
         │  OUTPUT FORMATS                   │
         │                                   │
         │  ✓ XLSX (Excel) - 4 sheets        │
         │  ✓ CSV - Comprehensive text       │
         └───────────────────────────────────┘
```

## Sheet Structure in Excel Export

```
┌──────────────────────────────────────────────────────────────┐
│                    SUMMARY SHEET                             │
│                                                              │
│  Team Performance Report                                    │
│  ─────────────────────────                                 │
│  Team Name: Engineering Team                               │
│  Report Generated: 01/18/2025                              │
│  Period: Year 2025                                         │
│  Total Engineers: 5                                         │
│                                                              │
│  ┌─────────┬───────────┬─────────────┬──────────────────┐  │
│  │Engineer │Total PRs │Avg Collab   │Avg Review Quality│  │
│  ├─────────┼───────────┼─────────────┼──────────────────┤  │
│  │john.doe │   48      │   75.3      │      87.2        │  │
│  │jane...  │   52      │   78.1      │      89.5        │  │
│  │...      │   ...     │   ...       │      ...         │  │
│  └─────────┴───────────┴─────────────┴──────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               MONTHLY TRENDS SHEET                           │
│                                                              │
│  ┌──────────┬──────────┬─────────┬──────────────┐           │
│  │Month/Year│Total PRs │Commits  │Avg Prod Score│           │
│  ├──────────┼──────────┼─────────┼──────────────┤           │
│  │01-2025   │   180    │   450   │    82.3      │           │
│  │02-2025   │   195    │   485   │    84.1      │           │
│  │...       │   ...    │   ...   │    ...       │           │
│  └──────────┴──────────┴─────────┴──────────────┘           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│            INDIVIDUAL ENGINEER SHEET (john.doe)              │
│                                                              │
│  john.doe's Monthly Performance                             │
│  Name: John Doe                                             │
│  Email: john.doe@company.com                               │
│                                                              │
│  ┌──────┬────┬─────────┬─────────┬──────────┬────────────┐ │
│  │Month │PRs │Merge... │Commits  │Reviews   │Prod Score │ │
│  ├──────┼────┼─────────┼─────────┼──────────┼────────────┤ │
│  │01... │ 12 │   11    │   35    │    28    │    78     │ │
│  │02... │ 15 │   14    │   42    │    31    │    82     │ │
│  │...   │... │   ...   │   ...   │    ...   │    ...    │ │
│  └──────┴────┴─────────┴─────────┴──────────┴────────────┘ │
│                                                              │
│  [Additional sheets for each engineer...]                  │
└──────────────────────────────────────────────────────────────┘
```

## Component Integration

```
PRCommentAnalysis Component
├─ fetchAnalysisData()          [Existing]
├─ handleRefresh()               [Existing]
├─ handleExportQuarterlyData()  [Existing]
│
└─ handleExportMonthlyEngineerData()  [NEW]
   ├─ Transform quarterly data to monthly
   ├─ Extract engineer information
   ├─ Build MonthlyMetrics array
   └─ Call exportEngineerMonthlyData()
        ├─ generateEngineerMonthlyExcelWorkbook()
        │  ├─ Create Summary sheet
        │  ├─ Create Monthly Trends sheet
        │  ├─ Create Individual Engineer sheets
        │  └─ Format columns
        │
        └─ Download to user's system
```

## Helper Utilities Stack

```
engineer-export-helper.ts
├─ transformApiDataForExport()
│  ├─ Convert API response format
│  ├─ Calculate merge rates
│  ├─ Aggregate monthly totals
│  └─ Calculate average scores
│
├─ fetchAndExportEngineerMetrics()
│  ├─ Call backend API
│  ├─ Transform data
│  └─ Trigger export
│
└─ exportEngineerMetricsFromLocalData()
   ├─ Transform local data
   └─ Trigger export
```

## Data Types Flow

```
API Response
    ↓
EngineerMetricsAPIResponse[]
    ↓
Transform (helper)
    ↓
EngineerData[]
    ↓
EngineerMonthlyExportData
    ↓
generateEngineerMonthlyExcelWorkbook()
    ↓
XLSX.WorkBook
    ↓
ArrayBuffer
    ↓
Blob
    ↓
Download Link
    ↓
User Download
```

## File Organization

```
lib/
├─ export-utils.ts (687 lines)
│  ├─ Original functions (unchanged)
│  ├─ New interfaces (MonthlyMetrics, EngineerData, etc.)
│  ├─ New export functions (Excel, CSV)
│  └─ New workbook generation functions
│
└─ engineer-export-helper.ts (120 lines) [NEW]
   ├─ Data transformation utilities
   ├─ API integration helpers
   └─ Export orchestrators

components/
└─ pr-comment-analysis.jsx (UPDATED)
   ├─ New state variables
   ├─ New export handler
   └─ Updated UI buttons

Documentation/
├─ ENGINEER_EXPORT_GUIDE.md (Comprehensive)
├─ IMPLEMENTATION_SUMMARY.md (Technical)
└─ QUICK_START.md (Usage examples)
```

## Export Output Structure

```
XLSX File (Multiple Sheets)
├─ Sheet 1: Summary
│  └─ Team overview + engineer totals
├─ Sheet 2: Monthly Trends
│  └─ Aggregated metrics by month
├─ Sheet 3-N: Engineer Details
│  └─ Individual monthly breakdown
└─ Formatting
   └─ Auto-sized columns, headers, data types

CSV File (Single File)
├─ Section 1: Header Info
├─ Section 2: Engineer Overview
├─ Section 3: Monthly Trends
└─ Section 4: Individual Details
   └─ One section per engineer
```
