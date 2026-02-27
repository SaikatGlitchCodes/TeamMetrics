"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BoringAvatar } from "@/components/ui/avatar";
import { usePopup } from "@/hooks/usePopup";
import { ViewPRsPopup } from "@/components/common/ViewPRsPopup";

export function DeveloperPerformanceCard({ developer }) {
  const { showPopup, Popup } = usePopup();
  const { closedPRs, display_name, draftPRs, github_username, mergedPRs, openPRs, repos, totalComments, totalPRs } = developer || {};

  const MetricBadge = ({ label, value, unit = "" }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">
        {value}
        {unit}
      </span>
    </div>
  );

  const handleViewPRs = (e) => {
    e.preventDefault();
    showPopup(
      <ViewPRsPopup repos={repos} displayName={display_name} />,
      `PRs by ${display_name}`
    );
  };

  return (
    <>
      <Link href={`/engineer/${github_username}`}>
        <Card className="overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full">
          <CardContent className="p-4">
            {/* Header with avatar */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
              <BoringAvatar
                name={display_name}
                size={40}
                variant="beam"
                colors={["#98D8C8", "#F7DC6F"]}
                className="w-10 h-10"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{display_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{github_username}
                </p>
              </div>
            </div>

            {/* Metrics Display (Last 3 Months) */}
            <div className="space-y-2">
              <MetricBadge label="Total PRs" value={totalPRs || 0} />
              <MetricBadge label="Merged PRs" value={mergedPRs || 0} />
              <MetricBadge
                label="Merge Rate"
                value={totalPRs > 0 ? ((mergedPRs / totalPRs) * 100).toFixed(2) : "0"}
                unit="%"
              />
              <MetricBadge
                label="Avg Conversations"
                value={totalPRs > 0 ? (totalComments / totalPRs).toFixed(2) : "0"}
              />
            </div>

            {/* CTA */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View full profile →
                </p>
                {repos && repos.length > 0 && (
                  <button
                    onClick={handleViewPRs}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View PRs ({repos.length})
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Popup />
    </>
  );
}
