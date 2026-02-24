'use client';

import { useTeamReviewMetrics } from '@/lib/hooks/useReviewMetrics';
import { processTeamReviewMetrics } from '@/lib/utils/reviewMetricsAggregator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function MonthlyReviewBarChart({ teamId, startDate, endDate, quarter, year }) {
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

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-8 text-center">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading metrics...</p>
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

  // Process data to get monthly trends
  const { monthlyTrends } = processTeamReviewMetrics(data);

  if (!monthlyTrends || monthlyTrends.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">No review data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = monthlyTrends.map(month => ({
    name: `${month.monthName} '${String(month.year).slice(-2)}`,
    avgHours: month.avgBusinessHours,
    medianHours: month.medianBusinessHours,
    prCount: month.prCount,
    monthKey: month.month
  }));

  // Custom tooltip with better design
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const monthData = monthlyTrends.find(m => m.month === data.monthKey);
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4">
          <p className="font-semibold text-sm mb-3">{data.name}</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6366f1' }}></div>
                <span className="text-muted-foreground">Average</span>
              </div>
              <span className="font-semibold">{data.avgHours}h</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-muted-foreground">Median</span>
              </div>
              <span className="font-semibold">{data.medianHours}h</span>
            </div>
            <div className="pt-2 border-t flex items-center justify-between gap-4">
              <span className="text-muted-foreground">PRs Reviewed</span>
              <span className="font-medium">{data.prCount}</span>
            </div>
            {monthData?.momPercentage?.avg !== null && monthData?.momPercentage?.avg !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">MoM Change</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  monthData.momPercentage.avg > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {monthData.momPercentage.avg > 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {monthData.momPercentage.avg > 0 ? '+' : ''}
                  {monthData.momPercentage.avg}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Compact Bar Chart */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Internal Review Time Trends</CardTitle>
          <CardDescription className="text-xs">
            Average and median review times by month — current quarter (in business hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis 
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                className="text-xs"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar 
                dataKey="avgHours" 
                fill="#6366f1" 
                name="Average Hours"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
              <Bar 
                dataKey="medianHours" 
                fill="#10b981" 
                name="Median Hours"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Compact Table */}
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
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">MoM</th>
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
                      {month.monthName} '{String(month.year).slice(-2)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">
                      {month.prCount}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span className="font-semibold text-indigo-600">{month.avgBusinessHours}h</span>
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span className="font-semibold text-emerald-600">{month.medianBusinessHours}h</span>
                    </td>
                    <td className="text-right py-2.5 px-3 text-xs text-muted-foreground">
                      {month.minBusinessHours}h - {month.maxBusinessHours}h
                    </td>
                    <td className="text-right py-2.5 px-3">
                      {month.momPercentage?.avg !== null && month.momPercentage?.avg !== undefined ? (
                        <span className={`font-semibold text-xs inline-flex items-center gap-1 ${
                          month.momPercentage.avg > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {month.momPercentage.avg > 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {month.momPercentage.avg > 0 ? '+' : ''}
                          {month.momPercentage.avg}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
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
