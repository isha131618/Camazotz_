import React, { useEffect, useState } from 'react';
import { Moon, Sun, User, Mail, Shield, Save, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/axios';

const Settings = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [email, setEmail] = useState(user.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeReason, setRemoveReason] = useState('');
  const [removeDetails, setRemoveDetails] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme !== 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveEmail = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await API.put('/auth/email', { email: email.trim() });
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setUser(updatedUser);
      setEmail(updatedUser.email || '');
      toast.success('Email updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAccount = async (event) => {
    event.preventDefault();
    if (!removeReason) {
      toast.error('Please select a reason');
      return;
    }
    if (!confirmRemove) {
      toast.error('Please confirm account removal');
      return;
    }
    const confirmed = window.confirm('This will sign you out and clear local account data. Continue?');
    if (!confirmed) {
      return;
    }
    setIsRemoving(true);
    try {
      await API.delete('/auth/me', { data: { reason: removeReason, details: removeDetails } });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Account removed successfully');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove account');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account and appearance preferences.</p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{user.name || 'Doctor'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user.email || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900">{user.role || 'doctor'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account ID</label>
              <p className="mt-1 text-sm text-gray-900">{user.id || 'N/A'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Edit Email</h2>
          </div>
          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="name@example.com"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Email'}
              </button>
              <p className="text-xs text-gray-500">Updates local account info on this device.</p>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Remove Account</h2>
          </div>
          <form onSubmit={handleRemoveAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Why do you want to remove the account?</label>
              <select
                value={removeReason}
                onChange={(event) => setRemoveReason(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="privacy">Privacy concerns</option>
                <option value="not-needed">No longer needed</option>
                <option value="switching">Switching accounts</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tell us more (optional)</label>
              <textarea
                rows={3}
                value={removeDetails}
                onChange={(event) => setRemoveDetails(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Help us improve by sharing details..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={confirmRemove}
                onChange={(event) => setConfirmRemove(event.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              I understand this will sign me out and clear local account data.
            </label>
            <button
              type="submit"
              disabled={isRemoving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              {isRemoving ? 'Removing...' : 'Remove Account'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <p className="text-sm text-gray-600">
            For password resets or full account deletion, contact your system administrator.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Settings;
