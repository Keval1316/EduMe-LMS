import React from 'react';
import { NavLink } from 'react-router-dom';

import {
  BarChart3,
  BookOpen,
  Users,
  MessageSquare,
  Award,
  Plus,
  Home,
  GraduationCap,
  Settings,
  Info,
  Mail
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuthStore();

  const instructorLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Create Course', href: '/instructor/create-course', icon: Plus },
    { name: 'Students', href: '/instructor/students', icon: Users },
    { name: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail }
  ];

  const studentLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Browse Courses', href: '/courses', icon: GraduationCap },
    { name: 'Certificates', href: '/student/certificates', icon: Award },
    { name: 'Discussion', href: '/student/discussions', icon: MessageSquare },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail }
  ];

  const links = user?.role === 'Instructor' ? instructorLinks : studentLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-gray-900 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 ${
                      isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                  end
                >
                  <Icon size={20} className="mr-3" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-700">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover-lift ${
                  isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Settings size={20} className="mr-3" />
              Settings
            </NavLink>
          </div>
        </div>
      </div>

    </>
  );
};

export default Sidebar;