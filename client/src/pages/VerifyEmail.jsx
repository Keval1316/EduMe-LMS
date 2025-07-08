import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import useAuthStore from '../store/authStore';
import AuthLayout from '../components/AuthLayout';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    
    // Get email from navigation state or prompt user if not available
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            // If email is not in state, redirect to signup, as we can't verify without it.
            navigate('/signup');
        }
    }, [email, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!code || code.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.post('/verify-email', { email, verificationCode: code });
            setSuccess(response.data.message);
            login(response.data.user, response.data.token);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000); // Redirect after 2 seconds
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during verification.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Verify Your Email">
            <p className="text-center text-sm text-gray-600 mb-4">
                A 6-digit verification code has been sent to <strong>{email}</strong>.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">Verification Code</label>
                    <div className="mt-1">
                        <input id="code" name="code" type="text" maxLength="6" required value={code} onChange={(e) => setCode(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
                <div>
                    <button type="submit" disabled={loading || success} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default VerifyEmail;

