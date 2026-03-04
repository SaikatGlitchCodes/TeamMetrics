"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { PRCommentAnalysis } from "@/components/pr-comment-analysis"
import { TeamDevelopersSection } from "@/components/team-developers-section"
import { MonthlyReviewBarChart } from "@/components/MonthlyReviewBarChart"
import { SLAChart } from "@/components/SLAChart"
import { PlatformApprovalChart } from "@/components/PlatformApprovalChart"
import axios from "axios"
import { DashboardHeader } from "@/components/dashboard-header"
import { useTeams } from "@/lib/context/teamsContext"
import { BrandLoader } from "@/components/brand-loader"
import * as yup from "yup"


// Helper function to get current quarter
const getCurrentQuarter = () => {
  const month = new Date().getMonth()
  return Math.floor(month / 3) + 1
}

export default function Dashboard() {
  const { teams, loading, fetchTeams } = useTeams()
  const [selectedTeam, setSelectedTeam] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [exportFormat, setExportFormat] = useState('excel')
  const [lastQuarterData, setLastQuarterData] = useState([])
  const [lastQuarterLoading, setLastQuarterLoading] = useState(false)
  
  // Date range state
  const [dateRangeMode, setDateRangeMode] = useState('quarter') // 'quarter' or 'custom'
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    const savedTeam = localStorage.getItem('selectedTeam')
    if (savedTeam) {
      setSelectedTeam(savedTeam)
    }
    fetchTeams();
  }, [fetchTeams])

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamData(selectedTeam);
    }
  }, [selectedTeam, dateRangeMode, selectedQuarter, selectedYear, customStartDate, customEndDate]);

  const fetchTeamData = async (teamId) => {
    setLastQuarterLoading(true)
    try {
      let params = {};
      setDateError("");
      if (dateRangeMode === 'quarter') {
        params = {
          quarter: selectedQuarter,
          year: selectedYear
        };
      } else if (dateRangeMode === 'custom') {
        if (customStartDate && customEndDate) {
          // Validate custom date range
          try {
            await customDateSchema.validate({ start_date: customStartDate, end_date: customEndDate });
          } catch (err) {
            setDateError(err.message);
            setLastQuarterLoading(false);
            return;
          }
          params = {
            start_date: customStartDate,
            end_date: customEndDate
          };
        }
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
      const response = await axios.get(`${apiUrl}/prs/team/${teamId}`, { params });
      setLastQuarterData(response.data)
    } catch (error) {
      console.error("Error fetching team data:", error)
    } finally {
      setLastQuarterLoading(false)
    }
  }

  const handleSyncComments = async () => {
    if (!selectedTeam) return
    try {
      setSyncing(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
      await axios.post(`${apiUrl}/prs/refresh-team-prs`, { team_id: selectedTeam })
      
      await fetchTeams(true)
      await fetchTeamData(selectedTeam)
      
      alert("Comments synced successfully!")
    } catch (error) {
      console.error("Error syncing comments:", error)
    } finally {
      setSyncing(false)
    }
  }

  const handleExport = async () => {
    // Export team data using utility function
  }

  const customDateSchema = yup.object().shape({
    start_date: yup.date().required('Start date is required'),
    end_date: yup.date().required('End date is required').min(
      yup.ref('start_date'),
      'End date must be after start date'
    ),
  })

  const [dateError, setDateError] = useState('')

  if (loading) {
    return <BrandLoader />
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <DashboardHeader title={"Hy-vee activity tracker"} onExport={handleExport} />

        {/* Team Selection & Date Range */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Team</CardTitle>
            <CardDescription>Choose your team and select a date range for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <label className="text-sm font-medium">Your Team</label>
                <Select value={selectedTeam} onValueChange={(value) => { setSelectedTeam(value); localStorage.setItem('selectedTeam', value); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date Range Mode</label>
                <Select value={dateRangeMode} onValueChange={setDateRangeMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRangeMode === 'quarter' && (
                <div className="flex gap-2">
                  <div>
                    <label className="text-sm font-medium">Quarter</label>
                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1</SelectItem>
                        <SelectItem value="2">Q2</SelectItem>
                        <SelectItem value="3">Q3</SelectItem>
                        <SelectItem value="4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} min="2000" max={new Date().getFullYear()} className="w-24" />
                  </div>
                </div>
              )}

              {dateRangeMode === 'custom' && (
                <div className="flex gap-2">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                  </div>
                  {dateError && (
                    <div className="text-red-500 text-sm mt-2">{dateError}</div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">last synced</label>
                {
                  teams?.find((t) => t.id === selectedTeam)?.last_sync ? (
                    <p className="mt-1 text-sm">
                      {new Date(teams.find((t) => t.id === selectedTeam)?.last_sync).toLocaleString()}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Never synced</p>
                  )
                }
              </div>
              <div className="flex items-end">
                <Button onClick={handleSyncComments} disabled={syncing} className="w-full">
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sync PR Comments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Performance Cards */}
        {selectedTeam && (
          <div className="mb-12">
            <TeamDevelopersSection
              lastQuarterData={lastQuarterData}
              lastQuarterLoading={lastQuarterLoading}
            />
          </div>
        )}

        {/* PR Review Time Trends + SLA Compliance */}
        {selectedTeam && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">PR Review Time Trends</h2>
              <p className="text-muted-foreground">
                Monthly trends showing average and median review times, SLA compliance, and platform approvals — current quarter
              </p>
            </div>
            {/* Row 1: Monthly Review Trends + SLA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
              <PlatformApprovalChart
                teamId={selectedTeam}
                startDate={dateRangeMode === 'custom' ? customStartDate : undefined}
                endDate={dateRangeMode === 'custom' ? customEndDate : undefined}
                quarter={dateRangeMode === 'quarter' ? parseInt(selectedQuarter) : undefined}
                year={dateRangeMode === 'quarter' ? parseInt(selectedYear) : undefined}
              />
               {/* SLA Chart */}
               <SLAChart
                teamName='Platform team'
                teamId={selectedTeam}
                quarter={dateRangeMode === 'quarter' ? parseInt(selectedQuarter) : undefined}
                year={dateRangeMode === 'quarter' ? parseInt(selectedYear) : undefined}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
               <MonthlyReviewBarChart 
                teamId={selectedTeam}
                startDate={dateRangeMode === 'custom' ? customStartDate : undefined}
                endDate={dateRangeMode === 'custom' ? customEndDate : undefined}
                quarter={dateRangeMode === 'quarter' ? parseInt(selectedQuarter) : undefined}
                year={dateRangeMode === 'quarter' ? parseInt(selectedYear) : undefined}
              />
              <SLAChart
                teamName='Internal team'
                teamId={selectedTeam}
                quarter={dateRangeMode === 'quarter' ? parseInt(selectedQuarter) : undefined}
                year={dateRangeMode === 'quarter' ? parseInt(selectedYear) : undefined}
              />
            </div>
          </div>
        )}

        {/* Comment Analysis */}
        {selectedTeam && (
          <PRCommentAnalysis
            teamId={selectedTeam}
            compareTeamId={process.env.NEXT_PUBLIC_PLATFORM_TEAM || 'f8ebb6da-71a3-4799-baee-3d56375b4a38'}
          />
        )}
      </div>
    </main>
  )
}
