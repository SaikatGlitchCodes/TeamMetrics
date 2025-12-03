"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Github, GitPullRequest, MessageSquare, GitMerge, GitBranch, Calendar as CalendarIcon, ExternalLink, TrendingUp, Sparkles, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { BoringAvatar } from "@/components/ui/avatar"

// Custom FullCalendar styles
const calendarStyle = `
  .fc {
    font-family: inherit;
  }
  
  .fc .fc-button {
    background-color: hsl(var(--primary));
    border-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    text-transform: capitalize;
    font-size: 14px;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .fc .fc-button:hover {
    background-color: hsl(var(--primary) / 0.9);
    border-color: hsl(var(--primary) / 0.9);
  }
  
  .fc .fc-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .fc .fc-button-active {
    background-color: hsl(var(--primary) / 0.8) !important;
    border-color: hsl(var(--primary) / 0.8) !important;
  }
  
  .fc-theme-standard .fc-scrollgrid {
    border-color: hsl(var(--border));
  }
  
  .fc-theme-standard td,
  .fc-theme-standard th {
    border-color: hsl(var(--border));
  }
  
  .fc .fc-col-header-cell {
    background-color: hsl(var(--muted));
    font-weight: 600;
    padding: 10px;
  }
  
  .fc .fc-daygrid-day.fc-day-today {
    background-color: hsl(var(--accent) / 0.3);
  }
  
  .fc .fc-event {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
    font-weight: 600;
    border-width: 2px;
  }
  
  .fc .fc-event:hover {
    opacity: 0.8;
  }
  
  .fc-h-event .fc-event-title {
    font-weight: 600;
  }
  
  .fc .fc-toolbar-title {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .fc .fc-daygrid-day-number {
    padding: 8px;
    font-weight: 500;
  }
`

