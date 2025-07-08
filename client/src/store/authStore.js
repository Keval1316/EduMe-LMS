import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            
            // Action to set user and token on login/verification
            login: (userData, token) => set({
                user: userData,
                token: token,
                isAuthenticated: true,
            }),

            // Action to clear user and token on logout
            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
            }),

            // Action to update user info (e.g., after profile update)
            setUser: (userData) => set({ user: userData }),
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
        }
    )
);

export default useAuthStore;

