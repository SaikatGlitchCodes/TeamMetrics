"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { BoringAvatar } from "@/components/ui/avatar";


export function DeveloperPerformanceCard({
  developer
}) {
  const [showIssues, setShowIssues] = useState(false);
  const {closedPRs, display_name, draftPRs, github_username, mergedPRs, openPRs, repos, totalComments, totalPRs} = developer || {};
  const MetricBadge = ({
    label,
    value,
    unit = "",
  }) => {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="font-semibold text-foreground">
          {value}
          {unit}
        </span>
      </div>
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
                colors={["#98D8C8", "#F7DC6F",]}
                className="w-10 h-10"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{github_username}
                </p>
              </div>
            </div>

            {/* Metrics Display (Last 3 Months) */}
            <div className="space-y-2">
              <MetricBadge
                label="Total PRs"
                value={totalPRs || 0}
              />
              <MetricBadge
                label="Merged PRs"
                value={mergedPRs || 0}
              />
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
                    onClick={(e) => {
                      e.preventDefault();
                      setShowIssues(true);
                    }}
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

      {showIssues && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  PRs by {display_name}
                </h2>
                <button
                  onClick={() => setShowIssues(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {!repos || repos.length === 0 ? (
                <p className="text-muted-foreground">No PRs found</p>
              ) : (
                <div className="space-y-3">
                  {repos.map((pr) => (
                    <a
                      key={pr.repo_id}
                      href={pr.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            #{pr.number} - {pr.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(pr.created_at).toLocaleDateString()} •{" "}
                            {pr.total_comments} comments
                            {pr.merged_at && (
                              <span className="ml-2 text-green-600">
                                • Merged
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                            pr.state === "open"
                              ? "bg-green-500/20 text-green-700"
                              : "bg-gray-500/20 text-gray-700"
                          }`}
                        >
                          {pr.state}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowIssues(false)}
                className="mt-4 w-full py-2 px-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
