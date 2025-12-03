"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BoringAvatar } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

export function TopPerformersCard({ topPerformers, lastQuarterLoading }) {
  console.log("topPerformers", topPerformers)

  if (lastQuarterLoading) {
    return (
      <Card className="overflow-hidden border border-border/50 h-full">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header section */}
          <div className="mb-4 pb-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-sm">Top Performers</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Ranked by merge rate, comment efficiency, and activity
            </p>
          </div>
          
          {/* Loading skeleton */}
          <div className="flex-1">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border bg-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-secondary rounded-full"></div>
                    <div className="w-6 h-6 bg-secondary rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-secondary rounded w-3/4"></div>
                      <div className="h-2 bg-secondary rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Loading performance data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topPerformers?.overall || !Array.isArray(topPerformers.overall) || topPerformers.overall.length === 0) {
    return (
      <Card className="overflow-hidden border border-border/50 h-full">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header section */}
          <div className="mb-4 pb-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-sm">Top Performers</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Ranked by merge rate, comment efficiency, and activity
            </p>
          </div>
          
          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center flex-col py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs text-center">No team metrics available</p>
          </div>
          
          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Assign developers to this team
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Top performers are already sorted by performance score
  const rankedDevelopers = Array.isArray(topPerformers.overall) ? topPerformers.overall.slice(0, 3) : [];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-600" />;
      case 2: return <Medal className="w-6 h-6 text-gray-500" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <TrendingUp className="w-6 h-6 text-blue-600" />;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2: return "bg-gray-100 text-gray-800 border-gray-300";
      case 3: return "bg-amber-100 text-amber-800 border-amber-300";
      default: return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <Card className=" border border-border/50 h-full">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header section to match DeveloperPerformanceCard */}
        <div className="mb-4 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-sm">Top Performers</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Ranked by merge rate, comment efficiency, and activity
          </p>
        </div>

        {/* Performers list - flex-1 to fill remaining space */}
        <div className="space-y-3 flex-1">
        {rankedDevelopers.length > 0 && rankedDevelopers.map((developer, index) => {
          const rank = index + 1;
          const { 
            github_username, 
            display_name, 
            avatar_url, 
            performanceScore, 
            metrics 
          } = developer || {};
          const { totalPRs = 0, mergedPRs = 0, mergeRate = 0, totalComments = 0, engagementScore = 0 } = metrics || {};
          
          return (
            <div
              key={github_username}
              className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer relative group ${
                rank === 1 
                  ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" 
                  : rank === 2 
                  ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
              }`}
              title={`Merge Rate: ${mergeRate.toFixed(2)}% | Engagement: ${engagementScore.toFixed(2)} | PRs: ${mergedPRs}/${totalPRs}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  {getRankIcon(rank)}
                </div>
                <BoringAvatar
                  name={display_name || github_username}
                  size={24}
                  variant="beam"
                  colors={["#98D8C8", "#F7DC6F"]}
                  className="w-6 h-6"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">{display_name || github_username}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRankBadgeColor(rank)}`}
                  >
                    #{rank} • {performanceScore.toFixed(2)} pts
                  </Badge>
                </div>
              </div>
              
              {/* Tooltip with metrics - shown on hover */}
              <div className="absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg p-3 z-50 min-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Merge Rate</span>
                    <span className="font-semibold text-green-600">{mergeRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className="font-semibold text-blue-600">{engagementScore.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">PRs</span>
                    <span className="font-semibold text-purple-600">{mergedPRs}/{totalPRs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Comments</span>
                    <span className="font-semibold text-orange-600">{totalComments}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {rankedDevelopers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground flex-1 flex items-center justify-center flex-col">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No performance data available</p>
          </div>
        )}
        </div>
        
        {/* Footer section to match DeveloperPerformanceCard height */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            Hover for detailed metrics
          </p>
        </div>
      </CardContent>
    </Card>
  );
}