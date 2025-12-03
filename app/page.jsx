"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { PRCommentAnalysis } from "@/components/pr-comment-analysis"
import { TeamDevelopersSection } from "@/components/team-developers-section"
import axios from "axios"
import { DashboardHeader } from "@/components/dashboard-header"
import { useTeams } from "@/lib/context/teamsContext"
import { BrandLoader } from "@/components/brand-loader"

export default function Dashboard() {
  const { teams, loading, fetchTeams } = useTeams()
  const [selectedTeam, setSelectedTeam] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [exportFormat, setExportFormat] = useState('excel')
  const [lastQuarterData, setLastQuarterData] = useState([])
  const [lastQuarterLoading, setLastQuarterLoading] = useState(false)

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
  }, [selectedTeam]);

  const fetchTeamData = async (teamId) => {
    setLastQuarterLoading(true)
    try {
      const response = await axios.get(`https://metrictracker-be.onrender.com/prs/team/${teamId}`)
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
      await axios.post('https://metrictracker-be.onrender.com/prs/refresh-team-prs', { team_id: selectedTeam })
      
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

  if (loading) {
    return <BrandLoader />
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <DashboardHeader title={"Hy-vee activity tracker"} onExport={handleExport} />

        {/* Team Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Team</CardTitle>
            <CardDescription>Choose your team and optionally compare with another team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between gap-4">
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
