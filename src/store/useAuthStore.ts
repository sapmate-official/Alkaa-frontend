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
    }),
    { name: 'AuthStore' }
  )
);
