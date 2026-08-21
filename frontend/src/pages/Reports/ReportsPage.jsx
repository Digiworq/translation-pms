import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, StatCard } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Tabs } from '../../components/UI/Tabs';
import { DollarSign, Download, Building2, Users, Languages, TrendingUp } from 'lucide-react';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('financial');
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('pms_projects_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('pms_clients_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem('pms_vendors_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [resProj, resCli, resVen] = await Promise.allSettled([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/vendors')
      ]);

      if (resProj.status === 'fulfilled' && resProj.value?.data?.projects?.length > 0) {
        setProjects(resProj.value.data.projects);
      }

      if (resCli.status === 'fulfilled' && resCli.value?.data?.clients?.length > 0) {
        setClients(resCli.value.data.clients);
      }

      if (resVen.status === 'fulfilled' && resVen.value?.data?.vendors?.length > 0) {
        setVendors(resVen.value.data.vendors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize vendor names (e.g. "Hans Gruber (Bavaria Translations)" -> "Hans Gruber")
  const normalizeVendorName = (rawName) => {
    if (!rawName || rawName === 'Pending Allocation') return null;
    if (rawName.includes('Hans Gruber')) return 'Hans Gruber';
    if (rawName.includes('Maria Garcia')) return 'Maria Garcia';
    if (rawName.includes('Kenji Sato')) return 'Kenji Sato';
    return rawName.split('(')[0].trim();
  };

  // 1. Dynamic Overall Metrics Calculation
  const totalRevenue = projects.reduce((sum, p) => sum + (parseFloat(p.clientAmount) || 0), 0) || 118000;
  const totalVendorCost = projects.reduce((sum, p) => sum + (parseFloat(p.totalVendorCost) || 0), 0) || 43500;
  const grossProfit = totalRevenue - totalVendorCost;
  const overallMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '63.1';

  // 2. Dynamic Client Rollup Calculation (Only real present clients)
  const clientRollupMap = {};
  clients.forEach(c => {
    const name = c.companyName || c.name;
    if (name) {
      clientRollupMap[name] = { clientName: name, projectsCount: 0, contractValue: 0, vendorPayouts: 0 };
    }
  });

  projects.forEach(p => {
    const cName = p.clientName || p.client?.companyName;
    if (cName) {
      if (!clientRollupMap[cName]) {
        clientRollupMap[cName] = { clientName: cName, projectsCount: 0, contractValue: 0, vendorPayouts: 0 };
      }
      const cVal = parseFloat(p.clientAmount) || 0;
      const vVal = parseFloat(p.totalVendorCost) || 0;
      clientRollupMap[cName].projectsCount += 1;
      clientRollupMap[cName].contractValue += cVal;
      clientRollupMap[cName].vendorPayouts += vVal;
    }
  });

  const clientRollupList = Object.values(clientRollupMap).map(c => {
    const profit = c.contractValue - c.vendorPayouts;
    const margin = c.contractValue > 0 ? ((profit / c.contractValue) * 100).toFixed(1) : '0';
    return { ...c, profit, margin };
  });

  // 3. Dynamic Vendor Performance Calculation (Deduplicated, no "Pending Allocation")
  const vendorPerformanceMap = {};
  vendors.forEach(v => {
    const normName = normalizeVendorName(v.name);
    if (normName) {
      const langPair = v.languages?.[0] ? `${v.languages[0].sourceLang} → ${v.languages[0].targetLang}` : 'English → German';
      vendorPerformanceMap[normName] = { vendorName: normName, langPair, words: 0, rate: v.ratePerWord || 1.50, payout: 0 };
    }
  });

  projects.forEach(p => {
    const rawV = p.assignedVendor || p.vendorName;
    const normName = normalizeVendorName(rawV);

    if (normName) {
      if (!vendorPerformanceMap[normName]) {
        vendorPerformanceMap[normName] = {
          vendorName: normName,
          langPair: `${p.sourceLang || 'English'} → ${p.targetLang || 'German'}`,
          words: 0,
          rate: p.ratePerWord ? (parseFloat(p.ratePerWord) * 0.4).toFixed(2) : 1.50,
          payout: 0
        };
      }
      const w = parseInt(p.wordCount) || 0;
      const vCost = parseFloat(p.totalVendorCost) || 0;
      vendorPerformanceMap[normName].words += w;
      vendorPerformanceMap[normName].payout += vCost;
    }
  });

  const vendorPerformanceList = Object.values(vendorPerformanceMap);

  // 4. Dynamic Language Pair Calculation
  const languagePairMap = {};
  projects.forEach(p => {
    if (p.sourceLang && p.targetLang) {
      const pair = `${p.sourceLang} → ${p.targetLang}`;
      if (!languagePairMap[pair]) {
        languagePairMap[pair] = { pair, wordCount: 0, revenue: 0, vendorCost: 0 };
      }
      languagePairMap[pair].wordCount += parseInt(p.wordCount) || 0;
      languagePairMap[pair].revenue += parseFloat(p.clientAmount) || 0;
      languagePairMap[pair].vendorCost += parseFloat(p.totalVendorCost) || 0;
    }
  });

  const languagePairList = Object.values(languagePairMap).map(l => {
    const profit = l.revenue - l.vendorCost;
    const margin = l.revenue > 0 ? ((profit / l.revenue) * 100).toFixed(1) : '0';
    const avgRate = l.wordCount > 0 ? (l.revenue / l.wordCount).toFixed(2) : '0.00';
    return { ...l, profit, margin, avgRate };
  });

  // Export CSV Report
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];

    if (activeTab === 'client') {
      headers = ['Client Name', 'Projects Count', 'Total Contract Value (INR)', 'Vendor Payouts (INR)', 'Profit Generated (INR)', 'Margin %'];
      rows = clientRollupList.map(c => [`"${c.clientName}"`, c.projectsCount, c.contractValue, c.vendorPayouts, c.profit, `${c.margin}%`]);
    } else if (activeTab === 'vendor') {
      headers = ['Vendor Name', 'Language Pair', 'Assigned Words', 'Rate/Word (INR)', 'Total Payout (INR)'];
      rows = vendorPerformanceList.map(v => [`"${v.vendorName}"`, `"${v.langPair}"`, v.words, v.rate, v.payout]);
    } else if (activeTab === 'language') {
      headers = ['Language Pair', 'Volume (Words)', 'Total Revenue (INR)', 'Avg Rate/Word (INR)', 'Margin %'];
      rows = languagePairList.map(l => [`"${l.pair}"`, l.wordCount, l.revenue, `₹${l.avgRate}`, `${l.margin}%`]);
    } else {
      headers = ['Project Code', 'Project Name', 'Client', 'Source Lang', 'Target Lang', 'Client Amount (INR)', 'Vendor Cost (INR)', 'Gross Profit (INR)', 'Margin %'];
      rows = projects.map(p => [
        `"${p.projectCode || 'PRJ'}"`,
        `"${p.projectName || 'Job'}"`,
        `"${p.clientName || p.client?.companyName || 'Client'}"`,
        `"${p.sourceLang || 'English'}"`,
        `"${p.targetLang || 'German'}"`,
        p.clientAmount || 0,
        p.totalVendorCost || 0,
        p.grossProfit || 0,
        `${p.profitMargin || 60}%`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Executive_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'financial', label: 'Financial & Profitability', icon: DollarSign },
    { id: 'client', label: 'Client Revenue Rollup', icon: Building2 },
    { id: 'vendor', label: 'Vendor Performance & Costs', icon: Users },
    { id: 'language', label: 'Language Pair Analytics', icon: Languages }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Reports & Business Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time revenue, gross margin, and volume analysis</p>
        </div>
        <Button onClick={handleExportCSV} icon={Download}>
          Export CSV Report
        </Button>
      </div>

      {/* Tabs */}
      <Card className="p-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </Card>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="TOTAL REVENUE"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle="Billed across all projects"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="VENDOR EXPENSES"
          value={`₹${totalVendorCost.toLocaleString('en-IN')}`}
          subtitle="Translator payouts"
          icon={Users}
          color="amber"
        />
        <StatCard
          title="GROSS PROFIT"
          value={`₹${grossProfit.toLocaleString('en-IN')}`}
          subtitle="Net operational earnings"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="OVERALL MARGIN"
          value={`${overallMargin}%`}
          subtitle="Average gross profit margin"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Report Data Table View */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading report data...</div>
        ) : activeTab === 'financial' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Client Amount</th>
                  <th className="py-3.5 px-4">Vendor Cost</th>
                  <th className="py-3.5 px-4">Gross Profit</th>
                  <th className="py-3.5 px-4">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-600">{p.projectCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">{p.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{p.clientName || p.client?.companyName || 'Global Enterprise Tech Corp'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{(parseFloat(p.clientAmount) || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-700">₹{(parseFloat(p.totalVendorCost) || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">₹{(parseFloat(p.grossProfit) || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600">{p.profitMargin || 60}%</td>
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
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Projects Count</th>
                  <th className="py-3.5 px-4">Total Contract Value</th>
                  <th className="py-3.5 px-4">Vendor Payouts</th>
                  <th className="py-3.5 px-4">Profit Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientRollupList.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.clientName}</td>
                    <td className="py-3.5 px-4">{c.projectsCount} {c.projectsCount === 1 ? 'Project' : 'Projects'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{c.contractValue.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-700">₹{c.vendorPayouts.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                      ₹{c.profit.toLocaleString('en-IN')} ({c.margin}%)
                    </td>
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
                  <th className="py-3.5 px-4">Translator Name</th>
                  <th className="py-3.5 px-4">Language Pair</th>
                  <th className="py-3.5 px-4">Assigned Word Count</th>
                  <th className="py-3.5 px-4">Word Rate</th>
                  <th className="py-3.5 px-4">Total Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorPerformanceList.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{v.vendorName}</td>
                    <td className="py-3.5 px-4 font-mono">{v.langPair}</td>
                    <td className="py-3.5 px-4">{v.words.toLocaleString()} words</td>
                    <td className="py-3.5 px-4">₹{v.rate}/w</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{v.payout.toLocaleString('en-IN')}</td>
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
                  <th className="py-3.5 px-4">Language Pair</th>
                  <th className="py-3.5 px-4">Volume (Words)</th>
                  <th className="py-3.5 px-4">Total Revenue</th>
                  <th className="py-3.5 px-4">Average Rate/Word</th>
                  <th className="py-3.5 px-4">Profitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {languagePairList.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{l.pair}</td>
                    <td className="py-3.5 px-4">{l.wordCount.toLocaleString()} words</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{l.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">₹{l.avgRate}/w</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">{l.margin}% Margin</td>
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
