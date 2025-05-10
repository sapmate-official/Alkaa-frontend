import { Permission, User } from '@/interface/general'
import {atom} from 'jotai'

interface DashboardData {
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

interface BillingDashboardData {
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
    latestBill: any;
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
  recentBills: any[];
}

export const userIdAtom = atom<number | null>(null)
export const userAtom = atom<User | null>(null)
export const permissionListAtom = atom<Permission[]>([])
export const dashboardDataAtom = atom<DashboardData | null>(null)
export const billingDashboardDataAtom = atom<BillingDashboardData | null>(null)