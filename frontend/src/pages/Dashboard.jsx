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
  const navigate = useNavigate();
  const isVendor = user?.role === 'VENDOR';

  const [liveVendorsCount, setLiveVendorsCount] = useState(0);
  const [liveClientsCount, setLiveClientsCount] = useState(0);

  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [projectsByStatus, setProjectsByStatus] = useState([]);
  const [projectsByType, setProjectsByType] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    let projList = [];
    let invList  = [];
    let clientCount = 0;
    let vendorCount = 0;

    // 1. Fetch real Projects
    try {
      const pRes = await api.get('/projects', { params: { limit: 100 } });
      if (pRes.data?.success && Array.isArray(pRes.data.projects)) {
        projList = pRes.data.projects;
      } else {
        const saved = localStorage.getItem('pms_projects_list');
        if (saved) projList = JSON.parse(saved);
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem('pms_projects_list');
        if (saved) projList = JSON.parse(saved);
      } catch (err) {}
    }

    // 2. Fetch real Invoices
    try {
      const iRes = await api.get('/invoices', { params: { limit: 100 } });
      if (iRes.data?.success && Array.isArray(iRes.data.invoices)) {
        invList = iRes.data.invoices;
      } else {
        const saved = localStorage.getItem('pms_invoices_list');
        if (saved) invList = JSON.parse(saved);
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem('pms_invoices_list');
        if (saved) invList = JSON.parse(saved);
      } catch (err) {}
    }

    // 3. Fetch real Clients
    try {
      const cRes = await api.get('/clients', { params: { limit: 100 } });
      if (cRes.data?.success && Array.isArray(cRes.data.clients)) {
        clientCount = cRes.data.clients.length;
      } else {
        const saved = localStorage.getItem('pms_clients_list');
        if (saved) clientCount = JSON.parse(saved).length;
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem('pms_clients_list');
        if (saved) clientCount = JSON.parse(saved).length;
      } catch (err) {}
    }

    // 4. Fetch real Vendors
    try {
      const vRes = await api.get('/vendors', { params: { limit: 100 } });
      if (vRes.data?.success && Array.isArray(vRes.data.vendors)) {
        vendorCount = vRes.data.vendors.length;
      } else {
        const saved = localStorage.getItem('pms_vendors_list');
        if (saved) vendorCount = JSON.parse(saved).length;
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem('pms_vendors_list');
        if (saved) vendorCount = JSON.parse(saved).length;
      } catch (err) {}
    }

    setLiveClientsCount(clientCount);
    setLiveVendorsCount(vendorCount);

    // Compute REAL financials from actual Invoices and Projects
    let totalBilled = 0;
    let totalUnpaidBalance = 0;

    if (invList.length > 0) {
      totalBilled = invList.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
      totalUnpaidBalance = invList.reduce((sum, inv) => {
        const grandTotal = Number(inv.grandTotal || 0);
        const rawBalance = inv.balanceAmount !== undefined ? inv.balanceAmount : inv.outstandingAmount;
        const rawPaid = inv.paidAmount !== undefined ? inv.paidAmount : inv.amountPaid;
        const paid = rawPaid !== undefined && rawPaid !== null ? Number(rawPaid) : (rawBalance !== undefined && rawBalance !== null ? Math.max(0, grandTotal - Number(rawBalance)) : 0);
        return sum + Math.max(0, grandTotal - paid);
      }, 0);
    } else {
      totalBilled = projList.reduce((sum, p) => sum + Number(p.clientAmount || 0), 0);
      totalUnpaidBalance = totalBilled;
    }

    const totalVendorCost = projList.reduce((sum, p) => sum + Number(p.totalVendorCost || 0), 0);
    const grossProfit = Math.max(0, totalBilled - totalVendorCost);

    const totalProjects = projList.length;
    const activeProjects = projList.filter(p => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(p.status)).length;
    const completedProjects = projList.filter(p => ['COMPLETED', 'DELIVERED'].includes(p.status)).length;
    const pendingProjects = projList.filter(p => p.status === 'NEW').length;

    setStats({
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects,
      overdueProjects: 0,
      revenue: totalBilled,
      vendorExpenses: totalVendorCost,
      profit: grossProfit,
      outstandingClientPayments: totalUnpaidBalance,
      pendingVendorPayments: totalVendorCost
    });

    const statusCounts = {};
    projList.forEach(p => {
      const st = p.status || 'NEW';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });
    setProjectsByStatus(Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })));

    const typeCounts = {};
    projList.forEach(p => {
      const tp = p.projectType || 'Translation';
      typeCounts[tp] = (typeCounts[tp] || 0) + 1;
    });
    setProjectsByType(Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] })));

    setRecentProjects(projList);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = projList.filter(p => {
      if (!p.deadline) return false;
      if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(p.status)) return false;
      return new Date(p.deadline) >= now;
    });
    setUpcomingDeadlines(upcoming);

    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const s = stats || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    overdueProjects: 0,
    revenue: 0,
    vendorExpenses: 0,
    profit: 0,
    outstandingClientPayments: 0,
    pendingVendorPayments: 0
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
        <div className="py-16 text-center text-slate-400 text-sm">Loading dashboard analytics...</div>
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
                  subtitle={`Unpaid Client Balance: ₹${(s.outstandingClientPayments || 0).toLocaleString('en-IN')}`}
                  icon={DollarSign} color="emerald"
                />
                <StatCard
                  title="GROSS PROFIT"
                  value={`₹${(s.profit || 0).toLocaleString('en-IN')}`}
                  subtitle="Net Profit Margin"
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
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Projects by Status</h3>
                <span className="text-xs text-slate-400 font-medium">{s.totalProjects} Total</span>
              </div>
              <div className="h-64">
                {projectsByStatus.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No projects data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Projects`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Service Category Breakdown</h3>
                <span className="text-xs text-slate-400 font-medium">{projectsByType.length} Categories</span>
              </div>
              <div className="h-64">
                {projectsByType.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No service data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip formatter={(value) => [`${value} Projects`, 'Count']} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Table: Recent Projects */}
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Operational Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live project deliverables, word counts & client billing status</p>
              </div>
              <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800">
                View All Projects <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No active projects registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Project Code</th>
                      <th className="py-3 px-3">Project Name</th>
                      <th className="py-3 px-3">Client</th>
                      <th className="py-3 px-3">Pair</th>
                      <th className="py-3 px-3 text-right">Words</th>
                      <th className="py-3 px-3 text-right">Client Amount</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recentProjects.slice(0, 5).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-brand-600">
                          <Link to={`/projects/${p.id}`}>{p.projectCode}</Link>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">{p.projectName}</td>
                        <td className="py-3 px-3 text-slate-600">{p.clientName || p.client?.companyName || '—'}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.sourceLang} → {p.targetLang}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{(p.wordCount || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{(p.clientAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-center"><Badge status={p.status || 'NEW'} /></td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
