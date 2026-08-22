import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Plus, Search, Mail, Phone, Languages, Star, Trash2, RefreshCw, FileSpreadsheet, LayoutGrid, Table } from 'lucide-react';

const EMPTY_FORM = {
  name: '', email: '', phone: '', specialization: 'Technical, Legal, Medical',
  ratePerWord: 1.50, rateUnit: 'Per Word', sourceLang: 'English', targetLang: 'German', notes: ''
};

export const VendorsList = () => {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canCreate   = hasRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [viewMode, setViewMode]   = useState('table'); // 'table' or 'grid'
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
          {
            id: 'vnd-01',
            vendorCode: 'VND-0001',
            name: 'Hans Gruber',
            email: 'hans@bavaria-trans.com',
            phone: '+49 89 123456',
            specialization: 'Technical, Legal, Automotive',
            ratePerWord: 1.50,
            rateUnit: 'Per Word',
            availability: 'AVAILABLE',
            assignedProjects: 5,
            notes: 'Top tier German translator with 10+ yrs experience.',
            languages: [{ sourceLang: 'English', targetLang: 'German' }]
          },
          {
            id: 'vnd-02',
            vendorCode: 'VND-0002',
            name: 'Carlos Gomez',
            email: 'c.gomez@spanishtrans.es',
            phone: '+34 91 987654',
            specialization: 'Medical, Certified Protocols',
            ratePerWord: 2.00,
            rateUnit: 'Per Word',
            availability: 'AVAILABLE',
            assignedProjects: 3,
            notes: 'Sworn Spanish medical translator.',
            languages: [{ sourceLang: 'English', targetLang: 'Spanish' }]
          }
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

  const handleExportCSV = () => {
    const headers = [
      'Translator ID', 'Translator Name', 'Languages', 'Specialization',
      'Phone', 'Email', 'Rate', 'Rate Unit', 'Active', 'Assigned Projects', 'Notes'
    ];

    const rows = filtered.map(v => [
      v.vendorCode,
      v.name,
      `${v.languages?.[0]?.sourceLang || 'English'} -> ${v.languages?.[0]?.targetLang || 'German'}`,
      `"${(v.specialization || '').replace(/"/g, '""')}"`,
      v.phone,
      v.email,
      v.ratePerWord || 1.5,
      v.rateUnit || 'Per Word',
      v.availability || 'AVAILABLE',
      v.assignedProjects || v.assignments?.length || 0,
      `"${(v.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Translators_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Translators & Vendors Master</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Linguist roster, domain specializations, language pairs & rates</p>
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
          {canCreate && <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Add Translator</Button>}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search translator ID, name, language, domain..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium" />
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading translators directory...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No translators found" description="Onboard your first translator vendor."
          actionLabel={canCreate ? 'Add Translator' : null} onAction={() => setIsModalOpen(true)} />
      ) : viewMode === 'table' ? (
        /* Table View — Exact 11 Translator Columns Specified by Client */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Translator ID</th>
                  <th className="py-3.5 px-4">Translator Name</th>
                  <th className="py-3.5 px-4">Languages</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-right">Rate</th>
                  <th className="py-3.5 px-4 text-center">Rate Unit</th>
                  <th className="py-3.5 px-4 text-center">Active</th>
                  <th className="py-3.5 px-4 text-center">Assigned Projects</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    {/* 1. Translator ID */}
                    <td className="py-3.5 px-4 font-bold text-brand-600">{v.vendorCode}</td>
                    {/* 2. Translator Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">{v.name}</td>
                    {/* 3. Languages */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {v.languages?.[0]?.sourceLang || 'English'} → {v.languages?.[0]?.targetLang || 'German'}
                    </td>
                    {/* 4. Specialization */}
                    <td className="py-3.5 px-4 text-slate-800">{v.specialization || 'Technical, Legal'}</td>
                    {/* 5. Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">{v.phone}</td>
                    {/* 6. Email */}
                    <td className="py-3.5 px-4 text-slate-600">{v.email}</td>
                    {/* 7. Rate */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">₹{v.ratePerWord || 1.50}</td>
                    {/* 8. Rate Unit */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                        {v.rateUnit || 'Per Word'}
                      </span>
                    </td>
                    {/* 9. Active */}
                    <td className="py-3.5 px-4 text-center"><Badge status={v.availability || 'AVAILABLE'} /></td>
                    {/* 10. Assigned Projects */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{v.assignedProjects || v.assignments?.length || 0}</td>
                    {/* 11. Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={v.notes}>{v.notes || '—'}</td>
                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(v.id, v.name)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Add New Translator Vendor">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Specialization</label>
            <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})}
              placeholder="e.g. Legal, Technical, Medical, Financial" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Linguist background & qualifications notes..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Translator Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorsList;
