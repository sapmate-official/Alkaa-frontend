import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import components to test
import AttendanceDashboard from '../components/attendance/AttendanceDashboard';
import AttendanceRulesManager from '../components/attendance/rules/AttendanceRulesManager';
import BreakManagement from '../components/attendance/breaks/BreakManagement';
import GeofencingManagement from '../components/attendance/geofencing/GeofencingManagement';

// Mock the attendance services
jest.mock('../services/AttendanceService', () => ({
  AttendanceRulesService: {
    getRules: jest.fn(),
    createRule: jest.fn(),
    updateRule: jest.fn(),
    deleteRule: jest.fn(),
  },
  BreakManagementService: {
    getActiveBreak: jest.fn(),
    startBreak: jest.fn(),
    endBreak: jest.fn(),
    getBreakHistory: jest.fn(),
  },
  GeofencingService: {
    getGeofences: jest.fn(),
    createGeofence: jest.fn(),
    updateGeofence: jest.fn(),
    deleteGeofence: jest.fn(),
    verifyLocation: jest.fn(),
  },
  AlertsService: {
    getAlerts: jest.fn(),
    createAlert: jest.fn(),
    markAsRead: jest.fn(),
  },
  AnalyticsService: {
    getOverview: jest.fn(),
    getTrends: jest.fn(),
    getViolationAnalytics: jest.fn(),
    getBreakAnalytics: jest.fn(),
  }
}));

