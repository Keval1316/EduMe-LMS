import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../api/axiosConfig';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await apiClient.post('/logout');
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still log out on the client even if server call fails
            logout();
            navigate('/login');
        }
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">LMS</Link>
                    </div>
                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <>
                                <span className="text-gray-700 mr-4">Welcome, {user?.name}!</span>
                                <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                                <button onClick={handleLogout} className="ml-4 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                                <Link to="/signup" className="ml-4 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
