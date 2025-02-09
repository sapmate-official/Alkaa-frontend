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

export const userIdAtom = atom<number | null>(null)
export const userAtom = atom<User | null>(null)
export const permissionListAtom = atom<Permission[]>([])
export const dashboardDataAtom = atom<DashboardData | null>(null)