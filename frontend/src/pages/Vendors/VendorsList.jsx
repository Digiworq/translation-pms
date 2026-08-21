import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Plus, Search, Mail, Phone, Languages, Star, Trash2, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  name: '', email: '', phone: '', specialization: '',
  ratePerWord: 1.50, sourceLang: 'English', targetLang: 'German'
};

export const VendorsList = () => {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canCreate   = hasRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchVendors = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/vendors', { params: { search } });
      if (res.data?.success && Array.isArray(res.data.vendors)) {
        setVendors(res.data.vendors);
        localStorage.setItem('pms_vendors_list', JSON.stringify(res.data.vendors));
        setLoading(false);
        return;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('pms_vendors_list');
      if (saved) {
        setVendors(JSON.parse(saved));
      } else {
        setVendors([
          { id: 'vnd-01', vendorCode: 'VND-0001', name: 'Hans Gruber', email: 'hans@bavaria-trans.com', phone: '+49 89 123456', country: 'Germany', ratePerWord: 1.5, status: 'AVAILABLE' }
        ]);
      }
    } catch (e) {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError('');
    if (!formData.name.trim())  { setFormError('Vendor name is required.'); return; }
    if (!formData.email.trim()) { setFormError('Email is required.');        return; }
    if (!formData.phone.trim()) { setFormError('Phone is required.');        return; }
    setSubmitting(true);
    try {
      const res = await api.post('/vendors', {
        ...formData,
        languages: [{ sourceLang: formData.sourceLang, targetLang: formData.targetLang }]
      });
      if (res.data?.success) {
        await fetchVendors();
        setIsModalOpen(false); setFormData(EMPTY_FORM);
      } else { setFormError(res.data?.message || 'Failed to create vendor.'); }
    } catch (e) { setFormError(e.response?.data?.message || 'Server error.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Delete vendor "${name}"?`)) return;
    try {
      await api.delete(`/vendors/${id}`);
      await fetchVendors();
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete vendor.'); }
  };

  const filtered = vendors.filter(v => {
    const t = search.toLowerCase();
    return !t || v.name?.toLowerCase().includes(t) || v.email?.toLowerCase().includes(t) ||
      v.vendorCode?.toLowerCase().includes(t) || v.specialization?.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors & Translators</h1>
          <p className="text-sm text-slate-500 mt-0.5">Linguist matrix, domain specializations, and word rates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchVendors} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Add Vendor</Button>}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, code, language, domain..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No vendors found" description="Onboard your first translator vendor."
          actionLabel={canCreate ? 'Add Vendor' : null} onAction={() => setIsModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(v => (
            <Card key={v.id} className="hover:border-brand-300 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{v.vendorCode}</span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5 line-clamp-1">{v.name}</h3>
                  <p className="text-xs text-slate-500">{v.companyName || v.specialization || '—'}</p>
                </div>
                <Badge status={v.availability || 'AVAILABLE'} />
              </div>
              <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3 my-3">
                <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{v.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{v.phone}</span></div>
                <div className="flex items-center gap-2 font-mono text-slate-800">
                  <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{v.languages?.[0]?.sourceLang || 'English'} → {v.languages?.[0]?.targetLang || '—'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-900">Rate: <strong className="text-brand-600">₹{v.ratePerWord}/w</strong></span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />{v.rating || 5.0}
                  </div>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(v.id, v.name)}
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Add New Vendor">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Ravi Kumar" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="translator@domain.com" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 98765 43210" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Per Word (₹)</label>
              <input type="number" step="0.01" min="0" value={formData.ratePerWord} onChange={e => setFormData({...formData, ratePerWord: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Language *</label>
              <input type="text" required value={formData.sourceLang} onChange={e => setFormData({...formData, sourceLang: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Language *</label>
              <input type="text" required value={formData.targetLang} onChange={e => setFormData({...formData, targetLang: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
            <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})}
              placeholder="e.g. Legal, Medical, Technical" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Vendor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
