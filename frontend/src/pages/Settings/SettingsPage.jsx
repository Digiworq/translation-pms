import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Building2, Save, KeyRound, Check } from 'lucide-react';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    defaultTaxPercent: '18',
    defaultCurrencySymbol: '₹',
    invoiceNotesTemplate: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (e) {}
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setSuccessMsg('System settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await api.post('/auth/change-password', passwordForm);
      if (res.data.success) {
        alert('Password updated successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '' });
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Password update failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Preferences & Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage company branding, default tax parameters, and account security</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Company Branding & Invoice Settings */}
      <Card title="Company Profile & Invoice Settings">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Phone</label>
              <input
                type="text"
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default GST / Tax Rate (%)</label>
              <input
                type="number"
                value={settings.defaultTaxPercent}
                onChange={(e) => setSettings({ ...settings, defaultTaxPercent: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.defaultCurrencySymbol}
                onChange={(e) => setSettings({ ...settings, defaultCurrencySymbol: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={savingSettings} icon={Save}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Settings */}
      <Card title="Account Security">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={savingPassword} icon={KeyRound}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
