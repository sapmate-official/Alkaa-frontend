import { Permission, User } from '@/types/general';
import { atom, getDefaultStore } from 'jotai';
import {
  BillingDashboardData,
  DashboardData,
  SpecialEvent,
  useAppStore,
} from './useAppStore';
import { useAuthStore } from './useAuthStore';

export type { DashboardData, BillingDashboardData, SpecialEvent };

const defaultStore = getDefaultStore();

// Core reactive atoms backed by Jotai's default store
export const userIdAtom = atom<string | null>(useAuthStore.getState().userId);
export const userAtom = atom<User | null>(useAuthStore.getState().user);
export const permissionListAtom = atom<Permission[]>(useAuthStore.getState().permissions);
export const dashboardDataAtom = atom<DashboardData | null>(useAppStore.getState().dashboardData);
export const billingDashboardDataAtom = atom<BillingDashboardData | null>(useAppStore.getState().billingDashboardData);
export const specialEventsAtom = atom<SpecialEvent[]>(useAppStore.getState().specialEvents);
export const specialEventsLoadingAtom = atom<boolean>(useAppStore.getState().specialEventsLoading);

// 1. Sync Zustand store updates into Jotai atoms so useAtom(...) listeners reactively re-render
useAuthStore.subscribe((state) => {
  if (defaultStore.get(userIdAtom) !== state.userId) {
    defaultStore.set(userIdAtom, state.userId);
  }
  if (defaultStore.get(userAtom) !== state.user) {
    defaultStore.set(userAtom, state.user);
  }
  if (defaultStore.get(permissionListAtom) !== state.permissions) {
    defaultStore.set(permissionListAtom, state.permissions);
  }
});

useAppStore.subscribe((state) => {
  if (defaultStore.get(dashboardDataAtom) !== state.dashboardData) {
    defaultStore.set(dashboardDataAtom, state.dashboardData);
  }
  if (defaultStore.get(billingDashboardDataAtom) !== state.billingDashboardData) {
    defaultStore.set(billingDashboardDataAtom, state.billingDashboardData);
  }
  if (defaultStore.get(specialEventsAtom) !== state.specialEvents) {
    defaultStore.set(specialEventsAtom, state.specialEvents);
  }
  if (defaultStore.get(specialEventsLoadingAtom) !== state.specialEventsLoading) {
    defaultStore.set(specialEventsLoadingAtom, state.specialEventsLoading);
  }
});

// 2. Sync Jotai updates into Zustand store when legacy components call setter
defaultStore.sub(userIdAtom, () => {
  const current = defaultStore.get(userIdAtom);
  if (useAuthStore.getState().userId !== current) {
    useAuthStore.getState().setUserId(current);
  }
});

defaultStore.sub(userAtom, () => {
  const current = defaultStore.get(userAtom);
  if (useAuthStore.getState().user !== current) {
    useAuthStore.getState().setUser(current);
  }
});

defaultStore.sub(permissionListAtom, () => {
  const current = defaultStore.get(permissionListAtom);
  if (useAuthStore.getState().permissions !== current) {
    useAuthStore.getState().setPermissions(current);
  }
});

defaultStore.sub(dashboardDataAtom, () => {
  const current = defaultStore.get(dashboardDataAtom);
  if (useAppStore.getState().dashboardData !== current) {
    useAppStore.getState().setDashboardData(current);
  }
});

defaultStore.sub(billingDashboardDataAtom, () => {
  const current = defaultStore.get(billingDashboardDataAtom);
  if (useAppStore.getState().billingDashboardData !== current) {
    useAppStore.getState().setBillingDashboardData(current);
  }
});

defaultStore.sub(specialEventsAtom, () => {
  const current = defaultStore.get(specialEventsAtom);
  if (useAppStore.getState().specialEvents !== current) {
    useAppStore.getState().setSpecialEvents(current);
  }
});

defaultStore.sub(specialEventsLoadingAtom, () => {
  const current = defaultStore.get(specialEventsLoadingAtom);
  if (useAppStore.getState().specialEventsLoading !== current) {
    useAppStore.getState().setSpecialEventsLoading(current);
  }
});
