import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        set({ token, isAuthenticated: !!token });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get('/users/profile');
            set({
              user: response.data.data,
              token,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ isAuthenticated: false });
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: 'auth-store' }
  )
);

// Check auth on load
useAuthStore.getState().checkAuth();

export default useAuthStore;
