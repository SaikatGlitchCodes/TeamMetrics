'use client';

import { useTeamReviewMetrics } from '@/lib/hooks/useReviewMetrics';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { Clock } from 'lucide-react';

function computeStats(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  return {
    avg: parseFloat(avg.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    min: parseFloat(sorted[0].toFixed(2)),
    max: parseFloat(sorted[sorted.length - 1].toFixed(2)),
    count: sorted.length,
  };
}

/**
 * Group qualifying PRs by the month of created_at and compute stats per month.
 */
function groupByMonth(allPRs) {
  const groups = {};

  allPRs.forEach((pr) => {
    const date = new Date(pr.created_at);
    const year = date.getFullYear();
    const monthNumber = date.getMonth() + 1;
    const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;

    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: monthKey,
        year,
        monthNumber,
        monthName: new Date(year, monthNumber - 1).toLocaleString('default', {
          month: 'short',
        }),
        times: [],
        prs: [],
      };
    }

    groups[monthKey].times.push(pr.business_hours_to_first_approval_platform);
    groups[monthKey].prs.push(pr);
  });

  return Object.values(groups)
    .map((g) => {
      const stats = computeStats(g.times);
      return {
        month: g.month,
        year: g.year,
        monthNumber: g.monthNumber,
        monthName: g.monthName,
        prCount: stats.count,
        avgBusinessHours: stats.avg,
        medianBusinessHours: stats.median,
        minBusinessHours: stats.min,
        maxBusinessHours: stats.max,
        prs: g.prs,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNumber - b.monthNumber;
    });
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 text-xs min-w-[200px]">
      <p className="font-semibold text-sm mb-3">
        {d.monthName} &apos;{String(d.year).slice(-2)}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-muted-foreground">Average</span>
          </div>
          <span className="font-semibold text-violet-600">{d.avgBusinessHours}h</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-muted-foreground">Median</span>
          </div>
          <span className="font-semibold text-sky-600">{d.medianBusinessHours}h</span>
        </div>
        <div className="pt-2 border-t flex items-center justify-between gap-4">
          <span className="text-muted-foreground">PRs with platform approval</span>
          <span className="font-medium">{d.prCount}</span>
        </div>
      </div>
    </div>
  );
};

export function PlatformApprovalChart({ teamId, startDate, endDate, quarter, year }) {
  let options;
  if (startDate && endDate) {
    options = { start_date: startDate, end_date: endDate };
  } else {
    const currentDate = new Date();
    const effectiveQuarter = quarter ?? Math.floor(currentDate.getMonth() / 3) + 1;
    const effectiveYear = year ?? currentDate.getFullYear();
    options = { quarter: effectiveQuarter, year: effectiveYear };
  }

  const { data, loading, error } = useTeamReviewMetrics(teamId, options);

  const quarterLabel = startDate
    ? `${startDate} → ${endDate}`
    : `Q${options.quarter} ${options.year}`;

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-8 text-center">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading platform approval data…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-8 text-center text-destructive">
          <p className="text-sm">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Flatten all PRs from all members that have a non-null platform approval time
  const allPlatformPRs = (data?.memberMetrics ?? []).flatMap((member) =>
    (member.prs ?? [])
      .filter((pr) => pr.business_hours_to_first_approval_platform != null)
      .map((pr) => ({ ...pr, _member: member })),
  );

  const monthlyTrends = groupByMonth(allPlatformPRs);

  if (monthlyTrends.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Platform Approval Time
          </CardTitle>
          <CardDescription className="text-xs">
            Business hours to first platform approval — {quarterLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">
            No PRs with a recorded platform approval were found for {quarterLabel}.
          </p>
          <p className="text-xs mt-1 opacity-60">
            (PRs are included only when{' '}
            <code>business_hours_to_first_approval_platform</code> is not null.)
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = monthlyTrends.map((m) => ({
    ...m,
    name: `${m.monthName} '${String(m.year).slice(-2)}`,
  }));

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Platform Approval Time Trends
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Average and median time to first platform-team approval — {quarterLabel} (in
            business hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                label={{
                  value: 'Hours',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="avgBusinessHours"
                fill="#8b5cf6"
                name="Average Hours"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="medianBusinessHours"
                fill="#0ea5e9"
                name="Median Hours"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
              <Line
                type="monotone"
                dataKey="avgBusinessHours"
                stroke="#f97316"
                name="PR Count"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f97316' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">PRs</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Median</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Range</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((month, index) => (
                  <tr
                    key={month.month}
                    className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${
                      index === monthlyTrends.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium">
                      {month.monthName} &apos;{String(month.year).slice(-2)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">
                      {month.prCount}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span className="font-semibold text-violet-600">
                        {month.avgBusinessHours}h
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span className="font-semibold text-sky-600">
                        {month.medianBusinessHours}h
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-3 text-xs text-muted-foreground">
                      {month.minBusinessHours}h – {month.maxBusinessHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
