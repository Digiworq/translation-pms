import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StatCard, Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Clock, AlertTriangle, Building2, Users,
  DollarSign, TrendingUp, ArrowUpRight, Plus, Calendar, CreditCard
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isVendor  = user?.role === 'VENDOR';

  const [stats,              setStats]              = useState(null);
  const [recentProjects,     setRecentProjects]     = useState([]);
  const [upcomingDeadlines,  setUpcomingDeadlines]  = useState([]);
  const [projectsByStatus,   setProjectsByStatus]   = useState([]);
  const [projectsByType,     setProjectsByType]     = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState('');

  // ── Fetch everything from the real MySQL API ──────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard', {
        params: { _t: Date.now() }   // prevent browser caching
      });

      if (res.data?.success) {
        setStats(res.data.stats || {});
        setProjectsByStatus(res.data.charts?.projectsByStatus || []);
        setProjectsByType(res.data.charts?.projectsByType     || []);
        setRecentProjects(res.data.recentProjects             || []);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = (res.data.upcomingDeadlines || []).filter(p => {
          if (!p.deadline) return false;
          if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(p.status)) return false;
          return new Date(p.deadline) >= now;
        });
        setUpcomingDeadlines(upcoming);
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (e) {
      setError('Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and whenever the window regains focus (e.g. after adding a vendor)
  useEffect(() => {
    fetchDashboard();
    window.addEventListener('focus', fetchDashboard);
    return () => window.removeEventListener('focus', fetchDashboard);
  }, [fetchDashboard]);

  const s = stats || {};

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening across your translation operations today.
          </p>
        </div>
        {!isVendor && (
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/projects?create=true')} icon={Plus}>
              + New Project
            </Button>
            <Button onClick={() => navigate('/invoices')} variant="secondary" icon={Plus}>
              + Create Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboard} className="text-xs font-semibold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading dashboard...</div>
      ) : (
        <>
          {/* Primary KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="TOTAL PROJECTS"
              value={s.totalProjects ?? 0}
              subtitle={`${s.activeProjects ?? 0} Active, ${s.completedProjects ?? 0} Completed`}
              icon={FolderKanban} color="blue"
            />
            <StatCard
              title="ACTIVE OPERATIONS"
              value={s.activeProjects ?? 0}
              subtitle={`${s.pendingProjects ?? 0} New, ${s.overdueProjects ?? 0} Overdue`}
              icon={Clock} color="amber"
            />
            {!isVendor ? (
              <>
                <StatCard
                  title="TOTAL BILLED"
                  value={`₹${(s.revenue ?? 0).toLocaleString('en-IN')}`}
                  subtitle={`Outstanding: ₹${(s.outstandingClientPayments ?? 0).toLocaleString('en-IN')}`}
                  icon={DollarSign} color="emerald"
                />
                <StatCard
                  title="GROSS PROFIT"
                  value={`₹${(s.profit ?? 0).toLocaleString('en-IN')}`}
                  subtitle={`Vendor Expenses: ₹${(s.vendorExpenses ?? 0).toLocaleString('en-IN')}`}
                  icon={TrendingUp} color="purple"
                />
              </>
            ) : (
              <>
                <StatCard title="COMPLETED"
                  value={s.completedProjects ?? 0}
                  subtitle="Completed assignments"
                  icon={DollarSign} color="emerald"
                />
                <StatCard title="OVERDUE"
                  value={s.overdueProjects ?? 0}
                  subtitle="Past due date"
                  icon={AlertTriangle} color="rose"
                />
              </>
            )}
          </div>

          {/* Secondary row — admin/PM/accounts only */}
          {!isVendor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                title="TOTAL CLIENTS"
                value={s.totalClients ?? 0}
                subtitle="Active client accounts"
                icon={Building2} color="indigo"
              />
              <StatCard
                title="ACTIVE VENDORS"
                value={s.totalVendors ?? 0}
                subtitle="Translators & reviewers"
                icon={Users} color="blue"
              />
              <StatCard
                title="PENDING VENDOR PAYABLES"
                value={`₹${(s.pendingVendorPayments ?? 0).toLocaleString('en-IN')}`}
                subtitle="Approved vendor invoices pending payout"
                icon={CreditCard} color="rose"
              />
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Projects by Status" subtitle="Breakdown of project statuses">
              <div className="h-64 w-full">
                {projectsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatus}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={85}
                        paddingAngle={4} dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {projectsByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No data yet.</div>
                )}
              </div>
            </Card>

            <Card title="Projects by Service Type" subtitle="Translation, Proofreading, DTP, etc.">
              <div className="h-64 w-full">
                {projectsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByType}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No data yet.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Projects + Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <Card
                title="Recent Projects"
                subtitle="Latest active workflows"
                action={
                  <Link to="/projects" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                    View all <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                {recentProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No projects yet. <Link to="/projects" className="text-brand-600 underline">Create one.</Link></p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Project Name</th>
                          <th className="py-2.5 px-3">Client</th>
                          <th className="py-2.5 px-3">Language</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentProjects.slice(0, 6).map(proj => (
                          <tr key={proj.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-semibold text-brand-600">
                              <Link to={`/projects/${proj.id}`}>{proj.projectCode}</Link>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900 max-w-[180px] truncate">
                              {proj.projectName}
                            </td>
                            <td className="py-3 px-3">
                              {proj.client?.companyName || proj.clientName || '—'}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {proj.sourceLang} → {proj.targetLang}
                            </td>
                            <td className="py-3 px-3">
                              <Badge status={proj.status || 'NEW'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            <div>
              <Card title="Upcoming Deadlines" subtitle="Active projects due soon">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No upcoming deadlines.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map(proj => {
                      const deadline = new Date(proj.deadline);
                      const today    = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysLeft <= 3;
                      return (
                        <div key={proj.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/projects/${proj.id}`}
                              className="font-semibold text-xs text-slate-900 hover:text-brand-600 block truncate">
                              {proj.projectCode}: {proj.projectName}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {proj.client?.companyName || proj.clientName || '—'}
                            </p>
                            <p className="text-[11px] font-semibold mt-0.5 text-slate-600">
                              {daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                              isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {deadline.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
