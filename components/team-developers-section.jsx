"use client"

import { DeveloperPerformanceCard } from "./developer-performance-card"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TopPerformersCard } from "./top-performers-card"

export function TeamDevelopersSection({ lastQuarterData, lastQuarterLoading }) {
  // if (lastQuarterLoading) {
  //   return (
  //     <Card>
  //       <CardContent className="flex items-center justify-center py-12">
  //         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  //       </CardContent>
  //     </Card>
  //   )
  // }
const data = lastQuarterData?.timeline;
console.log(data?.start)
  if (!lastQuarterLoading && (!lastQuarterData?.data?.memberBreakdown || lastQuarterData?.data?.memberBreakdown?.length === 0)) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No team members found. Assign developers to this team in the admin panel.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{lastQuarterData?.team?.name || 'loading...'} Members</h2>
        <p className="text-muted-foreground">Quarterly performance comparison and individual metrics </p>
        <p className="text-sm">from {new Date(data?.start).toLocaleDateString()} to {new Date(data?.end).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!lastQuarterLoading && lastQuarterData?.data?.memberBreakdown?.map((dev) => (
          <DeveloperPerformanceCard key={dev.display_name} developer={dev} lastQuarterLoading={lastQuarterLoading} />
        ))}
        <TopPerformersCard topPerformers={lastQuarterData?.topPerformers} lastQuarterLoading={lastQuarterLoading} />
      </div>
    </div>
  )
}
