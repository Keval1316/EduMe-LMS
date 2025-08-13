import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authApi } from '../api/authApi';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await authApi.updateProfile({ fullName, avatar });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill current and new password');
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
    } catch (e) {
      // best-effort
      logout();
      navigate('/login');
    }
  };

  if (!user) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and account security</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <form onSubmit={onUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Avatar URL" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={profileLoading} disabled={profileLoading}>Save Profile</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        <form onSubmit={onChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={passwordLoading} disabled={passwordLoading}>Change Password</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
        <Button variant="danger" onClick={onLogout}>Logout</Button>
      </div>
    </div>
  );
};

export default Settings;
