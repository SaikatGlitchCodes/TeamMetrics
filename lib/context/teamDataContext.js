'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const TeamDataContext = createContext(null);

export const TeamDataProvider = ({ children }) => {
  const [teamDataCache, setTeamDataCache] = useState(new Map());
  const [loadingTeams, setLoadingTeams] = useState(new Set());

  const fetchTeamData = useCallback(async (teamId, forceRefresh = false) => {
    // Check if data is already cached and not forcing refresh
    if (!forceRefresh && teamDataCache.has(teamId)) {
      const cached = teamDataCache.get(teamId);
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      if (Date.now() - cached.timestamp < cacheExpiry) {
        console.log(`Using cached data for team ${teamId}`);
        return cached.data;
      }
    }

    // Check if already loading this team
    if (loadingTeams.has(teamId)) {
      console.log(`Already loading team ${teamId}, skipping duplicate request`);
      return teamDataCache.get(teamId)?.data || [];
    }

    setLoadingTeams(prev => new Set(prev).add(teamId));

    try {
      const response = await axios.get(`https://metrictracker-be.onrender.com/prs/team/${teamId}`);
      console.log('response', response.data);
      
      // Cache the data with timestamp
      setTeamDataCache(prev => {
        const newCache = new Map(prev);
        newCache.set(teamId, {
          data: response.data,
          timestamp: Date.now()
        });
        return newCache;
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching team data:", error);
      throw error;
    } finally {
      setLoadingTeams(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }
  }, [teamDataCache, loadingTeams]);

  const getTeamData = useCallback((teamId) => {
    return teamDataCache.get(teamId)?.data || null;
  }, [teamDataCache]);

  const isLoadingTeam = useCallback((teamId) => {
    return loadingTeams.has(teamId);
  }, [loadingTeams]);

  const clearCache = useCallback((teamId) => {
    if (teamId) {
      setTeamDataCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(teamId);
        return newCache;
      });
    } else {
      setTeamDataCache(new Map());
    }
  }, []);

  const value = {
    fetchTeamData,
    getTeamData,
    isLoadingTeam,
    clearCache,
  };

  return (
    <TeamDataContext.Provider value={value}>
      {children}
    </TeamDataContext.Provider>
  );
};

export const useTeamData = () => {
  const context = useContext(TeamDataContext);
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  return context;
};
