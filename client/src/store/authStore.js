import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
          loading: false
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          loading: false
        });
        localStorage.removeItem('auth-storage');
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },

      setLoading: (loading) => {
        set({ loading });
      },

      updateInterests: (interests) => {
        set((state) => ({
          user: { ...state.user, interests }
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;