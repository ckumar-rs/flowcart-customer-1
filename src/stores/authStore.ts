import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, AuthResponse } from '@/services/authService';

interface AuthStore {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: AuthResponse['user']) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
        set({ loading: true });
        try {
          const response = await authService.register({ email, password, firstName, lastName, phone });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        set({
          user,
          isAuthenticated,
        });
      },

      setLoading: (loading: boolean) => set({ loading }),
      setUser: (user: AuthResponse['user']) => set({ user }),
      setToken: (token: string) => set({ token, isAuthenticated: true }),
    }),
    {
      name: 'flowcart-auth-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

