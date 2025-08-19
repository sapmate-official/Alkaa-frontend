/**
 * Time utility functions for consistent time handling across the web app
 */

export interface TimeFormatOptions {
  hour12?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
}

/**
 * Get current timestamp in ISO format for consistent backend processing
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Get current timezone
 */
export const getCurrentTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format time for display in 24-hour format
 */
export const formatTime24Hour = (date: Date): string => {
  return date.toLocaleTimeString('en-GB', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format time string for display in 24-hour format
 */
export const formatTimeString24Hour = (dateString: string): string => {
  const date = new Date(dateString);
  return formatTime24Hour(date);
};

/**
 * Format time for display in 12-hour format
 */
export const formatTime12Hour = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: true,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date and time for display
 */
export const formatDateTime = (
  dateString: string, 
  options: TimeFormatOptions = { hour12: false, showSeconds: true, showDate: true }
): string => {
  const date = new Date(dateString);
  
  let result = '';
  
  if (options.showDate) {
    result += date.toLocaleDateString('en-GB');
    result += ' ';
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour12: options.hour12 || false,
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (options.showSeconds) {
    timeOptions.second = '2-digit';
  }
  
  result += date.toLocaleTimeString(options.hour12 ? 'en-US' : 'en-GB', timeOptions);
  
  return result;
};

/**
 * Parse various date string formats to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Check if a date string is valid
 */
export const isValidDate = (dateString: string): boolean => {
  return parseDate(dateString) !== null;
};

/**
 * Get time difference in hours between two timestamps
 */
export const getTimeDifferenceHours = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
};

/**
 * Create attendance timestamp payload
 */
export const createTimestampPayload = () => ({
  clientTimestamp: getCurrentTimestamp(),
  clientTimezone: getCurrentTimezone(),
});

/**
 * Format duration from hours to readable string
 */
export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};
