import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  recentActivities: Array<{
    title: string;
    timestamp: string;
  }>;
  attendanceStats: Array<{
    date: string;
    present: number;
    absent: number;
  }>;
}

export interface BillingDashboardData {
  organization: {
    name: string;
    subscriptionPlan: string;
    activeUsers: number;
    subscriptionStart: string;
    subscriptionEnd: string | null;
    daysRemaining: number | null;
    subscriptionStatus: string;
  };
  billing: {
    latestBill: Record<string, unknown> | null;
    totalBilledThisYear: number;
    totalUnpaid: number;
    unpaidCount: number;
  };
  billStatus: {
    unpaid: number;
    paid: number;
    overdue: number;
    total: number;
  };
  recentBills: Record<string, unknown>[];
}

export interface SpecialEvent {
  type: 'BIRTHDAY' | 'BILL' | 'LEAVE_REQUEST' | 'MONTH_END_VERIFICATION' | 'INCOMPLETE_ATTENDANCE';
  title: string;
  description: string;
  date: Date | string;
  priority: 'high' | 'medium' | 'low';
  entity: Record<string, unknown>;
}

interface AppState {
  dashboardData: DashboardData | null;
  billingDashboardData: BillingDashboardData | null;
  specialEvents: SpecialEvent[];
  specialEventsLoading: boolean;
  setDashboardData: (data: DashboardData | null) => void;
  setBillingDashboardData: (data: BillingDashboardData | null) => void;
  setSpecialEvents: (events: SpecialEvent[]) => void;
  setSpecialEventsLoading: (loading: boolean) => void;
  resetAppStore: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      dashboardData: null,
      billingDashboardData: null,
      specialEvents: [],
      specialEventsLoading: false,
      setDashboardData: (dashboardData) => set({ dashboardData }),
      setBillingDashboardData: (billingDashboardData) => set({ billingDashboardData }),
      setSpecialEvents: (specialEvents) => set({ specialEvents }),
      setSpecialEventsLoading: (specialEventsLoading) => set({ specialEventsLoading }),
      resetAppStore: () =>
        set({
          dashboardData: null,
          billingDashboardData: null,
          specialEvents: [],
          specialEventsLoading: false,
        }),
    }),
    { name: 'AppStore' }
  )
);
