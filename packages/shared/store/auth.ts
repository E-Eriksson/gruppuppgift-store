import { create } from 'zustand';

type AuthState = {
  jwt: string | null;
  user: any | null;
  setAuth: (jwt: string, user: any) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  jwt: null,
  user: null,
  setAuth: (jwt, user) => set({ jwt, user }),
  logout: () => set({ jwt: null, user: null }),
}));