import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, StatCard } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Tabs } from '../../components/UI/Tabs';
import { DollarSign, Download, Building2, Users, Languages, TrendingUp, RefreshCw } from 'lucide-react';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('financial');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [financialReport, setFinancialReport] = useState(null);
  const [clientReport,    setClientReport]    = useState([]);
  const [vendorReport,    setVendorReport]    = useState([]);
  const [languageReport,  setLanguageReport]  = useState([]);

  const fetchReports = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [fin, cli, ven, lan] = await Promise.all([
        api.get('/reports/financial'),
        api.get('/reports/clients'),
        api.get('/reports/vendors'),
        api.get('/reports/languages')
      ]);

      if (fin.data?.success) setFinancialReport(fin.data);
      if (cli.data?.success) setClientReport(cli.data.report || []);
      if (ven.data?.success) setVendorReport(ven.data.report || []);
      if (lan.data?.success) setLanguageReport(lan.data.report || []);
    } catch (e) {
      setError('Could not load report data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const summary = financialReport?.summary || {};
  const projects = financialReport?.projects || [];

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];

    if (activeTab === 'financial') {
      headers = ['Code', 'Project Name', 'Client', 'Client Amount', 'Vendor Cost', 'Gross Profit', 'Margin %'];
      rows = projects.map(p => [
        `"${p.projectCode}"`, `"${p.projectName}"`,
        `"${p.client?.companyName || ''}"`,
        p.clientAmount, p.totalVendorCost, p.grossProfit, `${p.profitMargin}%`
      ]);
    } else if (activeTab === 'client') {
      headers = ['Client', 'Total Projects', 'Total Billed', 'Total Paid', 'Outstanding'];
      rows = clientReport.map(c => [
        `"${c.companyName}"`, c.totalProjects, c.totalBilled, c.totalPaid, c.outstanding
      ]);
    } else if (activeTab === 'vendor') {
      headers = ['Vendor', 'Total Assignments', 'Total Earned', 'Rating', 'Languages'];
      rows = vendorReport.map(v => [
        `"${v.name}"`, v.totalAssignments, v.totalEarned, v.rating, `"${v.languages}"`
      ]);
    } else {
      headers = ['Language Pair', 'Projects', 'Total Words', 'Total Revenue', 'Total Cost'];
      rows = languageReport.map(l => [
        `"${l.pair}"`, l.projectCount, l.totalWords, l.totalRevenue, l.totalCost
      ]);
    }

    const csv = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'financial', label: 'Financial & Profitability', icon: DollarSign },
    { id: 'client',    label: 'Client Revenue Rollup',     icon: Building2  },
    { id: 'vendor',    label: 'Vendor Performance',         icon: Users      },
    { id: 'language',  label: 'Language Pair Analytics',    icon: Languages  }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time revenue, margin, and volume analysis from MySQL</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={handleExportCSV} icon={Download}>Export CSV</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="TOTAL REVENUE"       value={`₹${(summary.totalRevenue       || 0).toLocaleString('en-IN')}`} subtitle="Billed across all projects"    icon={DollarSign} color="blue"    />
        <StatCard title="VENDOR EXPENSES"     value={`₹${(summary.totalVendorExpenses|| 0).toLocaleString('en-IN')}`} subtitle="Translator payouts"             icon={Users}      color="amber"   />
        <StatCard title="GROSS PROFIT"        value={`₹${(summary.totalGrossProfit   || 0).toLocaleString('en-IN')}`} subtitle="Net operational earnings"       icon={TrendingUp} color="emerald" />
        <StatCard title="OVERALL MARGIN"      value={`${summary.overallMargin || 0}%`}                                subtitle="Average gross profit margin"    icon={DollarSign} color="purple"  />
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading report data...</div>
        ) : activeTab === 'financial' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Code</th><th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Client</th><th className="py-3.5 px-4">Client Amount</th>
                  <th className="py-3.5 px-4">Vendor Cost</th><th className="py-3.5 px-4">Gross Profit</th>
                  <th className="py-3.5 px-4">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">No projects found.</td></tr>
                ) : projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-brand-600">{p.projectCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">{p.projectName}</td>
                    <td className="py-3.5 px-4">{p.client?.companyName || '—'}</td>
                    <td className="py-3.5 px-4 font-bold">₹{(p.clientAmount||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">₹{(p.totalVendorCost||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">₹{(p.grossProfit||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-600">{(p.profitMargin||0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'client' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Client</th><th className="py-3.5 px-4">Projects</th>
                  <th className="py-3.5 px-4">Total Billed</th><th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientReport.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No clients found.</td></tr>
                ) : clientReport.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.companyName}</td>
                    <td className="py-3.5 px-4">{c.totalProjects}</td>
                    <td className="py-3.5 px-4 font-bold">₹{(c.totalBilled||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold">₹{(c.totalPaid||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">₹{(c.outstanding||0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'vendor' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Vendor</th><th className="py-3.5 px-4">Assignments</th>
                  <th className="py-3.5 px-4">Total Earned</th><th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Languages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorReport.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No vendors found.</td></tr>
                ) : vendorReport.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{v.name}</td>
                    <td className="py-3.5 px-4">{v.totalAssignments}</td>
                    <td className="py-3.5 px-4 font-bold">₹{(v.totalEarned||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">⭐ {v.rating}</td>
                    <td className="py-3.5 px-4 font-mono">{v.languages || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Language Pair</th><th className="py-3.5 px-4">Projects</th>
                  <th className="py-3.5 px-4">Total Words</th><th className="py-3.5 px-4">Total Revenue</th>
                  <th className="py-3.5 px-4">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {languageReport.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No language data yet.</td></tr>
                ) : languageReport.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold font-mono">{l.pair}</td>
                    <td className="py-3.5 px-4">{l.projectCount}</td>
                    <td className="py-3.5 px-4">{(l.totalWords||0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold">₹{(l.totalRevenue||0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">₹{(l.totalCost||0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
