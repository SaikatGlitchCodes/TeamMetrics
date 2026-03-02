import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook to fetch team review metrics directly from backend
 * No context provider needed!
 */
export function useTeamReviewMetrics(teamId, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
      
      // Build query params
      const params = new URLSearchParams();
      if (options.quarter) params.append('quarter', options.quarter);
      if (options.year) params.append('year', options.year);
      if (options.start_date) params.append('start_date', options.start_date);
      if (options.end_date) params.append('end_date', options.end_date);
      
      const queryString = params.toString();
      const url = `${apiUrl}/review-metrics/team/${teamId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching review metrics:', url);
      const response = await axios.get(url);
      
      setData(response.data);
      console.log('Fetched review metrics:', response.data);
    } catch (err) {
      console.error('Error fetching team review metrics:', err);
      setError(err.message || 'Failed to fetch review metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    teamStats: data?.teamStats || null,
    memberMetrics: data?.memberMetrics || [],
    timeline: data?.timeline || null,
  };
}

/**
 * Hook to fetch user review metrics directly from backend
 * No context provider needed!
 */
export function useUserReviewMetrics(githubUsername, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!githubUsername) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://metrictracker-be1.onrender.com';
      
      // Build query params
      const params = new URLSearchParams();
      if (options.timeline) params.append('timeline', options.timeline);
      if (options.start_date) params.append('start_date', options.start_date);
      if (options.end_date) params.append('end_date', options.end_date);
      
      const queryString = params.toString();
      const url = `${apiUrl}/review-metrics/user/${githubUsername}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching user review metrics:', url);
      const response = await axios.get(url);
      
      setData(response.data);
    } catch (err) {
      console.error('Error fetching user review metrics:', err);
      setError(err.message || 'Failed to fetch review metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [githubUsername, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    stats: data?.stats || null,
    prs: data?.prs || [],
    user: data?.user || null,
    timeline: data?.timeline || null,
  };
}
