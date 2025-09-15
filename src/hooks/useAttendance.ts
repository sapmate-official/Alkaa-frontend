import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AttendanceRulesService,
  BreakManagementService,
  GeofencingService,
  AlertsService,
  AnalyticsService
} from '../services/AttendanceService';
import {
  BreakRecord,
  BreakPolicies,
  AlertConfiguration,
  CreateRuleRequest,
  CreateGeofenceRequest,
  StartBreakRequest,
  ValidateLocationRequest
} from '../interface/attendance';

// =====================================================
// UTILITY HOOKS FOR DEVICE AND LOCATION
// =====================================================

export const useDeviceInfo = () => {
  const [deviceInfo] = useState(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  }));

  return { deviceInfo };
};

export const useIpAddress = () => {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://api.ipify.org?format=json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch IP address');
        }
        
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setError('Failed to fetch IP address');
        setIpAddress('Unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchIpAddress();
  }, []);

  return { ipAddress, loading, error };
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLoading(false);
      setError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      setError(error.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  return { location, loading, error };
};

// =====================================================
// ATTENDANCE RULES HOOKS
// =====================================================

export const useAttendanceRules = (orgId: string) => {
  return useQuery({
    queryKey: ['attendance-rules', orgId],
    queryFn: () => AttendanceRulesService.getOrganizationRules(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateRule = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: CreateRuleRequest) => AttendanceRulesService.createRule(orgId, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules', orgId] });
    },
  });
};

export const useToggleRule = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      AttendanceRulesService.toggleRuleStatus(orgId, ruleId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules', orgId] });
    },
  });
};

export const useDeleteRule = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleId: string) => AttendanceRulesService.deleteRule(orgId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-rules', orgId] });
    },
  });
};

export const useViolationHistory = (
  orgId: string,
  filters?: {
    userId?: string;
    violationType?: string;
    fromDate?: string;
    toDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['violations', orgId, filters],
    queryFn: () => AttendanceRulesService.getViolationHistory(orgId, filters),
    enabled: !!orgId,
  });
};

export const useApproveViolation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ violationId, approved, rejectionReason }: {
      violationId: string;
      approved: boolean;
      rejectionReason?: string;
    }) => AttendanceRulesService.approveViolation(violationId, approved, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });
};

export const useRulesAnalytics = (orgId: string, days?: number) => {
  return useQuery({
    queryKey: ['rules-analytics', orgId, days],
    queryFn: () => AttendanceRulesService.getRulesAnalytics(orgId, days),
    enabled: !!orgId,
  });
};

// =====================================================
// BREAK MANAGEMENT HOOKS
// =====================================================

export const useActiveBreak = (userId: string) => {
  return useQuery({
    queryKey: ['active-break', userId],
    queryFn: () => BreakManagementService.getActiveBreak(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useStartBreak = (userId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (breakData: StartBreakRequest) => BreakManagementService.startBreak(userId, breakData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-break', userId] });
      queryClient.invalidateQueries({ queryKey: ['break-history', userId] });
    },
  });
};

export const useEndBreak = (userId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ breakId, location }: {
      breakId: string;
      location?: { latitude: number; longitude: number };
    }) => BreakManagementService.endBreak(userId, breakId, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-break', userId] });
      queryClient.invalidateQueries({ queryKey: ['break-history', userId] });
    },
  });
};

export const useBreakHistory = (
  userId: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
    breakType?: string;
  }
) => {
  return useQuery({
    queryKey: ['break-history', userId, filters],
    queryFn: () => BreakManagementService.getBreakHistory(userId, filters),
    enabled: !!userId,
  });
};

export const useBreakPolicies = (orgId: string) => {
  return useQuery({
    queryKey: ['break-policies', orgId],
    queryFn: () => BreakManagementService.getBreakPolicies(orgId),
    enabled: !!orgId,
  });
};

export const useConfigureBreakPolicies = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (policies: BreakPolicies) => BreakManagementService.configureBreakPolicies(orgId, policies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['break-policies', orgId] });
    },
  });
};

export const useBreakAnalytics = (orgId: string, days?: number, department?: string) => {
  return useQuery({
    queryKey: ['break-analytics', orgId, days, department],
    queryFn: () => BreakManagementService.getOrganizationBreakAnalytics(orgId, days, department),
    enabled: !!orgId,
  });
};

// =====================================================
// GEOFENCING HOOKS
// =====================================================

export const useGeofences = (orgId: string, filters?: { type?: string; isActive?: boolean }) => {
  return useQuery({
    queryKey: ['geofences', orgId, filters],
    queryFn: () => GeofencingService.getGeofences(orgId, filters),
    enabled: !!orgId,
  });
};

export const useCreateGeofence = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (geofence: CreateGeofenceRequest) => GeofencingService.createGeofence(orgId, geofence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', orgId] });
    },
  });
};

