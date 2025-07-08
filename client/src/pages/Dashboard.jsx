import React from 'react';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
    const { user } = useAuthStore();

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-900">Welcome to the Dashboard</h1>
                <p className="mt-4 text-xl text-gray-600">
                    This is a protected area, only for logged-in users.
                </p>
                {user && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
                        <div className="mt-4 text-left">
                            <p className="text-lg"><span className="font-semibold">Name:</span> {user.name}</p>
                            <p className="text-lg"><span className="font-semibold">Email:</span> {user.email}</p>
                            <p className="text-lg"><span className="font-semibold">User ID:</span> {user._id}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
