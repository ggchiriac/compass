import { create } from 'zustand';

import { AuthState } from '../types';

const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  isAuthenticated: null,
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  checkAuthentication: async () => {
    try {
      console.log('Checking authentication...');
      const response = await fetch(`${process.env.BACKEND}/cas?action=authenticate`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Error checking authentication:', response.status, response.statusText);
        set({ isAuthenticated: false, user: undefined });
        return;
      }

      const data = await response.json();
      console.log('Authentication response:', data);

      set({
        isAuthenticated: data.authenticated,
        user: data.authenticated ? data.user : undefined,
      });
      console.log('Authentication status:', data.authenticated);
    } catch (error) {
      console.error('Error checking authentication:', error);
      set({ isAuthenticated: false, user: undefined });
    }
  },
  login: () => {
    window.location.href = `${process.env.BACKEND}/cas?action=login`;
  },
  logout: () => {
    window.location.href = `${process.env.BACKEND}/cas?action=logout`;
  },
}));

export default useAuthStore;
