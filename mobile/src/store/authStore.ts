import { create } from 'zustand';
import { UserProfile } from '@/types';

interface AuthState {
  profile: UserProfile | null;
  token: string | null;
  setProfile: (profile: UserProfile) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  updateTheme: (theme: 'light' | 'dark') => void;
}

const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  token: null,
  setProfile: (profile) => set({ profile }),
  setToken: (token) => set({ token }),
  clearAuth: () => set({ profile: null, token: null }),
  updateTheme: (theme) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, theme } : null,
    })),
}));

export default useAuthStore;
