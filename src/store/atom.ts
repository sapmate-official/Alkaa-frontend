import { Permission, User } from '@/types/general';
import { atom } from 'jotai';
import {
  BillingDashboardData,
  DashboardData,
  SpecialEvent,
  useAppStore,
} from './useAppStore';
import { useAuthStore } from './useAuthStore';

export type { DashboardData, BillingDashboardData, SpecialEvent };

// Atoms synchronized with Zustand stores to ensure zero regressions across legacy consumers
export const userIdAtom = atom<string | null, [string | null], void>(
  () => useAuthStore.getState().userId,
  (_get, _set, newUserId: string | null) => {
    useAuthStore.getState().setUserId(newUserId);
  }
);

export const userAtom = atom<User | null, [User | null], void>(
  () => useAuthStore.getState().user,
  (_get, _set, newUser: User | null) => {
    useAuthStore.getState().setUser(newUser);
  }
);

export const permissionListAtom = atom<Permission[], [Permission[]], void>(
  () => useAuthStore.getState().permissions,
  (_get, _set, newPerms: Permission[]) => {
    useAuthStore.getState().setPermissions(newPerms);
  }
);

export const dashboardDataAtom = atom<
  DashboardData | null,
  [DashboardData | null],
  void
>(
  () => useAppStore.getState().dashboardData,
  (_get, _set, newData: DashboardData | null) => {
    useAppStore.getState().setDashboardData(newData);
  }
);

export const billingDashboardDataAtom = atom<
  BillingDashboardData | null,
  [BillingDashboardData | null],
  void
>(
  () => useAppStore.getState().billingDashboardData,
  (_get, _set, newData: BillingDashboardData | null) => {
    useAppStore.getState().setBillingDashboardData(newData);
  }
);

export const specialEventsAtom = atom<
  SpecialEvent[],
  [SpecialEvent[]],
  void
>(
  () => useAppStore.getState().specialEvents,
  (_get, _set, newEvents: SpecialEvent[]) => {
    useAppStore.getState().setSpecialEvents(newEvents);
  }
);

export const specialEventsLoadingAtom = atom<
  boolean,
  [boolean],
  void
>(
  () => useAppStore.getState().specialEventsLoading,
  (_get, _set, isLoading: boolean) => {
    useAppStore.getState().setSpecialEventsLoading(isLoading);
  }
);
