import { useTimezone } from './useTimezone';

/**
 * Custom hook for timezone-aware date formatting
 * Uses organization timezone from context
 */
export const useDateTimeFormat = () => {
  const { orgTimezone, formatInOrgTimezone, getCurrentOrgTime } = useTimezone();

  /**
   * Format a UTC timestamp to display in organization timezone
   */
  const formatDateTime = (
    utcTimestamp: string,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    return formatInOrgTimezone(utcTimestamp, { ...defaultOptions, ...options });
  };

  /**
   * Format just the date part
   */
  const formatDate = (utcTimestamp: string): string => {
    return formatInOrgTimezone(utcTimestamp, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  /**
   * Format just the time part
   */
  const formatTime = (utcTimestamp: string, hour12: boolean = true): string => {
    return formatInOrgTimezone(utcTimestamp, {
      hour: '2-digit',
      minute: '2-digit',
      hour12
    });
  };

  /**
   * Format for attendance display (common use case)
   */
  const formatAttendanceTime = (utcTimestamp: string): string => {
    return formatInOrgTimezone(utcTimestamp, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  const getRelativeTime = (utcTimestamp: string): string => {
    const date = new Date(utcTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return formatDate(utcTimestamp);
  };

  /**
   * Check if a timestamp is today in organization timezone
   */
  const isToday = (utcTimestamp: string): boolean => {
    const date = new Date(utcTimestamp);
    const today = new Date();
    
    // Convert both to organization timezone date strings for comparison
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: orgTimezone });
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: orgTimezone });
    
    return dateStr === todayStr;
  };

  /**
   * Get day of week in organization timezone
   */
  const getDayOfWeek = (utcTimestamp: string): string => {
    return formatInOrgTimezone(utcTimestamp, { weekday: 'long' });
  };

  return {
    orgTimezone,
    formatDateTime,
    formatDate,
    formatTime,
    formatAttendanceTime,
    getRelativeTime,
    getCurrentOrgTime,
    isToday,
    getDayOfWeek
  };
};
