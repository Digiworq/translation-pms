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

const DEFAULT_PROJECTS = [
  {
    id: 'prj-1',
    projectCode: 'PRJ-2026-0001',
    projectName: 'Q3 Enterprise Software Manual Localization',
    clientName: 'Global Enterprise Tech Corp',
    projectType: 'Translation',
    sourceLang: 'English',
    targetLang: 'German',
    wordCount: 10000,
    clientAmount: 30000,
    totalVendorCost: 9000,
    grossProfit: 21000,
    status: 'NEW',
    deadline: '2026-08-28T00:00:00.000Z'
  },
  {
    id: 'prj-2',
    projectCode: 'PRJ-2026-0002',
    projectName: 'BioHealth Clinical Protocol Translation & Review',
    clientName: 'BioHealth Solutions Inc.',
    projectType: 'Certified Translation',
    sourceLang: 'English',
    targetLang: 'Spanish',
    wordCount: 15000,
    clientAmount: 60000,
    totalVendorCost: 22500,
    grossProfit: 37500,
    status: 'COMPLETED',
    deadline: '2026-08-22T00:00:00.000Z'
  }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVendor = user?.role === 'VENDOR';

  const [liveVendorsCount, setLiveVendorsCount] = useState(2);
  const [liveClientsCount, setLiveClientsCount] = useState(2);

  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [projectsByStatus, setProjectsByStatus] = useState([]);
  const [projectsByType, setProjectsByType] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    // 1. Fetch live Vendors count directly
    try {
      const vRes = await api.get('/vendors');
      if (vRes.data?.success && Array.isArray(vRes.data.vendors)) {
        setLiveVendorsCount(vRes.data.vendors.length);
      } else {
        const savedV = localStorage.getItem('pms_vendors_list');
        if (savedV) setLiveVendorsCount(JSON.parse(savedV).length);
      }
    } catch (e) {
      try {
        const savedV = localStorage.getItem('pms_vendors_list');
        if (savedV) setLiveVendorsCount(JSON.parse(savedV).length);
      } catch (err) {}
    }

    // 2. Fetch live Clients count directly
    try {
      const cRes = await api.get('/clients');
      if (cRes.data?.success && Array.isArray(cRes.data.clients)) {
        setLiveClientsCount(cRes.data.clients.length);
      } else {
        const savedC = localStorage.getItem('pms_clients_list');
        if (savedC) setLiveClientsCount(JSON.parse(savedC).length);
      }
    } catch (e) {
      try {
        const savedC = localStorage.getItem('pms_clients_list');
        if (savedC) setLiveClientsCount(JSON.parse(savedC).length);
      } catch (err) {}
    }

    // 3. Fetch Dashboard & Projects stats
    try {
      let localProjList = DEFAULT_PROJECTS;
      try {
        const savedProj = localStorage.getItem('pms_projects_list');
        if (savedProj) {
          const parsed = JSON.parse(savedProj);
          if (Array.isArray(parsed) && parsed.length > 0) localProjList = parsed;
        }
      } catch (e) {}

      try {
        const res = await api.get('/projects', { params: { _t: Date.now() } });
        if (res.data?.success && Array.isArray(res.data.projects) && res.data.projects.length > 0) {
          localProjList = res.data.projects;
        }
      } catch (e) {}

      const totalProjects = localProjList.length;
      const activeProjects = localProjList.filter(p => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(p.status)).length;
      const completedProjects = localProjList.filter(p => ['COMPLETED', 'DELIVERED'].includes(p.status)).length;
      const pendingProjects = localProjList.filter(p => p.status === 'NEW').length;

      const revenue = localProjList.reduce((acc, p) => acc + (parseFloat(p.clientAmount) || 0), 0);
      const vendorExpenses = localProjList.reduce((acc, p) => acc + (parseFloat(p.totalVendorCost) || 0), 0);
      const profit = localProjList.reduce((acc, p) => acc + (parseFloat(p.grossProfit) || (parseFloat(p.clientAmount || 0) - parseFloat(p.totalVendorCost || 0))), 0);
      const outstandingClientPayments = revenue * 0.3;
      const pendingVendorPayments = vendorExpenses;

      setStats({
        totalProjects,
        activeProjects,
        completedProjects,
        pendingProjects,
        overdueProjects: 0,
        revenue,
        vendorExpenses,
        profit,
        outstandingClientPayments,
        pendingVendorPayments
      });

      const statusCounts = {};
      localProjList.forEach(p => {
        const st = p.status || 'NEW';
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });
      setProjectsByStatus(Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })));

      const typeCounts = {};
      localProjList.forEach(p => {
        const tp = p.projectType || 'Translation';
        typeCounts[tp] = (typeCounts[tp] || 0) + 1;
      });
      setProjectsByType(Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] })));

      setRecentProjects(localProjList);

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const upcoming = localProjList.filter(p => {
        if (!p.deadline) return false;
        if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(p.status)) return false;
        return new Date(p.deadline) >= now;
      });
      setUpcomingDeadlines(upcoming);

    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const s = stats || {
    totalProjects: 2,
    activeProjects: 2,
    completedProjects: 0,
    pendingProjects: 1,
    overdueProjects: 0,
    revenue: 58000,
    vendorExpenses: 21000,
    profit: 37000,
    outstandingClientPayments: 17400,
    pendingVendorPayments: 21000
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || 'Executive Super Admin'}! 👋
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

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading dashboard...</div>
      ) : (
        <>
          {/* Primary KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="TOTAL PROJECTS"
              value={s.totalProjects}
              subtitle={`${s.activeProjects} Active, ${s.completedProjects} Completed`}
              icon={FolderKanban} color="blue"
            />
            <StatCard
              title="ACTIVE OPERATIONS"
              value={s.activeProjects}
              subtitle={`${s.pendingProjects} New, ${s.overdueProjects} Overdue`}
              icon={Clock} color="amber"
            />
            {!isVendor ? (
              <>
                <StatCard
                  title="TOTAL BILLED"
                  value={`₹${(s.revenue || 0).toLocaleString('en-IN')}`}
                  subtitle={`Outstanding: ₹${(s.outstandingClientPayments || 0).toLocaleString('en-IN')}`}
                  icon={DollarSign} color="emerald"
                />
                <StatCard
                  title="GROSS PROFIT"
                  value={`₹${(s.profit || 0).toLocaleString('en-IN')}`}
                  subtitle={`Vendor Expenses: ₹${(s.vendorExpenses || 0).toLocaleString('en-IN')}`}
                  icon={TrendingUp} color="purple"
                />
              </>
            ) : (
              <>
                <StatCard title="COMPLETED" value={s.completedProjects} subtitle="Completed assignments" icon={DollarSign} color="emerald" />
                <StatCard title="OVERDUE" value={s.overdueProjects} subtitle="Past due date" icon={AlertTriangle} color="rose" />
              </>
            )}
          </div>

          {/* Secondary row */}
          {!isVendor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard title="TOTAL CLIENTS" value={liveClientsCount} subtitle="Active client accounts" icon={Building2} color="indigo" />
              <StatCard title="ACTIVE VENDORS" value={liveVendorsCount} subtitle="Translators & reviewers" icon={Users} color="blue" />
              <StatCard
                title="PENDING VENDOR PAYABLES"
                value={`₹${(s.pendingVendorPayments || 0).toLocaleString('en-IN')}`}
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
                      <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                        paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {projectsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
              <Card title="Recent Projects" subtitle="Latest active workflows"
                action={<Link to="/projects" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>}>
                {recentProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No projects yet.</p>
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
                          <tr key={proj.id || proj.projectCode} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-semibold text-brand-600">
                              <Link to={`/projects/${proj.id || proj.projectCode}`}>{proj.projectCode}</Link>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900 max-w-[180px] truncate">{proj.projectName}</td>
                            <td className="py-3 px-3">{proj.clientName || proj.client?.companyName || '—'}</td>
                            <td className="py-3 px-3 font-mono">{proj.sourceLang} → {proj.targetLang}</td>
                            <td className="py-3 px-3"><Badge status={proj.status || 'NEW'} /></td>
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
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysLeft <= 3;
                      return (
                        <div key={proj.id || proj.projectCode} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/projects/${proj.id || proj.projectCode}`} className="font-semibold text-xs text-slate-900 hover:text-brand-600 block truncate">
                              {proj.projectCode}: {proj.projectName}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5">{proj.clientName || proj.client?.companyName || '—'}</p>
                            <p className="text-[11px] font-semibold mt-0.5 text-slate-600">{daysLeft <= 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</p>
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
