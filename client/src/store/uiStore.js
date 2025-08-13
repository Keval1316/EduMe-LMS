import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: false,
  currentPage: 'dashboard',
  notifications: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      ...notification
    }]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] })
}));

export default useUIStore;