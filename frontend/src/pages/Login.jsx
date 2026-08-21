import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { Globe, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@pms.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate('/dashboard', { replace: true });
  };

  const handleQuickDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Admin@123456');
    setLoading(true);
    await login(demoEmail, 'Admin@123456');
    setLoading(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-slate-100 z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/30">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">LingoTech <span className="text-brand-600 font-black">PMS</span></h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Enterprise Translation & Localization Operations Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pms.com"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full py-2.5 mt-2 font-bold text-sm" icon={ArrowRight}>
            Sign In to PMS
          </Button>
        </form>

        {/* Quick Demo Accounts Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center mb-3">Quick Demo Accounts (1-Click Login)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin@pms.com')}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg border border-slate-200/80 transition-colors text-left flex items-center gap-1.5"
            >
              <span>👑 Super Admin</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('pm@pms.com')}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg border border-slate-200/80 transition-colors text-left flex items-center gap-1.5"
            >
              <span>📁 Project Manager</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('accounts@pms.com')}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg border border-slate-200/80 transition-colors text-left flex items-center gap-1.5"
            >
              <span>💳 Accounts</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('translator@pms.com')}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg border border-slate-200/80 transition-colors text-left flex items-center gap-1.5"
            >
              <span>🌐 Translator</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
