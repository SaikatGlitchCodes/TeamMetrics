'use client';

import { useTeamReviewMetrics } from '@/lib/hooks/useReviewMetrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import { usePopup } from '@/hooks/usePopup';
import { ViewPRsPopup } from './common/ViewPRsPopup';

/**
 * Compute SLA stats for a set of PRs grouped by month.
 *
 * Rules:
 * - Only PRs with `estimated_end_date` are counted.
 * - Start date = ready_for_review_at ?? created_at
 * - Review time = first_reviewer_submitted_at ?? first_approval_platform
 * - "Within SLA" = review time is between start date and estimated_end_date (inclusive)
 * - "Not Compliant" = no estimated_end_date
 * - "Outside SLA" = review time exists but is after estimated_end_date
 * - "No Review Yet" = both review fields are null
 */
function computeSLAByMonth(prs, teamName='') {
  if (!prs || prs.length === 0) return [];

  const monthlyGroups = {};
  const teamList = teamName.includes('Internal') ? prs.filter(pr=> !pr.first_approval_platform) : prs.filter(pr=> pr.first_approval_platform);

  teamList.forEach((pr) => {

    const startDate = pr.ready_for_review_at
      ? new Date(pr.ready_for_review_at)
      : new Date(pr.created_at);

    const year = startDate.getFullYear();
    const monthNumber = startDate.getMonth() + 1;
    const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        month: monthKey,
        year,
        monthNumber,
        monthName: new Date(year, monthNumber - 1).toLocaleString('default', { month: 'short' }),
        total: 0,
        withinSLA: 0,
        outsideSLA: 0,
        noReview: 0,
        notCompliant: 0,
        outsideSLAList: [],
      };
    }

    const group = monthlyGroups[monthKey];
    group.total += 1;

    if (!pr.estimated_end_date) {
      group.notCompliant += 1; 
      return;
    }

    const estimatedEnd = new Date(pr.estimated_end_date);
    const firstReview = teamName.includes('Internal')
      ? new Date(pr.first_reviewer_submitted_at)
      : new Date(pr.first_approval_platform);

    if (!firstReview) {
      group.noReview += 1;
    } else if (firstReview >= startDate && firstReview <= estimatedEnd) {
      group.withinSLA += 1;
    } else {
      group.outsideSLA += 1;
      group.outsideSLAList.push(pr);
    }
  });

  return Object.values(monthlyGroups).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNumber - b.monthNumber;
  });
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;
  const reviewedTotal = d.withinSLA + d.outsideSLA;
  const slaRate = reviewedTotal > 0 ? ((d.withinSLA / reviewedTotal) * 100).toFixed(1) : 'N/A';

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 text-xs min-w-[190px]">
      <p className="font-semibold text-sm mb-3">
        {d.monthName} &apos;{String(d.year).slice(-2)}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Total (w/ est. date)</span>
          <span className="font-semibold">{d.total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Within SLA</span>
          </div>
          <span className="font-semibold text-emerald-600">{d.withinSLA}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">Outside SLA</span>
          </div>
          <span className="font-semibold text-rose-600">{d.outsideSLA}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Not compliant</span>
            </div>
            <span className="font-semibold text-muted-foreground">{d.notCompliant}</span>
        </div>
        {d.noReview > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">No Review Yet</span>
            </div>
            <span className="font-semibold text-muted-foreground">{d.noReview}</span>
          </div>
        )}
        <div className="pt-2 border-t flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-medium">SLA Rate</span>
          <span
            className={`font-bold ${
              slaRate !== 'N/A' && parseFloat(slaRate) >= 80
                ? 'text-emerald-600'
                : slaRate !== 'N/A' && parseFloat(slaRate) >= 50
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}
          >
            {slaRate !== 'N/A' ? `${slaRate}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function SLAChart({ teamName = '',teamId, quarter, year }) {
  // Pass quarter/year directly so the BACKEND uses its own quarter boundaries.
  // (Do NOT compute start_date/end_date from the quarter — the backend's Q1 2026
  // starts Nov 30, 2025, not Jan 1, 2026.)
  const currentDate = new Date();
  const effectiveQuarter = quarter ?? Math.floor(currentDate.getMonth() / 3) + 1;
  const effectiveYear = year ?? currentDate.getFullYear();

  const options = { quarter: effectiveQuarter, year: effectiveYear };

  const quarterLabel = `Q${effectiveQuarter} ${effectiveYear}`;

  const { data, loading, error } = useTeamReviewMetrics(teamId, options);

  const { showPopup, hidePopup, Popup } = usePopup();

  const handleOutsideSLAClick = (prs, monthName) => {
    const content = <ViewPRsPopup repos={prs} displayName={`Outside SLA PRs for ${monthName}`} />;
    showPopup(content, `Outside SLA PRs`);
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm h-full">
        <CardContent className="py-8 text-center">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading SLA data…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm h-full">
        <CardContent className="py-8 text-center text-destructive">
          <p className="text-sm">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const allPRs = data?.memberMetrics?.flatMap((m) => m.prs || []) ?? [];

  const totalWithEstimate = allPRs.filter((p) => !!p.estimated_end_date).length;
  const slaData = computeSLAByMonth(allPRs, teamName);

  if (slaData.length === 0 || totalWithEstimate === 0) {
    return (
      <Card className="border-none shadow-sm h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{teamName} SLA Compliance</CardTitle>
          <CardDescription className="text-xs">
            First review within estimated end date — {quarterLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No PRs with an estimated end date found for {quarterLabel}.</p>
          <p className="text-xs mt-1 opacity-60">
            ({allPRs.length} total PRs, {totalWithEstimate} with estimated_end_date)
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build chart data
  const chartData = slaData.map((m) => {
    const reviewedTotal = m.withinSLA + m.outsideSLA;
    const slaRate =
      reviewedTotal > 0 ? parseFloat(((m.withinSLA / reviewedTotal) * 100).toFixed(1)) : 0;
    return { ...m, name: `${m.monthName} '${String(m.year).slice(-2)}`, slaRate };
  });

  // Overall SLA rate
  const totalReviewed = slaData.reduce((s, m) => s + m.withinSLA + m.outsideSLA, 0);
  const totalWithin = slaData.reduce((s, m) => s + m.withinSLA, 0);
  const overallRate =
    totalReviewed > 0 ? ((totalWithin / totalReviewed) * 100).toFixed(1) : 'N/A';

  const getBarColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <>
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg"> {teamName} SLA Compliance</CardTitle>
              <CardDescription className="text-xs mt-1">
                First review within estimated end date — {quarterLabel}
              </CardDescription>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${
                overallRate !== 'N/A' && parseFloat(overallRate) >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : overallRate !== 'N/A' && parseFloat(overallRate) >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {overallRate !== 'N/A' && parseFloat(overallRate) >= 80 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {overallRate !== 'N/A' ? `${overallRate}% SLA` : 'N/A'}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="slaRate" name="SLA Rate" radius={[6, 6, 0, 0]} maxBarSize={70}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.slaRate)} />
                ))}
                <LabelList
                  dataKey="slaRate"
                  position="top"
                  formatter={(v) => `${v}%`}
                  style={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }}
                />
              </Bar>
              <Line
                type="monotone"
                dataKey="slaRate"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1d4ed8' }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Summary table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Total</th>
                  <th className="text-right py-2 px-2 font-medium text-emerald-600">Within SLA</th>
                  <th className="text-right py-2 px-2 font-medium text-rose-600">Outside SLA</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Not Compliant</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">No Review</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">Rate</th>
                </tr>
              </thead>
              <tbody>
                {slaData.map((m, i) => {
                  const reviewedTotal = m.withinSLA + m.outsideSLA;
                  const rate =
                    reviewedTotal > 0
                      ? `${((m.withinSLA / reviewedTotal) * 100).toFixed(1)}%`
                      : '—';
                  return (
                    <tr
                      key={m.month}
                      className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${
                        i === slaData.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="py-2 px-2 font-medium">
                        {m.monthName} &apos;{String(m.year).slice(-2)}
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{m.total}</td>
                      <td className="text-right py-2 px-2 font-semibold text-emerald-600">
                        {m.withinSLA}
                      </td>
                      <td
                        className="text-right py-2 px-2 font-semibold text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => handleOutsideSLAClick(m.outsideSLAList || [], m.monthName)}
                      >
                        {m.outsideSLA}
                      </td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{m.notCompliant}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{m.noReview}</td>
                      <td className="text-right py-2 px-2 font-bold">{rate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Popup />
    </>
  );
}
