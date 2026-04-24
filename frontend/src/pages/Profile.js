import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';

function Profile() {
  const { user, updateProfile, changePassword, checkPasswordStrength } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password form
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);

  const validateProfile = () => {
    const errors = {};
    if (!profileData.name.trim()) errors.name = 'Name is required';
    if (profileData.name.length < 2) errors.name = 'Name must be at least 2 characters';
    if (!profileData.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errors.email = 'Invalid email';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Must be at least 8 characters';
    if (!/[A-Z]/.test(passwordData.newPassword)) errors.newPassword = 'Must contain uppercase letter';
    if (!/[a-z]/.test(passwordData.newPassword)) errors.newPassword = 'Must contain lowercase letter';
    if (!/[0-9]/.test(passwordData.newPassword)) errors.newPassword = 'Must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) errors.newPassword = 'Must contain special character';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setProfileLoading(true);
    try {
      await updateProfile(profileData);
      showToast.success('Profile updated successfully');
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setPasswordLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      showToast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(null);
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    const { value } = e.target;
    setPasswordData(prev => ({ ...prev, newPassword: value }));
    if (value.length >= 4) {
      try {
        const result = await checkPasswordStrength(value);
        setPasswordStrength(result);
      } catch (err) { /* ignore */ }
    } else {
      setPasswordStrength(null);
    }
  };

  const strengthColors = {
    very_weak: 'bg-red-500', weak: 'bg-orange-500', fair: 'bg-yellow-500',
    good: 'bg-blue-500', strong: 'bg-green-500', very_strong: 'bg-green-600', excellent: 'bg-green-700'
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Change Password' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                user?.emailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
              </span>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${profileErrors.name ? 'border-red-300' : 'border-gray-300'}`} />
              {profileErrors.name && <p className="mt-1 text-sm text-red-600">{profileErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${profileErrors.email ? 'border-red-300' : 'border-gray-300'}`} />
              {profileErrors.email && <p className="mt-1 text-sm text-red-600">{profileErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input type="text" value={user?.role || 'user'} disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={profileLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {profileLoading ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'}`} />
              {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'}`} />
              {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColors[passwordStrength.strength]}`}
                        style={{ width: `${(passwordStrength.score / passwordStrength.maxScore) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 capitalize">{passwordStrength.strength.replace('_', ' ')}</span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {passwordStrength.feedback.map((fb, i) => <li key={i}>{fb}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`} />
              {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>}
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={passwordLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {passwordLoading ? <><LoadingSpinner size="sm" /> Changing...</> : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates about your meal plans</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Daily Nutrition Reminders</p>
                <p className="text-sm text-gray-500">Get reminders to log your meals</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Default Calorie Target</p>
                <p className="text-sm text-gray-500">Your daily calorie goal</p>
              </div>
              <input type="number" defaultValue="2000" className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Measurement System</p>
                <p className="text-sm text-gray-500">Choose metric or imperial</p>
              </div>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option>Metric</option>
                <option>Imperial</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" onClick={() => showToast.success('Settings saved')}>
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
