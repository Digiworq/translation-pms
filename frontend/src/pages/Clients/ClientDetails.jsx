import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, StatCard } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { ArrowLeft, Building2, Mail, Phone, MapPin, DollarSign, FolderKanban, CreditCard } from 'lucide-react';

export const ClientDetails = () => {
  const { id } = useParams();
  const [client, setClient]   = useState(null);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get(`/clients/${id}`);
        if (res.data?.success) {
          setClient(res.data.client);
          setStats(res.data.stats || null);
        } else { setError('Client not found.'); }
      } catch { setError('Could not load client details.'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading client profile...</div>;
  if (error)   return <div className="py-12 text-center text-red-500">{error} <Link to="/clients" className="underline text-brand-600">Back to clients</Link></div>;
  if (!client) return null;

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> Back to Clients Directory
      </Link>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-mono">{client.clientCode}</span>
                <Badge status={client.status || 'ACTIVE'} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{client.companyName}</h1>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div><span className="text-slate-400 font-medium block mb-0.5">Contact Person</span><span className="font-semibold text-slate-900">{client.contactPerson}</span></div>
          <div className="flex items-start gap-1"><Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /><div><span className="text-slate-400 font-medium block mb-0.5">Email</span><span className="font-semibold text-slate-900">{client.email}</span></div></div>
          <div className="flex items-start gap-1"><Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /><div><span className="text-slate-400 font-medium block mb-0.5">Phone</span><span className="font-semibold text-slate-900">{client.phone}</span></div></div>
          <div><span className="text-slate-400 font-medium block mb-0.5">Payment Terms</span><span className="font-semibold text-slate-900">{client.paymentTerms || '30 Days'}</span></div>
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard title="Total Projects" value={stats.totalProjects} subtitle={`${stats.activeProjects} active`} icon={FolderKanban} color="blue" />
          <StatCard title="Total Billed" value={`₹${(stats.totalBilled || 0).toLocaleString('en-IN')}`} subtitle="Lifetime revenue" icon={DollarSign} color="emerald" />
          <StatCard title="Outstanding" value={`₹${(stats.outstandingAmount || 0).toLocaleString('en-IN')}`} subtitle="Pending payments" icon={CreditCard} color="amber" />
        </div>
      )}

      <Card title="Corporate & Tax Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Billing Address</label>
            <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /><p className="text-slate-800 font-medium">{client.address || '—'}</p></div>
          </div>
          <div>
            <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">GST / Tax Number</label>
            <p className="text-slate-800 font-mono font-bold">{client.gstNumber || '—'}</p>
          </div>
          {client.notes && (
            <div className="md:col-span-2">
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Notes</label>
              <p className="text-slate-700">{client.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Projects */}
      {client.projects?.length > 0 && (
        <Card title="Recent Projects">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr><th className="py-2 px-3">Code</th><th className="py-2 px-3">Name</th><th className="py-2 px-3">Status</th><th className="py-2 px-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.projects.map(p => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-bold text-brand-600"><Link to={`/projects/${p.id}`}>{p.projectCode}</Link></td>
                    <td className="py-2 px-3">{p.projectName}</td>
                    <td className="py-2 px-3"><Badge status={p.status} /></td>
                    <td className="py-2 px-3 text-right font-semibold">₹{(p.clientAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
