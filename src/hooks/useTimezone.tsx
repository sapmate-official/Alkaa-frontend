import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useAuth } from '../services/AuthContext';
import { useOrganizationSettingsQuery } from './queries/useOrganizationSettings';

interface TimezoneContextType {
  orgTimezone: string;
  workingHours: string;
  isLoading: boolean;
  error: string | null;
  refreshTimezone: () => Promise<void>;
  formatInOrgTimezone: (utcTimestamp: string, options?: Intl.DateTimeFormatOptions) => string;
  getCurrentOrgTime: () => string;
  convertToOrgTimezone: (utcTimestamp: string) => Date;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
  children: ReactNode;
}

export const TimezoneProvider = ({ children }: TimezoneProviderProps) => {
  const { user } = useAuth();
  const [orgTimezone, setOrgTimezone] = useState<string>('Asia/Kolkata'); // Default timezone
  const [workingHours, setWorkingHours] = useState<string>('9:00 AM - 6:00 PM'); // Default working hours
  
  // Use the organization settings query
  const orgId = user?.organization?.id;
  const { data: normalizedSettings, isLoading, error: queryError, refetch } = useOrganizationSettingsQuery(orgId, !!orgId);
  
  const error = queryError ? 'Failed to load organization timezone' : null;

  const refreshTimezone = async () => {
    await refetch();
  };

  // Update local state when query data changes
  useEffect(() => {
    if (normalizedSettings) {
      setOrgTimezone(normalizedSettings.timezone);
      setWorkingHours(normalizedSettings.workingHours);
    }
  }, [normalizedSettings]);

  // Format UTC timestamp in organization timezone
  const formatInOrgTimezone = (
    utcTimestamp: string, 
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    const date = new Date(utcTimestamp);
    return date.toLocaleString('en-US', {
      timeZone: orgTimezone,
      ...options
    });
  };

  // Get current time in organization timezone
  const getCurrentOrgTime = (): string => {
    return new Date().toLocaleString('en-US', {
      timeZone: orgTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Convert UTC timestamp to organization timezone
  const convertToOrgTimezone = (utcTimestamp: string): Date => {
    return new Date(utcTimestamp);
  };

  const value: TimezoneContextType = {
    orgTimezone,
    workingHours,
    isLoading,
    error,
    refreshTimezone,
    formatInOrgTimezone,
    getCurrentOrgTime,
    convertToOrgTimezone
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

// Hook for getting timezone without provider (fallback)
export const useOrganizationTimezone = () => {
  const { user } = useAuth();
  const orgId = user?.organization?.id;
  const { data: normalizedSettings, isLoading } = useOrganizationSettingsQuery(orgId, !!orgId);
  
  return { 
    orgTimezone: normalizedSettings?.timezone || 'Asia/Kolkata', 
    workingHours: normalizedSettings?.workingHours || '9:00 AM - 6:00 PM', 
    isLoading 
  };
};