export default function EngineerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const githubUsername = params.githubUsername

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeline, setTimeline] = useState('3months')
  const [selectedPR, setSelectedPR] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [analyzingPR, setAnalyzingPR] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customAnalysis, setCustomAnalysis] = useState(null)
  const [analyzingCustom, setAnalyzingCustom] = useState(false)
  const [customAnalysisError, setCustomAnalysisError] = useState(null)

  useEffect(() => {
    if (githubUsername) {
      fetchDeveloperData()
    }
  }, [githubUsername, timeline])

  const fetchDeveloperData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`https://metrictracker-be.onrender.com/prs/user/${githubUsername}?timeline=${timeline}`)
      
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
      console.error('Error fetching developer data:', err)
      setError(err.message || 'Failed to fetch developer data')
    } finally {
      setLoading(false)
    }
  }

  const handleAIAnalysis = async (pr) => {
    setAnalyzingPR(true)
    setAnalysisError(null)
    setAiAnalysis(null)
    
    try {
      const response = await fetch('https://metrictracker-be.onrender.com/ai/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_id: pr.repo_id,
          repository_url: pr.repository_url
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to analyze PR: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAiAnalysis(result.data)
      } else {
        throw new Error('AI analysis failed')
      }
    } catch (err) {
      console.error('Error analyzing PR:', err)
      setAnalysisError(err.message || 'Failed to analyze PR')
    } finally {
      setAnalyzingPR(false)
    }
  }

  const handleCustomAnalysis = async (pr) => {
    if (!customPrompt.trim()) {
      setCustomAnalysisError('Please enter a question')
      return
    }

    setAnalyzingCustom(true)
    setCustomAnalysisError(null)
    setCustomAnalysis(null)
    
    try {
      const response = await fetch('https://metrictracker-be.onrender.com/ai/custom-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_id: pr.repo_id,
          custom_prompt: customPrompt
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to analyze PR: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setCustomAnalysis(result.data)
      } else {
        throw new Error('Custom analysis failed')
      }
    } catch (err) {
      console.error('Error analyzing PR:', err)
      setCustomAnalysisError(err.message || 'Failed to analyze PR')
    } finally {
      setAnalyzingCustom(false)
    }
  }

  // Convert PRs to FullCalendar events with timeline (start to end date)
  const calendarEvents = useMemo(() => {
    if (!data?.data?.prs) return []
    
    return data?.data?.prs?.map(pr => {
      const createdDate = pr.created_at
      let endDate = pr.merged_at || pr.closed_at || new Date().toISOString()
      
      let color = '#10b981' // emerald-500 for merged
      
      if (pr.draft) {
        color = '#6366f1' // indigo-500 for draft
      } else if (pr.state === 'open') {
        color = '#3b82f6' // blue-500 for open
      } else if (pr.state === 'closed' && !pr.merged_at) {
        color = '#f59e0b' // amber-500 for closed without merge
      }
      
      return {
        id: String(pr.number),
        title: `#${pr.number}: ${pr.title}`,
        start: createdDate,
        end: endDate,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          pr: pr
        }
      }
    })
  }, [data])

  // Group comments by PR
  const commentsByPR = useMemo(() => {
    if (!data?.data?.comments) return {}
    
    const grouped = {}
    data?.data?.comments?.forEach(comment => {
      if (!grouped[comment.repo_id]) {
        grouped[comment.repo_id] = []
      }
      grouped[comment.repo_id].push(comment)
    })
    return grouped
  }, [data])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold mb-2">Error Loading Profile</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const { user, stats, timeline: timelineInfo } = data

  return (
    <>
      <style>{calendarStyle}</style>
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <BoringAvatar
                    name={user.github_username}
                    size={96}
                    variant="beam"
                    className="w-24 h-24 border-2 border-border shadow-sm"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-sm">
                    <Github className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{user.display_name || user.github_username}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <a
                      href={`https://github.hy-vee.cloud/${user.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-1"
                    >
                      @{user.github_username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(timelineInfo.start).toLocaleDateString()} - {new Date(timelineInfo.end).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  Total PRs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPRs}</div>
                <div className="flex gap-2 mt-3 text-xs flex-wrap">
                  <Badge variant="secondary" className="text-xs">{stats.openPRs} Open</Badge>
                  <Badge variant="secondary" className="text-xs">{stats.mergedPRs} Merged</Badge>
                  <Badge variant="secondary" className="text-xs">{stats.closedPRs} Closed</Badge>
                  {stats.draftPRs > 0 && <Badge variant="secondary" className="text-xs">{stats.draftPRs} Draft</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Merge Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalPRs > 0 ? Math.round((stats.mergedPRs / stats.totalPRs) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.mergedPRs} merged out of {stats.totalPRs} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Total Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalComments}</div>
                <div className="flex gap-2 mt-3 text-xs flex-wrap">
                  <Badge variant="outline" className="text-xs">{stats.issueComments} Issue</Badge>
                  <Badge variant="outline" className="text-xs">{stats.reviewComments} Review</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitMerge className="w-4 h-4" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalPRs > 0 ? (stats.totalComments / stats.totalPRs).toFixed(1) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg comments per PR
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                PR Timeline Calendar
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> Merged</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Open</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> Closed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500"></span> Draft</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,listWeek'
                }}
                events={calendarEvents}
                eventClick={(info) => setSelectedPR(info?.event?.extendedProps?.pr)}
                height="auto"
                eventDisplay="block"
                displayEventTime={false}
              />
            </CardContent>
          </Card>

          {/* Selected PR Details */}
          {selectedPR && (
            <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    <a
                      href={selectedPR.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-2"
                    >
                      #{selectedPR.number}: {selectedPR.title}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Created {new Date(selectedPR.created_at).toLocaleDateString()}
                    {selectedPR.merged_at && ` • Merged ${new Date(selectedPR.merged_at).toLocaleDateString()}`}
                    {selectedPR.closed_at && !selectedPR.merged_at && ` • Closed ${new Date(selectedPR.closed_at).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    onClick={() => handleAIAnalysis(selectedPR)}
                    disabled={analyzingPR}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    {analyzingPR ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Analysis
                      </>
                    )}
                  </Button>
                  {selectedPR.draft ? (
                    <Badge variant="secondary">Draft</Badge>
                  ) : selectedPR.merged_at ? (
                    <Badge variant="secondary">Merged</Badge>
                  ) : selectedPR.state === 'open' ? (
                    <Badge variant="secondary">Open</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                  <p className="text-lg font-semibold">{selectedPR.total_comments}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code Quality</p>
                  <p className="text-lg font-semibold">{selectedPR.code_quality || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logic/Functionality</p>
                  <p className="text-lg font-semibold">{selectedPR.logic_functionality || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Performance/Security</p>
                  <p className="text-lg font-semibold">{selectedPR.performance_security || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Testing/Docs</p>
                  <p className="text-lg font-semibold">{selectedPR.testing_documentation || 0}</p>
                </div>
              </div>

              {/* AI Analysis Results */}
              {aiAnalysis && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-semibold">AI Analysis Results</h4>
                  </div>
                  
                  {/* Overall Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-primary">{aiAnalysis.analysis?.overall_score || 0}/10</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${(aiAnalysis.analysis?.overall_score || 0) * 10}%` }}
                      />
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Code Quality</p>
                        <p className="text-xl font-bold">{aiAnalysis.analysis?.scores?.code_quality || 0}/10</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Logic/Functionality</p>
                        <p className="text-xl font-bold">{aiAnalysis.analysis?.scores?.logic_functionality || 0}/10</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Performance/Security</p>
                        <p className="text-xl font-bold">{aiAnalysis.analysis?.scores?.performance_security || 0}/10</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Testing/Documentation</p>
                        <p className="text-xl font-bold">{aiAnalysis.analysis?.scores?.testing_documentation || 0}/10</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Reasoning */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold">Detailed Analysis</h5>
                    
                    {aiAnalysis?.analysis?.reasoning?.code_quality && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Code Quality</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis?.analysis?.reasoning?.code_quality}</p>
                      </div>
                    )}
                    
                    {aiAnalysis?.analysis?.reasoning?.logic_functionality && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Logic & Functionality</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis?.analysis?.reasoning?.logic_functionality}</p>
                      </div>
                    )}
                    
                    {aiAnalysis?.analysis?.reasoning?.performance_security && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Performance & Security</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis?.analysis?.reasoning?.performance_security}</p>
                      </div>
                    )}
                    
                    {aiAnalysis?.analysis?.reasoning?.testing_documentation && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Testing & Documentation</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis?.analysis?.reasoning?.testing_documentation}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-muted-foreground">
                    Analyzed at: {new Date(aiAnalysis.analyzed_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Analysis Error */}
              {analysisError && (
                <div className="mt-6 p-4 border border-destructive rounded-lg bg-destructive/10">
                  <p className="text-sm text-destructive">{analysisError}</p>
                </div>
              )}

              {/* Custom AI Analysis */}
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold">Ask AI About This PR</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., Should developer create a new clean PR and then work?"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomAnalysis(selectedPR)
                        }
                      }}
                      className="flex-1"
                      disabled={analyzingCustom}
                    />
                    <Button
                      onClick={() => handleCustomAnalysis(selectedPR)}
                      disabled={analyzingCustom || !customPrompt.trim()}
                      className="gap-2"
                    >
                      {analyzingCustom ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Ask AI'
                      )}
                    </Button>
                  </div>

                  {/* Custom Analysis Result */}
                  {customAnalysis && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Question:</p>
                          <p className="text-sm">{customAnalysis.custom_prompt}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">AI Response:</p>
                          <p className="text-sm leading-relaxed">{customAnalysis.analysis_result}</p>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Analyzed at: {new Date(customAnalysis.analyzed_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Custom Analysis Error */}
                  {customAnalysisError && (
                    <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                      <p className="text-sm text-destructive">{customAnalysisError}</p>
                    </div>
                  )}
                </div>
              </div>

              {commentsByPR[selectedPR.repo_id] && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-semibold mb-3">Comments ({commentsByPR[selectedPR.repo_id].length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {commentsByPR[selectedPR.repo_id].map((comment) => (
                      <div key={comment.id} className="p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">@{comment.commentor}</span>
                            <Badge variant="outline" className="text-xs">{comment.type}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          )}

          {/* PRs List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Pull Requests</CardTitle>
                  <CardDescription>{data?.data?.prs?.length || 0} total PRs in selected period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {data?.data?.prs?.map((pr) => (
                  <div
                    key={pr.number}
                    className="p-3 border rounded-lg hover:bg-accent transition-all cursor-pointer"
                    onClick={() => setSelectedPR(pr)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={pr.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary flex items-center gap-2 mb-2 group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">#{pr.number}: {pr.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                        <div className="flex items-center gap-2 flex-wrap">
                          {pr.draft ? (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          ) : pr.merged_at ? (
                            <Badge variant="secondary" className="text-xs">Merged</Badge>
                          ) : pr.state === 'open' ? (
                            <Badge variant="secondary" className="text-xs">Open</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Closed</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {pr.total_comments}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(pr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}