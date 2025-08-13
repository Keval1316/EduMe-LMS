import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';
import { Plus, Edit2, Camera, Lock, Minus, Search } from 'lucide-react';

const Profile = () => {
  const { user, updateUser, updateInterests } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  

  const interests = useMemo(() => user?.interests || [], [user]);
  const [interestQuery, setInterestQuery] = useState('');

  const suggestions = useMemo(
    () => [
      'Web Development',
      'Data Science',
      'AI & Machine Learning',
      'Mobile Development',
      'DevOps',
      'Cybersecurity',
      'UI/UX Design',
      'Business',
      'Marketing',
      'Cloud Computing',
      'Blockchain',
      'Game Development',
    ],
    []
  );

  const filteredSuggestions = useMemo(() => {
    const q = interestQuery.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [suggestions, interestQuery]);

  useEffect(() => {
    // keep localStorage in sync on mount
    if (interests && interests.length > 0) {
      localStorage.setItem('userInterests', JSON.stringify(interests));
    }
  }, []);

  

  const onAddInterest = async (interest) => {
    if (interests.includes(interest)) return; // already added
    const next = [...interests, interest];
    try {
      // optimistic update
      updateInterests(next);
      localStorage.setItem('userInterests', JSON.stringify(next));
      await authApi.updateInterests(next);
      toast.success('Interest added');
    } catch (e) {
      toast.error('Failed to add interest');
      console.error(e);
    }
  };

  const onAddFromQuery = async () => {
    const q = interestQuery.trim();
    if (!q) return;
    await onAddInterest(q);
    setInterestQuery('');
  };

  const onRemoveInterest = async (interest) => {
    if (!interests.includes(interest)) return;
    const next = interests.filter((i) => i !== interest);
    try {
      // optimistic update
      updateInterests(next);
      localStorage.setItem('userInterests', JSON.stringify(next));
      await authApi.updateInterests(next);
      toast.success('Interest removed');
    } catch (e) {
      toast.error('Failed to remove interest');
      console.error(e);
    }
  };

  const onUploadAvatar = async (file) => {
    if (!file) return;
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image too large (max 2MB)');
      return;
    }
    try {
      setUploading(true);
      // Convert to base64 (data URL)
      const toBase64 = (f) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });
      const dataUrl = await toBase64(file);
      const { data } = await authApi.updateProfile({ avatar: dataUrl });
      updateUser(data.user);
      toast.success('Profile picture updated');
    } catch (e) {
      toast.error('Failed to update avatar');
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill current and new password');
      return;
    }
    try {
      setSavingPwd(true);
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setShowPassword(false);
      toast.success('Password changed');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const getAvatarSrc = () =>
    user?.avatar ||
    'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(user?.fullName || 'User');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information and learning preferences</p>
      </div>

      {/* Top Card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={getAvatarSrc()}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
              <label className="absolute bottom-0 right-0 bg-white border rounded-full p-2 shadow cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUploadAvatar(e.target.files?.[0])}
                  disabled={uploading}
                />
                <Camera className="w-4 h-4 text-gray-700" />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.fullName}</h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <p className="text-gray-600 text-sm">Role: {user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Link>
            <button
              onClick={() => setShowPassword((s) => !s)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              <Lock className="w-4 h-4" /> {showPassword ? 'Close' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Collapsible Change Password */}
        {showPassword && (
          <form onSubmit={onChangePassword} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="password"
              placeholder="Current Password"
              className="border rounded-lg px-3 py-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              className="border rounded-lg px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={savingPwd}
              className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
            >
              {savingPwd ? 'Saving...' : 'Save Password'}
            </button>
          </form>
        )}
      </div>

      {/* Interests */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select your Interest</h3>
        </div>
        {/* Search and quick add */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={interestQuery}
              onChange={(e) => setInterestQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddFromQuery(); } }}
              placeholder="Search interests (press Enter to add)"
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <button
            type="button"
            onClick={onAddFromQuery}
            disabled={!interestQuery.trim() || interests.includes(interestQuery.trim())}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
            title="Add typed interest"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {filteredSuggestions.map((s) => {
            const added = interests.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onAddInterest(s)}
                disabled={added}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition ${
                  added
                    ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={added ? 'Added' : 'Add interest'}
              >
                {!added && <Plus className="w-4 h-4" />}
                <span className="font-medium">{s}</span>
              </button>
            );
          })}
        </div>

        {/* Current interests */}
        <div className="mt-5">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your interests</h4>
          <div className="flex flex-wrap gap-2">
            {interests.length === 0 ? (
              <span className="text-gray-500 text-sm">No interests selected yet</span>
            ) : (
              interests.map((i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  {i}
                  <button
                    type="button"
                    aria-label={`Remove ${i}`}
                    className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600"
                    onClick={() => onRemoveInterest(i)}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Profile;