// Mock the attendance hooks
jest.mock('../hooks/useAttendance', () => ({
  useAttendanceRules: () => ({
    data: mockRules,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useActiveBreak: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useBreakTimer: () => ({
    timer: '00:00:00',
    isRunning: false,
  }),
  useGeofences: () => ({
    data: mockGeofences,
    isLoading: false,
    error: null,
  }),
  useLocationPermission: () => ({
    hasPermission: true,
    requestPermission: jest.fn(),
    getCurrentLocation: jest.fn(),
  }),
  useAttendanceAnalytics: () => ({
    data: mockAnalytics,
    isLoading: false,
    error: null,
  }),
  useAttendanceAlerts: () => ({
    data: mockAlerts,
    isLoading: false,
    error: null,
  }),
  useCreateRule: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
  useUpdateRule: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
  useDeleteRule: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
  useStartBreak: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
  useEndBreak: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

// Mock data
const mockRules = [
  {
    id: '1',
    ruleType: 'LATE_ARRIVAL',
    threshold: 15,
    penalty: 100,
    description: 'Late arrival penalty',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ruleType: 'EARLY_DEPARTURE',
    threshold: 30,
    penalty: 150,
    description: 'Early departure penalty',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  }
];

const mockGeofences = [
  {
    id: '1',
    name: 'Main Office',
    type: 'OFFICE',
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 100,
    description: 'Main office location',
    isActive: true,
  },
  {
    id: '2',
    name: 'Branch Office',
    type: 'OFFICE',
    latitude: 40.7580,
    longitude: -73.9855,
    radius: 150,
    description: 'Branch office location',
    isActive: true,
  }
];

const mockAnalytics = {
  summary: {
    totalEmployees: 100,
    presentToday: 85,
    onBreak: 5,
    violationsToday: 3,
  },
  trends: [
    { date: '2024-01-01', present: 80, violations: 2 },
    { date: '2024-01-02', present: 85, violations: 1 },
  ]
};

const mockAlerts = [
  {
    id: '1',
    type: 'LATE_ARRIVAL',
    message: 'John Doe arrived 20 minutes late',
    severity: 'MEDIUM',
    isRead: false,
    createdAt: '2024-01-01T09:20:00Z',
  },
  {
    id: '2',
    type: 'GEOFENCE_VIOLATION',
    message: 'Jane Smith checked in outside office location',
    severity: 'HIGH',
    isRead: false,
    createdAt: '2024-01-01T09:15:00Z',
  }
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// 🧪 COMPREHENSIVE FRONTEND COMPONENT TESTS
describe('Attendance System Frontend Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  // ===================================
  // ATTENDANCE DASHBOARD TESTS
  // ===================================
  describe('AttendanceDashboard Component', () => {
    test('should render dashboard with all tabs', async () => {
      render(
        <TestWrapper>
          <AttendanceDashboard userRole="admin" />
        </TestWrapper>
      );

      expect(screen.getByText('Attendance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText('Breaks')).toBeInTheDocument();
      expect(screen.getByText('Geofencing')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('should show role-based content for admin', async () => {
      render(
        <TestWrapper>
          <AttendanceDashboard userRole="admin" />
        </TestWrapper>
      );

      // Admin should see management features
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText('Geofencing')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('should show limited content for employee', async () => {
      render(
        <TestWrapper>
          <AttendanceDashboard userRole="employee" />
        </TestWrapper>
      );

      // Employee should see limited features
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Breaks')).toBeInTheDocument();
    });

    test('should handle tab navigation', async () => {
      render(
        <TestWrapper>
          <AttendanceDashboard userRole="admin" />
        </TestWrapper>
      );

      // Click on Rules tab
      const rulesTab = screen.getByText('Rules');
      fireEvent.click(rulesTab);

      await waitFor(() => {
        expect(screen.getByText('Attendance Rules Management')).toBeInTheDocument();
      });
    });
  });

  // ===================================
  // ATTENDANCE RULES MANAGER TESTS
  // ===================================
  describe('AttendanceRulesManager Component', () => {
    test('should render rules list', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      expect(screen.getByText('Attendance Rules Management')).toBeInTheDocument();
      expect(screen.getByText('Create New Rule')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Late arrival penalty')).toBeInTheDocument();
        expect(screen.getByText('Early departure penalty')).toBeInTheDocument();
      });
    });

    test('should open create rule dialog', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Attendance Rule')).toBeInTheDocument();
        expect(screen.getByLabelText('Rule Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Threshold (minutes)')).toBeInTheDocument();
        expect(screen.getByLabelText('Penalty Amount')).toBeInTheDocument();
      });
    });

    test('should validate rule creation form', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Rule');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Rule type is required')).toBeInTheDocument();
      });
    });

    test('should handle rule editing', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Attendance Rule')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Late arrival penalty')).toBeInTheDocument();
      });
    });

    test('should handle rule deletion', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this rule?')).toBeInTheDocument();
      });
    });
  });

  // ===================================
  // BREAK MANAGEMENT TESTS
  // ===================================
  describe('BreakManagement Component', () => {
    test('should render break interface', async () => {
      render(
        <TestWrapper>
          <BreakManagement userId="test-user" />
        </TestWrapper>
      );

      expect(screen.getByText('Break Management')).toBeInTheDocument();
      expect(screen.getByText('Start Break')).toBeInTheDocument();
      expect(screen.getByText('Break History')).toBeInTheDocument();
    });

    test('should show break timer when active', async () => {
      // Mock active break
      jest.doMock('../src/hooks/useAttendance', () => ({
        ...jest.requireActual('../src/hooks/useAttendance'),
        useActiveBreak: () => ({
          data: {
            id: '1',
            type: 'LUNCH',
            startTime: '2024-01-01T12:00:00Z',
            reason: 'Lunch break'
          },
          isLoading: false,
          error: null,
        }),
        useBreakTimer: () => ({
          timer: '00:15:30',
          isRunning: true,
        }),
      }));

      render(
        <TestWrapper>
          <BreakManagement userId="test-user" />
        </TestWrapper>
      );

      expect(screen.getByText('Active Break')).toBeInTheDocument();
      expect(screen.getByText('00:15:30')).toBeInTheDocument();
      expect(screen.getByText('End Break')).toBeInTheDocument();
    });

    test('should handle break start', async () => {
      render(
        <TestWrapper>
          <BreakManagement userId="test-user" />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Break');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Start New Break')).toBeInTheDocument();
        expect(screen.getByLabelText('Break Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Reason (optional)')).toBeInTheDocument();
      });
    });

    test('should validate break start form', async () => {
      render(
        <TestWrapper>
          <BreakManagement userId="test-user" />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Break');
      fireEvent.click(startButton);

      // Try to submit without selecting break type
      const submitButton = screen.getByText('Start Break');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Break type is required')).toBeInTheDocument();
      });
    });
  });

  // ===================================
  // GEOFENCING MANAGEMENT TESTS
  // ===================================
  describe('GeofencingManagement Component', () => {
    test('should render geofencing interface', async () => {
      render(
        <TestWrapper>
          <GeofencingManagement organizationId="test-org" />
        </TestWrapper>
      );

      expect(screen.getByText('Geofencing Management')).toBeInTheDocument();
      expect(screen.getByText('Create New Geofence')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
        expect(screen.getByText('Branch Office')).toBeInTheDocument();
      });
    });

    test('should show geofence creation form', async () => {
      render(
        <TestWrapper>
          <GeofencingManagement organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Geofence');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Geofence')).toBeInTheDocument();
        expect(screen.getByLabelText('Geofence Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
        expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
        expect(screen.getByLabelText('Radius (meters)')).toBeInTheDocument();
      });
    });

    test('should validate geofence coordinates', async () => {
      render(
        <TestWrapper>
          <GeofencingManagement organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Geofence');
      fireEvent.click(createButton);

      // Enter invalid coordinates
      const latInput = screen.getByLabelText('Latitude');
      const lngInput = screen.getByLabelText('Longitude');

      fireEvent.change(latInput, { target: { value: '999' } });
      fireEvent.change(lngInput, { target: { value: '999' } });

      const submitButton = screen.getByText('Create Geofence');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid latitude')).toBeInTheDocument();
        expect(screen.getByText('Invalid longitude')).toBeInTheDocument();
      });
    });

    test('should handle current location', async () => {
      // Mock geolocation
      const mockGeolocation = {
        getCurrentPosition: jest.fn(),
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      render(
        <TestWrapper>
          <GeofencingManagement organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Geofence');
      fireEvent.click(createButton);

      const currentLocationButton = screen.getByText('Use Current Location');
      fireEvent.click(currentLocationButton);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  // ===================================
  // INTEGRATION FLOW TESTS
  // ===================================
  describe('Integration Flow Tests', () => {
    test('should handle complete rule management flow', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      // 1. Create new rule
      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Attendance Rule')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText('Rule Type'), { target: { value: 'LATE_ARRIVAL' } });
      fireEvent.change(screen.getByLabelText('Threshold (minutes)'), { target: { value: '30' } });
      fireEvent.change(screen.getByLabelText('Penalty Amount'), { target: { value: '200' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New late arrival rule' } });

      const submitButton = screen.getByText('Create Rule');
      fireEvent.click(submitButton);

      // 2. Edit existing rule
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Attendance Rule')).toBeInTheDocument();
      });

      // 3. Delete rule
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
    });

    test('should handle complete break flow', async () => {
      render(
        <TestWrapper>
          <BreakManagement userId="test-user" />
        </TestWrapper>
      );

      // 1. Start break
      const startButton = screen.getByText('Start Break');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Start New Break')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText('Break Type'), { target: { value: 'LUNCH' } });
      fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: 'Lunch time' } });

      const submitButton = screen.getByText('Start Break');
      fireEvent.click(submitButton);

      // 2. Simulate break timer
      // This would normally show active break UI with timer
    });

    test('should handle error states gracefully', async () => {
      // Mock error state
      jest.doMock('../src/hooks/useAttendance', () => ({
        ...jest.requireActual('../src/hooks/useAttendance'),
        useAttendanceRules: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to fetch rules'),
          refetch: jest.fn(),
        }),
      }));

      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load attendance rules')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('should handle loading states', async () => {
      // Mock loading state
      jest.doMock('../src/hooks/useAttendance', () => ({
        ...jest.requireActual('../src/hooks/useAttendance'),
        useAttendanceRules: () => ({
          data: null,
          isLoading: true,
          error: null,
          refetch: jest.fn(),
        }),
      }));

      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ===================================
  // ACCESSIBILITY TESTS
  // ===================================
  describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <AttendanceDashboard userRole="admin" />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Rule');
      
      // Focus the button
      act(() => {
        createButton.focus();
      });

      expect(createButton).toHaveFocus();

      // Press Enter
      fireEvent.keyDown(createButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Create Attendance Rule')).toBeInTheDocument();
      });
    });

    test('should have proper form labels', async () => {
      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create New Rule');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Rule Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Threshold (minutes)')).toBeInTheDocument();
        expect(screen.getByLabelText('Penalty Amount')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
      });
    });
  });

  // ===================================
  // PERFORMANCE TESTS
  // ===================================
  describe('Performance Tests', () => {
    test('should render large lists efficiently', async () => {
      // Mock large dataset
      const largeRulesList = Array(100).fill(null).map((_, index) => ({
        id: `rule-${index}`,
        ruleType: 'LATE_ARRIVAL',
        threshold: 15 + index,
        penalty: 100 + index,
        description: `Rule ${index}`,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      }));

      jest.doMock('../src/hooks/useAttendance', () => ({
        ...jest.requireActual('../src/hooks/useAttendance'),
        useAttendanceRules: () => ({
          data: largeRulesList,
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        }),
      }));

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AttendanceRulesManager organizationId="test-org" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Rule 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});

// Custom test utilities
export const mockAttendanceData = {
  rules: mockRules,
  geofences: mockGeofences,
  analytics: mockAnalytics,
  alerts: mockAlerts,
};

export { TestWrapper };
