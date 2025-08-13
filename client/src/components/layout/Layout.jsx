import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';
import AIAssistantWidget from '../ai/AIAssistantWidget';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Global header at top */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Fixed sidebar under header (handled inside Sidebar) */}
      {isAuthenticated && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      )}

      {/* Main content is the only scrollable area, placed to the right of sidebar on lg+ */}
      <main
        className={`${isAuthenticated ? 'lg:ml-64' : ''} h-[calc(100vh-4rem)] overflow-y-auto`}
        role="main"
        aria-live="polite"
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 motion-safe:animate-fade-in">
          <Outlet />
        </div>
      </main>
      {/* Floating AI Assistant */}
      <AIAssistantWidget />
    </div>
  );
};

export default Layout;
