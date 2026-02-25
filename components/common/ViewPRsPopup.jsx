export function ViewPRsPopup({ repos, displayName }) {
  if (!repos || repos.length === 0) {
    return <p className="text-muted-foreground">No PRs found</p>;
  }

  return (
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
              {pr.total_comments &&
                <p className="text-xs text-muted-foreground">
                    {new Date(pr.created_at).toLocaleDateString()} • {pr.total_comments} comments
                    {pr.merged_at && (
                    <span className="ml-2 text-green-600">• Merged</span>
                    )}
                </p>
              }
            </div>
            {pr.state &&
                <span
                className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                    pr.state === "open"
                    ? "bg-green-500/20 text-green-700"
                    : "bg-gray-500/20 text-gray-700"
                }`}
                >
                {pr.state}
                </span>
            }
          </div>
        </a>
      ))}
    </div>
  );
}
