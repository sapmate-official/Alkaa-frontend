import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Permission, User } from '@/types/general';

interface AuthState {
  user: User | null;
  userId: string | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setUserId: (id: string | null) => void;
  setPermissions: (permissions: Permission[]) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      userId: null,
      permissions: [],
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          userId: user?.id ?? null,
          isAuthenticated: Boolean(user),
        }),
      setUserId: (userId) => set({ userId }),
      setPermissions: (permissions) => set({ permissions }),
      clearAuth: () =>
        set({
          user: null,
          userId: null,
          permissions: [],
          isAuthenticated: false,
        }),
      logout: () =>
        set({
          user: null,
          userId: null,
          permissions: [],
          isAuthenticated: false,
        }),
    }),
    { name: 'AuthStore' }
  )
);

// Selector hooks for ergonomic access
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const usePermissions = () => useAuthStore((state) => state.permissions);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserId = () => useAuthStore((state) => state.userId);

