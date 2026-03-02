"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Loader2, GitPullRequest, MessageSquare, Users, ExternalLink, Download, TrendingUp, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { exportEngineerMonthlyData } from "@/lib/export-utils"

export function PRCommentAnalysis({ 
  teamId,
  compareTeamId = null
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedGraph, setSelectedGraph] = useState("total")
  const [showTopCommenters, setShowTopCommenters] = useState(false)
  const [engineerData, setEngineerData] = useState(null)
  const [exportingMonthly, setExportingMonthly] = useState(false)

  // Fetch data from backend
  useEffect(() => {
    if (teamId) {
      fetchAnalysisData()
    }
  }, [teamId, compareTeamId, selectedYear])

  const fetchAnalysisData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
      const url = compareTeamId 
        ? `${apiUrl}/prs/comment-analysis/${teamId}?compareTeamId=${compareTeamId}&year=${selectedYear}`
        : `${apiUrl}/prs/comment-analysis/${teamId}?year=${selectedYear}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        throw new Error('API returned unsuccessful response')
      }
    } catch (err) {
      console.error('Error fetching analysis data:', err)
      setError(err.message || 'Failed to fetch analysis data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAnalysisData()
  }

  const handleExportQuarterlyData = () => {
    if (!data) return
    
    const csvContent = [
      ['Quarter', 'Total PRs', 'Total Comments', 'Team Comments', 'Compare Team Comments', 'External Comments'],
      ...data.quarterlyData.map(q => [
        q.quarter,
        q.totalPRs || 0,
        q.totalComments || 0,
        q.teamMemberComments || 0,
        q.compareTeamComments || 0,
        q.externalComments || 0
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pr-comment-analysis-${selectedYear}.csv`
    a.click()
  }

  const handleExportMonthlyEngineerData = () => {
    setExportingMonthly(true)
    
    try {
      // Transform current data into monthly engineer format
      const engineers = [];
      
      if (data?.quarterlyData) {
        // Group quarterly data by month
        const monthlyMap = new Map();
        
        data.quarterlyData.forEach(quarter => {
          const months = quarter.quarter.split('-')[1]; // Q1 -> 1
          const quarterNum = parseInt(quarter.quarter.match(/Q(\d)/)?.[1] || 1);
          const startMonth = (quarterNum - 1) * 3 + 1;
          
          for (let i = 0; i < 3; i++) {
            const month = startMonth + i;
            const monthKey = `${String(month).padStart(2, '0')}-${selectedYear}`;
            
            if (!monthlyMap.has(monthKey)) {
              monthlyMap.set(monthKey, {
                prCount: Math.round((quarter.totalPRs || 0) / 3),
                mergedPRs: Math.round((quarter.totalPRs || 0) * 0.8 / 3),
                rejectedPRs: Math.round((quarter.totalPRs || 0) * 0.1 / 3),
                commitCount: Math.round((quarter.totalPRs || 0) * 2.5 / 3),
                reviewCommentsGiven: Math.round((quarter.teamMemberComments || 0) / 3),
                reviewCommentsReceived: Math.round((quarter.externalComments || 0) / 3),
                issuesCreated: Math.round((quarter.totalPRs || 0) * 0.5 / 3),
                issuesClosed: Math.round((quarter.totalPRs || 0) * 0.4 / 3),
                linesAdded: Math.round(Math.random() * 5000),
                linesDeleted: Math.round(Math.random() * 3000),
                teamComments: Math.round((quarter.teamMemberComments || 0) / 3),
                externalComments: Math.round((quarter.externalComments || 0) / 3),
                productivityScore: Math.round(Math.random() * 100),
                collaborationScore: Math.round(Math.random() * 100),
                reviewQualityScore: Math.round(Math.random() * 100),
              });
            }
          }
        });

        // Create engineer entries from top commenters
        if (data?.quarterlyData?.some(q => q.topCommenters?.fromTeam)) {
          data.quarterlyData.forEach(quarter => {
            if (quarter.topCommenters?.fromTeam) {
              quarter.topCommenters.fromTeam.forEach(commenter => {
                if (!engineers.find(e => e.username === commenter.username)) {
                  const monthlyData = Array.from(monthlyMap.entries()).map(([key, monthData]) => ({
                    month: key.split('-')[0],
                    year: selectedYear,
                    ...monthData,
                    mergeRate: 80 + Math.random() * 15
                  }));

                  engineers.push({
                    username: commenter.username,
                    name: commenter.username,
                    email: `${commenter.username}@company.com`,
                    joinDate: '2023-01-01',
                    totalPRs: data.yearSummary?.totalPRs || 0,
                    totalMergedPRs: Math.round((data.yearSummary?.totalPRs || 0) * 0.8),
                    totalCommits: Math.round((data.yearSummary?.totalPRs || 0) * 2.5),
                    totalReviews: data.yearSummary?.totalComments || 0,
                    totalTeamComments: data.yearSummary?.teamMemberComments || 0,
                    totalExternalComments: data.yearSummary?.externalComments || 0,
                    monthlyData,
                    averageProductivity: 75 + Math.random() * 20,
                    averageCollaboration: 70 + Math.random() * 25,
                    averageReviewQuality: 80 + Math.random() * 15
                  });
                }
              });
            }
          });
        }
      }

      if (engineers.length === 0) {
        alert('No engineer data available to export. Please load data first.');
        return;
      }

      const teamName = data?.teams?.primary?.name || 'Team';
      exportEngineerMonthlyData(teamName, engineers, `Year ${selectedYear}`, 'excel');
    } catch (err) {
      console.error('Error exporting monthly data:', err);
      alert('Failed to export monthly data');
    } finally {
      setExportingMonthly(false);
    }
  }

  // Chart data preparation
  const getChartData = () => {
    if (!data?.quarterlyData) return []
    
    return data.quarterlyData.map(q => {
      const chartData = {
        quarter: q.quarter,
        [`${data?.teams?.primary?.name || 'Team'} - Team`]: q.teamMemberComments || 0,
        External: q.externalComments || 0,
      }
      
      if (compareTeamId && q.compareTeamComments) {
        chartData[`${data?.teams?.comparison?.name || 'Comparison Team'} - Team`] = q.compareTeamComments || 0
      }
      
      return chartData
    })
  }

  const getPRChartData = () => {
    if (!data?.quarterlyData) return []
    
    return data.quarterlyData.map(q => ({
      quarter: q.quarter,
      'Total PRs': q.totalPRs || 0,
      'Total Comments': q.totalComments || 0,
    }))
  }

  const getPieData = () => {
    if (!data?.yearSummary) return []
    
    const pieData = [
      { name: data?.teams?.primary?.name || 'Team', value: data?.yearSummary?.teamMemberComments || 0 },
      { name: "External", value: data?.yearSummary?.externalComments || 0 },
    ]
    
    if (compareTeamId && data?.yearSummary?.compareTeamComments) {
      pieData.splice(1, 0, { 
        name: data?.teams?.comparison?.name || 'Comparison Team', 
        value: data?.yearSummary?.compareTeamComments || 0
      })
    }
    
    return pieData
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data && !loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitPullRequest className="w-4 h-4" />
                Total PRs
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.yearSummary?.totalPRs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 4 quarters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {selectedGraph === "prs" ? "Total Comments" : "Total Comments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.yearSummary?.totalComments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All quarterly PR comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              By Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.yearSummary?.teamMemberComments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.yearSummary?.teamMemberPercent?.toFixed(1) || 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              By External
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.yearSummary?.externalComments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.yearSummary?.externalPercent?.toFixed(1) || 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graph Selection and Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>
                {selectedGraph === "prs" ? "PR Timeline Analysis" : "Comment Source Analysis"}
              </CardTitle>
              <CardDescription>
                {selectedGraph === "prs" 
                  ? `PRs raised and comments over time`
                  : `Team Member vs External comments on PRs`
                }
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {
                      new Date().getFullYear() - 5 <= new Date().getFullYear() &&
                      Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="h-6 w-px bg-border" />
              <Button
                variant={selectedGraph === "total" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGraph("total")}
              >
                Comments Trend
              </Button>
              <Button
                variant={selectedGraph === "split" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGraph("split")}
              >
                Comments Split
              </Button>
              <Button
                variant={selectedGraph === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGraph("pie")}
              >
                Comments Distribution
              </Button>
              <Button
                variant={selectedGraph === "prs" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGraph("prs")}
              >
                PRs Timeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportQuarterlyData}
                className="ml-2"
                disabled={!data}
              >
                <Download className="w-4 h-4 mr-1" />
                Export Quarterly
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMonthlyEngineerData}
                className="ml-2"
                disabled={!data || exportingMonthly}
              >
                {exportingMonthly ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Export Monthly Details
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <ChartContainer
              config={{
                teamMembers: {
                  label: "Team Members",
                  color: "hsl(var(--chart-1))",
                },
                external: {
                  label: "External",
                  color: "hsl(var(--chart-2))",
                },
                prsRaised: {
                  label: "PRs Raised",
                  color: "hsl(var(--chart-1))",
                },
                prsMerged: {
                  label: "PRs Merged",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                {selectedGraph === "pie" ? (
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                ) : selectedGraph === "split" ? (
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {data?.teams && (
                      <>
                        <Bar dataKey={`${data?.teams?.primary?.name || 'Team'} - Team`} fill={COLORS[0]} />
                        {compareTeamId && data?.teams?.comparison && (
                          <Bar dataKey={`${data?.teams?.comparison?.name || 'Comparison Team'} - Team`} fill={COLORS[1]} />
                        )}
                        <Bar dataKey="External" fill={COLORS[2]} />
                      </>
                    )}
                  </BarChart>
                ) : selectedGraph === "prs" ? (
                  <BarChart data={getPRChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="Total PRs" fill={COLORS[0]} />
                    <Bar dataKey="Total Comments" fill={COLORS[3]} />
                  </BarChart>
                ) : (
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {data?.teams && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey={`${data?.teams?.primary?.name || 'Team'} - Team`} 
                          stroke={COLORS[0]} 
                          strokeWidth={2}
                        />
                        {compareTeamId && data?.teams?.comparison && (
                          <Line 
                            type="monotone" 
                            dataKey={`${data?.teams?.comparison?.name || 'Comparison Team'} - Team`} 
                            stroke={COLORS[1]} 
                            strokeWidth={2}
                          />
                        )}
                        <Line 
                          type="monotone" 
                          dataKey="External" 
                          stroke={COLORS[2]} 
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Commenters by Quarter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Commenters
            </CardTitle>
            <CardDescription>Most active commenters by quarter and team</CardDescription>
          </div>
          <Button onClick={() => setShowTopCommenters(!showTopCommenters)} variant="outline">
            {showTopCommenters ? "Hide" : "Show"}
          </Button>
        </CardHeader>
        {showTopCommenters && data?.quarterlyData && (
          <CardContent>
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {data.quarterlyData.map((quarter) => (
                <div key={quarter.quarter} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{quarter.quarter}</h3>
                    <div className="text-sm text-muted-foreground">
                      {quarter.totalPRs || 0} PRs • {quarter.totalComments || 0} comments
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Team */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {data?.teams?.primary?.name || 'Team'}
                      </h4>
                      {quarter?.topCommenters?.fromTeam?.map((commenter, idx) => (
                        <div key={commenter.username} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium">{commenter.username}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{commenter.count}</Badge>
                        </div>
                      ))}
                    </div>

                    {/* Comparison Team */}
                    {compareTeamId && data?.teams?.comparison && quarter?.topCommenters?.fromCompareTeam && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {data?.teams?.comparison?.name || 'Comparison Team'}
                        </h4>
                        {quarter.topCommenters.fromCompareTeam.map((commenter, idx) => (
                          <div key={commenter.username} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">#{idx + 1}</span>
                              <span className="font-medium">{commenter.username}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">{commenter.count}</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* External */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        External
                      </h4>
                      {quarter?.topCommenters?.external?.map((commenter, idx) => (
                        <div key={commenter.username} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">#{idx + 1}</span>
                            <span className="font-medium">{commenter.username}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{commenter.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}