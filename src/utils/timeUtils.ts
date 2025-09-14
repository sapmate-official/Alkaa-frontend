/**
 * Time utility functions for consistent time handling across the web app
 * Now supports organization-specific timezone management
 */

export interface TimeFormatOptions {
  hour12?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
  timezone?: string;
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
 * Convert UTC timestamp to organization timezone
 * @param utcTimestamp - UTC timestamp string
 * @param orgTimezone - Organization timezone (optional, falls back to current timezone)
 * @returns Date object
 */
export const convertToOrgTimezone = (utcTimestamp: string): Date => {
  const utcDate = new Date(utcTimestamp);
  // Note: Date object stores UTC internally, timezone conversion happens during formatting
  // This function maintains the same Date object but documents the intended timezone
  return utcDate;
};

/**
 * Format timestamp in organization timezone
 * @param utcTimestamp - UTC timestamp string  
 * @param orgTimezone - Organization timezone
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatInOrgTimezone = (
  utcTimestamp: string, 
  orgTimezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const date = new Date(utcTimestamp);
  return date.toLocaleString('en-US', {
    timeZone: orgTimezone,
    ...options
  });
};

/**
 * Get current timestamp in organization timezone for display
 * @param orgTimezone - Organization timezone
 * @returns Formatted current time string
 */
export const getCurrentOrgTime = (orgTimezone: string): string => {
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

/**
 * Enhanced timezone utilities for organization-specific timezone handling
 */

/**
 * Format attendance time in organization timezone
 */
export const formatAttendanceTime = (
  utcTimestamp: string, 
  orgTimezone: string = 'Asia/Kolkata'
): string => {
  return formatInOrgTimezone(utcTimestamp, orgTimezone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format attendance date in organization timezone
 */
export const formatAttendanceDate = (
  utcTimestamp: string, 
  orgTimezone: string = 'Asia/Kolkata'
): string => {
  return formatInOrgTimezone(utcTimestamp, orgTimezone, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format attendance datetime in organization timezone
 */
export const formatAttendanceDateTime = (
  utcTimestamp: string, 
  orgTimezone: string = 'Asia/Kolkata'
): string => {
  return formatInOrgTimezone(utcTimestamp, orgTimezone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get start of day in organization timezone (as UTC)
 */
export const getStartOfDayInOrgTimezone = (
  date: Date, 
  orgTimezone: string = 'Asia/Kolkata'
): Date => {
  const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const startOfDayInOrgTZ = new Date(`${dateString}T00:00:00`);
  
  // Convert to UTC by adjusting for timezone offset
  const tempDate = new Date(startOfDayInOrgTZ.toLocaleString('en-US', { timeZone: 'UTC' }));
  const orgDate = new Date(startOfDayInOrgTZ.toLocaleString('en-US', { timeZone: orgTimezone }));
  const offset = tempDate.getTime() - orgDate.getTime();
  
  return new Date(startOfDayInOrgTZ.getTime() + offset);
};

/**
 * Get end of day in organization timezone (as UTC)
 */
export const getEndOfDayInOrgTimezone = (
  date: Date, 
  orgTimezone: string = 'Asia/Kolkata'
): Date => {
  const startOfDay = getStartOfDayInOrgTimezone(date, orgTimezone);
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1); // Add 23:59:59.999
};

/**
 * Check if a UTC timestamp falls on a specific date in org timezone
 */
export const isOnDateInOrgTimezone = (
  utcTimestamp: string,
  targetDate: Date,
  orgTimezone: string = 'Asia/Kolkata'
): boolean => {
  const timestampInOrgTZ = formatInOrgTimezone(utcTimestamp, orgTimezone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const targetDateInOrgTZ = formatInOrgTimezone(targetDate.toISOString(), orgTimezone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return timestampInOrgTZ === targetDateInOrgTZ;
};

/**
 * Convert organization timezone date to UTC for API calls
 */
export const convertOrgDateToUTC = (
  dateString: string, // YYYY-MM-DD format
  timeString: string, // HH:MM format
  _orgTimezone: string = 'Asia/Kolkata' // Prefixed with _ to indicate unused
): string => {
  // Create a date in the organization timezone
  const dateTimeString = `${dateString}T${timeString}:00`;
  
  // This is a simplified approach - for production, consider using libraries like date-fns-tz
  const date = new Date(dateTimeString);
  
  // For now, return ISO string (this assumes the input is already in the correct timezone)
  return date.toISOString();
};