export const useUpdateGeofence = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ geofenceId, updates }: {
      geofenceId: string;
      updates: Partial<CreateGeofenceRequest>;
    }) => GeofencingService.updateGeofence(orgId, geofenceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', orgId] });
    },
  });
};

export const useDeleteGeofence = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (geofenceId: string) => GeofencingService.deleteGeofence(orgId, geofenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', orgId] });
    },
  });
};

export const useValidateLocation = (orgId: string) => {
  return useMutation({
    mutationFn: (location: ValidateLocationRequest) => GeofencingService.validateLocation(orgId, location),
  });
};

export const useLocationValidationHistory = (
  orgId: string,
  filters?: {
    userId?: string;
    geofenceId?: string;
    fromDate?: string;
    toDate?: string;
    isValid?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['validation-history', orgId, filters],
    queryFn: () => GeofencingService.getValidationHistory(orgId, filters),
    enabled: !!orgId,
  });
};

export const useGeofencingAnalytics = (orgId: string, days?: number) => {
  return useQuery({
    queryKey: ['geofencing-analytics', orgId, days],
    queryFn: () => GeofencingService.getGeofencingAnalytics(orgId, days),
    enabled: !!orgId,
  });
};

export const useNearbyGeofences = (
  orgId: string,
  latitude?: number,
  longitude?: number,
  radius?: number
) => {
  return useQuery({
    queryKey: ['nearby-geofences', orgId, latitude, longitude, radius],
    queryFn: () => GeofencingService.getNearbyGeofences(orgId, latitude!, longitude!, radius),
    enabled: !!orgId && latitude !== undefined && longitude !== undefined,
  });
};

// =====================================================
// ALERTS HOOKS
// =====================================================

export const useAlertConfiguration = (orgId: string) => {
  return useQuery({
    queryKey: ['alert-config', orgId],
    queryFn: () => AlertsService.getAlertConfiguration(orgId),
    enabled: !!orgId,
  });
};

export const useUpdateAlertConfiguration = (orgId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: AlertConfiguration) => AlertsService.updateAlertConfiguration(orgId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-config', orgId] });
    },
  });
};

export const useOrganizationAlerts = (
  orgId: string,
  filters?: {
    userId?: string;
    type?: string;
    severity?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['org-alerts', orgId, filters],
    queryFn: () => AlertsService.getOrganizationAlerts(orgId, filters),
    enabled: !!orgId,
  });
};

export const useUserAlerts = (
  userId: string,
  filters?: {
    type?: string;
    status?: string;
  }
) => {
  return useQuery({
    queryKey: ['user-alerts', userId, filters],
    queryFn: () => AlertsService.getUserAlerts(userId, filters),
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => AlertsService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
};

export const useBulkAcknowledgeAlerts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertIds: string[]) => AlertsService.bulkAcknowledgeAlerts(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
};

export const useAlertStatistics = (orgId: string, days?: number) => {
  return useQuery({
    queryKey: ['alert-statistics', orgId, days],
    queryFn: () => AlertsService.getAlertStatistics(orgId, days),
    enabled: !!orgId,
  });
};

// =====================================================
// ANALYTICS HOOKS
// =====================================================

export const useOrganizationAnalytics = (
  orgId: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
    department?: string;
    employeeIds?: string[];
    includeViolations?: boolean;
    includeBreaks?: boolean;
    includeGeofencing?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['org-analytics', orgId, filters],
    queryFn: () => AnalyticsService.getOrganizationAnalytics(orgId, filters),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useEmployeeAnalytics = (
  orgId: string,
  userId: string,
  filters?: {
    fromDate?: string;
    toDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['employee-analytics', orgId, userId, filters],
    queryFn: () => AnalyticsService.getEmployeeAnalytics(orgId, userId, filters),
    enabled: !!orgId && !!userId,
  });
};

export const useAttendanceTrends = (
  orgId: string,
  options?: {
    period?: 'daily' | 'weekly' | 'monthly';
    days?: number;
  }
) => {
  return useQuery({
    queryKey: ['attendance-trends', orgId, options],
    queryFn: () => AnalyticsService.getAttendanceTrends(orgId, options),
    enabled: !!orgId,
  });
};

// =====================================================
// CUSTOM HOOKS
// =====================================================

export const useBreakTimer = (activeBreak: BreakRecord | null) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeBreak) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(activeBreak.startTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeBreak]);

  const formatTime = useMemo(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }, [elapsedTime]);

  return {
    elapsedTime,
    formatTime,
    isOnBreak: !!activeBreak
  };
};

export const useLocationPermission = () => {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    setLoading(true);
    try {
      if ('geolocation' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state);
        
        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return {
    permission,
    loading,
    getCurrentLocation,
    hasPermission: permission === 'granted'
  };
};

export const useAttendanceNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options
      });
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    hasPermission: permission === 'granted'
  };
};
