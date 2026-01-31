'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';

interface AdminContextType {
  groups: any[];
  teams: any[];
  programs: any[];
  participants: any[]; // Cached participants
  loading: boolean;
  refreshGroups: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  refreshPrograms: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const data = await apiRequest('/groups');
      setGroups(data);
    } catch (e) {
      console.error("Failed to fetch groups", e);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await apiRequest('/teams');
      setTeams(data);
    } catch (e) {
      console.error("Failed to fetch teams", e);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await apiRequest('/programs');
      setPrograms(data);
    } catch (e) {
      console.error("Failed to fetch programs", e);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Fetches lightweight list (no images)
      const data = await apiRequest('/participants');
      setParticipants(data);
    } catch (e) {
      console.error("Failed to fetch participants", e);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGroups(), fetchTeams(), fetchPrograms(), fetchParticipants()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <AdminContext.Provider value={{
      groups,
      teams,
      programs,
      participants,
      loading,
      refreshGroups: fetchGroups,
      refreshTeams: fetchTeams,
      refreshPrograms: fetchPrograms,
      refreshParticipants: fetchParticipants,
      refreshAll
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminProvider');
  }
  return context;
}
