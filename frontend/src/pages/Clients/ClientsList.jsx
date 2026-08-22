import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Mail, Phone, MapPin, Eye, Trash2, RefreshCw, FileSpreadsheet, LayoutGrid, Table } from 'lucide-react';

const EMPTY_FORM = {
  companyName: '', contactPerson: '', email: '', phone: '',
  address: '', gstNumber: '', paymentTerms: '30 Days', preferredLanguages: 'English, German, Spanish', notes: ''
};

export const ClientsList = () => {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canCreate   = hasRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [viewMode, setViewMode]   = useState('table'); // 'table' or 'grid'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchClients = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/clients', { params: { search } });
      if (res.data?.success && Array.isArray(res.data.clients)) {
        setClients(res.data.clients);
        localStorage.setItem('pms_clients_list', JSON.stringify(res.data.clients));
        setLoading(false);
        return;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('pms_clients_list');
      if (saved) {
        setClients(JSON.parse(saved));
      } else {
        setClients([
          {
            id: 'clt-01',
            clientCode: 'CLT-2026-0001',
            contactPerson: 'Alex Mercer',
            companyName: 'Global Enterprise Tech Corp',
            phone: '+1 (800) 555-0199',
            email: 'alex@globaltech.com',
            address: '500 Silicon Way, San Francisco, CA',
            preferredLanguages: 'English → German, French',
            totalProjects: 12,
            totalBilling: 350000,
            pendingPayment: 45000,
            notes: 'Enterprise account with Net-30 payment terms.',
            status: 'ACTIVE'
          },
          {
            id: 'clt-02',
            clientCode: 'CLT-2026-0002',
            contactPerson: 'Sarah Jenkins',
            companyName: 'BioHealth Solutions Inc.',
            phone: '+1 (800) 555-0244',
            email: 's.jenkins@biohealth.org',
            address: '100 Biotech Blvd, Boston, MA',
            preferredLanguages: 'English → Spanish, Japanese',
            totalProjects: 8,
            totalBilling: 210000,
            pendingPayment: 0,
            notes: 'Clinical trial protocols translation.',
            status: 'ACTIVE'
          }
        ]);
      }
    } catch (e) {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError('');
    if (!formData.companyName.trim()) { setFormError('Company name is required.'); return; }
    if (!formData.email.trim())       { setFormError('Email is required.');        return; }
    if (!formData.phone.trim())       { setFormError('Phone is required.');         return; }
    if (!formData.contactPerson.trim()) { setFormError('Contact person is required.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/clients', formData);
      if (res.data?.success) {
        await fetchClients();
        setIsModalOpen(false); setFormData(EMPTY_FORM);
      } else { setFormError(res.data?.message || 'Failed to create client.'); }
    } catch (e) { setFormError(e.response?.data?.message || 'Server error.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Delete client "${name}"?`)) return;
    try {
      await api.delete(`/clients/${id}`);
      await fetchClients();
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete client.'); }
  };

  const handleExportCSV = () => {
    const headers = [
      'Client ID', 'Client Name', 'Company', 'Phone', 'Email',
      'Address', 'Preferred Languages', 'Total Projects', 'Total Billing',
      'Pending Payment', 'Notes'
    ];

    const rows = filtered.map(c => [
      c.clientCode,
      c.contactPerson,
      c.companyName,
      c.phone,
      c.email,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.preferredLanguages || 'English, German',
      c.totalProjects || c.projects?.length || 0,
      c.totalBilling || 0,
      c.pendingPayment || 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clients_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = clients.filter(c => {
    const t = search.toLowerCase();
    return !t || c.companyName?.toLowerCase().includes(t) ||
      c.contactPerson?.toLowerCase().includes(t) || c.email?.toLowerCase().includes(t) ||
      c.clientCode?.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clients Master Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage customer accounts, language pairs & financial summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="secondary" icon={FileSpreadsheet}>
            Export Excel (CSV)
          </Button>
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {canCreate && <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Add Client</Button>}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search client ID, name, company, email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium" />
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading clients directory...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No clients found" description="Add your first client account."
          actionLabel={canCreate ? 'Add Client' : null} onAction={() => setIsModalOpen(true)} />
      ) : viewMode === 'table' ? (
        /* Table View — Exact 11 Client Columns Specified by Client */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Client ID</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Preferred Languages</th>
                  <th className="py-3.5 px-4 text-center">Total Projects</th>
                  <th className="py-3.5 px-4 text-right">Total Billing</th>
                  <th className="py-3.5 px-4 text-right">Pending Payment</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    {/* 1. Client ID */}
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      <Link to={`/clients/${c.id}`}>{c.clientCode}</Link>
                    </td>
                    {/* 2. Client Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.contactPerson}</td>
                    {/* 3. Company */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.companyName}</td>
                    {/* 4. Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">{c.phone}</td>
                    {/* 5. Email */}
                    <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                    {/* 6. Address */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={c.address}>{c.address || '—'}</td>
                    {/* 7. Preferred Languages */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">{c.preferredLanguages || 'English → German'}</td>
                    {/* 8. Total Projects */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{c.totalProjects || c.projects?.length || 0}</td>
                    {/* 9. Total Billing */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{(c.totalBilling || 0).toLocaleString()}</td>
                    {/* 10. Pending Payment */}
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600">₹{(c.pendingPayment || 0).toLocaleString()}</td>
                    {/* 11. Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={c.notes}>{c.notes || '—'}</td>
                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/clients/${c.id}`} className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(c.id, c.companyName)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(client => (
            <Card key={client.id} className="hover:border-brand-300 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{client.clientCode}</span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5 line-clamp-1">{client.companyName}</h3>
                </div>
                <Badge status={client.status || 'ACTIVE'} />
              </div>
              <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3 my-3">
                <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="font-medium text-slate-900">{client.contactPerson}</span></div>
                <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{client.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{client.phone}</span></div>
                {client.address && <div className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{client.address}</span></div>}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-medium text-slate-500">Billing: <strong className="text-slate-900 font-bold">₹{(client.totalBilling || 0).toLocaleString()}</strong></span>
                <div className="flex items-center gap-3">
                  <Link to={`/clients/${client.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800">
                    <Eye className="w-3.5 h-3.5" /> View Profile
                  </Link>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(client.id, client.companyName)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Add New Client Profile">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
              <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                placeholder="e.g. Apex Super Tech" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person (Client Name) *</label>
              <input type="text" required value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                placeholder="Alex Mercer" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="contact@company.com" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (800) 555-0199" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Languages</label>
              <input type="text" value={formData.preferredLanguages} onChange={e => setFormData({...formData, preferredLanguages: e.target.value})}
                placeholder="e.g. English, German, Spanish" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option><option>Immediate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Corporate headquarters address" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Key enterprise account notes..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Client Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsList;
