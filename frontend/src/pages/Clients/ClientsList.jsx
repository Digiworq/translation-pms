import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Mail, Phone, MapPin, Eye, Trash2, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  companyName: '', contactPerson: '', email: '', phone: '',
  address: '', gstNumber: '', paymentTerms: '30 Days'
};

export const ClientsList = () => {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canCreate   = hasRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchClients = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/clients', { params: { search } });
      if (res.data?.success) setClients(res.data.clients || []);
      else setError('Failed to load clients.');
    } catch {
      setError('Could not reach the server.');
    } finally { setLoading(false); }
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
          <h1 className="text-2xl font-bold text-slate-900">Clients Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage customer accounts and corporate billing profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchClients} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Add Client</Button>}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company name, contact, code..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No clients found" description="Add your first client account."
          actionLabel={canCreate ? 'Add Client' : null} onAction={() => setIsModalOpen(true)} />
      ) : (
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
                <span className="text-[11px] font-medium text-slate-500">Terms: <strong className="text-slate-700">{client.paymentTerms || '30 Days'}</strong></span>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Add New Client">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
              placeholder="e.g. Apex Super Tech" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input type="text" required value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                placeholder="Alex Mercer" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="contact@company.com" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (800) 555-0199" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Number</label>
            <input type="text" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})}
              placeholder="GSTIN27AABCG1234H1Z5" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-mono" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
