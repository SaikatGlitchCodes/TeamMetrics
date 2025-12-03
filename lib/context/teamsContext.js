'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const TeamsContext = createContext(null);

export const TeamsProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchTeams = useCallback(async (forceRefresh = false) => {
    // Only fetch if we don't have data or force refresh is requested
    // or if data is older than 5 minutes
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    const shouldFetch = forceRefresh || 
                       teams.length === 0 || 
                       !lastFetch || 
                       (Date.now() - lastFetch > cacheExpiry);

    if (!shouldFetch) {
      console.log('Using cached teams data');
      return teams;
    }

    setLoading(true);
    try {
      const { data } = await axios.get('https://metrictracker-be.onrender.com/teams');
      console.log('team', data.teams);
      setTeams(data.teams);
      setLastFetch(Date.now());
      return data.teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [teams, lastFetch]);

  const value = {
    teams,
    loading,
    fetchTeams,
    setTeams, // Allow manual updates if needed
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
};
