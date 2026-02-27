/**
 * Aggregates review metrics data by month
 * Takes raw data from /review-metrics endpoint and groups by month
 */

/**
 * Group PRs by month and calculate monthly stats
 * @param {Array} prs - Array of PRs with business_hours_to_first_review
 * @returns {Array} - Monthly aggregated data
 */
export function aggregateByMonth(prs) {
  if (!prs || prs.length === 0) return [];

  console.log('=== Aggregating PRs by Month ===');
  console.log('Total PRs to aggregate:', prs.length);

  // Group PRs by month
  const monthlyGroups = {};
  let skippedCount = 0;

  prs.forEach(pr => {
    // Only skip if business_hours_to_first_review is null or undefined
    // Include 0 and all positive values (even very small ones like 0.1)
    const businessHours = pr.business_hours_to_first_review;
    if (businessHours === null || businessHours === undefined) {
      console.log('Skipping PR (null/undefined business_hours):', pr.title, '| value:', businessHours);
      skippedCount++;
      return;
    }

    // Skip PRs that were only reviewed by the platform team (no internal review)
    if (pr.first_approval_platform && !pr.first_reviewer_submitted_at) {
      skippedCount++;
      return;
    }

    const date = new Date(pr.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        month: monthKey,
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1,
        prs: [],
        reviewTimes: []
      };
    }

    monthlyGroups[monthKey].prs.push(pr);
    monthlyGroups[monthKey].reviewTimes.push(businessHours);
  });

  console.log('Aggregation summary:', {
    total: prs.length,
    skipped: skippedCount,
    included: prs.length - skippedCount
  });

  console.log('Monthly groups:', Object.keys(monthlyGroups).map(key => ({
    month: key,
    count: monthlyGroups[key].prs.length
  })));

  // Calculate stats for each month
  const monthlyStats = Object.values(monthlyGroups).map(group => {
    const times = group.reviewTimes.sort((a, b) => a - b);
    const count = times.length;

    // Calculate average
    const avg = times.reduce((sum, time) => sum + time, 0) / count;

    // Calculate median
    const mid = Math.floor(count / 2);
    const median = count % 2 === 0
      ? (times[mid - 1] + times[mid]) / 2
      : times[mid];

    return {
      month: group.month,
      year: group.year,
      monthNumber: group.monthNumber,
      monthName: new Date(group.year, group.monthNumber - 1).toLocaleString('default', { month: 'short' }),
      prCount: count,
      avgBusinessHours: parseFloat(avg.toFixed(2)),
      medianBusinessHours: parseFloat(median.toFixed(2)),
      minBusinessHours: parseFloat(Math.min(...times).toFixed(2)),
      maxBusinessHours: parseFloat(Math.max(...times).toFixed(2)),
      prs: group.prs
    };
  });

  // Sort by date
  return monthlyStats.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNumber - b.monthNumber;
  });
}

/**
 * Calculate Month-over-Month (MoM) changes
 * Formula: ((Previous - Current) / Previous) * 100
 * Positive % = Improvement (faster reviews)
 * Negative % = Regression (slower reviews)
 * @param {Array} monthlyData - Monthly aggregated data
 * @returns {Array} - Monthly data with MoM changes
 */
export function calculateMoM(monthlyData) {
  if (!monthlyData || monthlyData.length < 2) {
    return monthlyData.map(m => ({ ...m, momChange: null, momPercentage: null }));
  }

  return monthlyData.map((current, index) => {
    if (index === 0) {
      return {
        ...current,
        momChange: null,
        momPercentage: null
      };
    }

    const previous = monthlyData[index - 1];
    
    // MoM Improvement (%) = ((Previous - Current) / Previous) × 100
    // Positive % = Improvement (faster reviews)
    const avgChange = previous.avgBusinessHours - current.avgBusinessHours;
    const avgPercentage = previous.avgBusinessHours > 0
      ? ((avgChange / previous.avgBusinessHours) * 100)
      : 0;

    const medianChange = previous.medianBusinessHours - current.medianBusinessHours;
    const medianPercentage = previous.medianBusinessHours > 0
      ? ((medianChange / previous.medianBusinessHours) * 100)
      : 0;

    return {
      ...current,
      momChange: {
        avg: parseFloat(avgChange.toFixed(2)),
        median: parseFloat(medianChange.toFixed(2))
      },
      momPercentage: {
        avg: parseFloat(avgPercentage.toFixed(2)),
        median: parseFloat(medianPercentage.toFixed(2))
      }
    };
  });
}

/**
 * Process team review metrics for monthly trends
 * @param {Object} reviewMetricsData - Data from /review-metrics/team/:team_id
 * @returns {Object} - Processed data with monthly trends
 */
export function processTeamReviewMetrics(reviewMetricsData) {
  if (!reviewMetricsData || !reviewMetricsData.memberMetrics) {
    return {
      monthlyTrends: [],
      memberMonthlyTrends: {}
    };
  }

  // Aggregate all team PRs by month
  const allPRs = reviewMetricsData.memberMetrics.flatMap(member => member.prs || []);
  const monthlyData = aggregateByMonth(allPRs);
  const monthlyWithMoM = calculateMoM(monthlyData);

  // Aggregate per member by month
  const memberMonthlyTrends = {};
  reviewMetricsData.memberMetrics.forEach(member => {
    const memberMonthly = aggregateByMonth(member.prs || []);
    const memberWithMoM = calculateMoM(memberMonthly);
    memberMonthlyTrends[member.github_username] = memberWithMoM;
  });

  return {
    monthlyTrends: monthlyWithMoM,
    memberMonthlyTrends,
    teamStats: reviewMetricsData.teamStats,
    timeline: reviewMetricsData.timeline
  };
}

/**
 * Format data for chart libraries (like Chart.js, Recharts, etc.)
 * @param {Array} monthlyData - Monthly data with MoM
 * @returns {Object} - Chart-ready data
 */
export function formatForChart(monthlyData) {
  return {
    labels: monthlyData.map(m => `${m.monthName} ${m.year}`),
    avgData: monthlyData.map(m => m.avgBusinessHours),
    medianData: monthlyData.map(m => m.medianBusinessHours),
    prCounts: monthlyData.map(m => m.prCount),
    momAvg: monthlyData.map(m => m.momPercentage?.avg || 0),
    momMedian: monthlyData.map(m => m.momPercentage?.median || 0)
  };
}
