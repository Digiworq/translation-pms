import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { Plus, Search, Eye, Trash2, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  clientId: '', projectId: '', taxPercent: '18',
  subtotal: '', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  poNumber: '', notes: ''
};

export const InvoicesList = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [invoices, setInvoices]   = useState([]);
  const [clients, setClients]     = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/invoices', { params: { search } });
      if (res.data?.success && Array.isArray(res.data.invoices)) {
        setInvoices(res.data.invoices);
        localStorage.setItem('pms_invoices_list', JSON.stringify(res.data.invoices));
        setLoading(false);
        return;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('pms_invoices_list');
      if (saved) setInvoices(JSON.parse(saved));
      else setInvoices([]);
    } catch (e) {}
    setLoading(false);
  }, [search]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([api.get('/clients'), api.get('/projects')]);
      if (cRes.data?.success) setClients(cRes.data.clients || []);
      if (pRes.data?.success) setProjects(pRes.data.projects || []);
    } catch {}
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError('');
    if (!formData.clientId) { setFormError('Please select a client.'); return; }
    if (!formData.subtotal) { setFormError('Subtotal is required.'); return; }
    setSubmitting(true);
    try {
      const subtotal   = parseFloat(formData.subtotal) || 0;
      const taxAmount  = subtotal * ((parseFloat(formData.taxPercent) || 0) / 100);
      const res = await api.post('/invoices', {
        clientId:   formData.clientId,
        projectId:  formData.projectId || null,
        subtotal,
        taxAmount,
        discount:   0,
        taxPercent: parseFloat(formData.taxPercent) || 0,
        dueDate:    formData.dueDate,
        poNumber:   formData.poNumber,
        notes:      formData.notes,
        items: [{
          service:  'Translation & Localization Service',
          quantity: 1,
          unit:     'flat',
          rate:     subtotal,
          amount:   subtotal
        }]
      });
      if (res.data?.success) {
        await fetchInvoices();
        setIsModalOpen(false); setFormData(EMPTY_FORM);
      } else { setFormError(res.data?.message || 'Failed to create invoice.'); }
    } catch (e) { setFormError(e.response?.data?.message || 'Server error.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, num) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Delete invoice ${num}?`)) return;
    try {
      await api.delete(`/invoices/${id}`);
      await fetchInvoices();
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete invoice.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate client invoices and track outstanding payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchInvoices} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Create Invoice</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice number, client..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading invoices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Due</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-brand-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.client?.companyName || '—'}</td>
                    <td className="py-3.5 px-4">{inv.project?.projectCode || '—'}</td>
                    <td className="py-3.5 px-4">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3.5 px-4 font-bold">₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">₹{(inv.balanceAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4"><Badge status={inv.paymentStatus || 'PENDING'} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setViewInvoice(inv)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Create New Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
              <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link Project (optional)</label>
              <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option value="">— None —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal (₹) *</label>
              <input type="number" step="0.01" min="0" required value={formData.subtotal} onChange={e => setFormData({...formData, subtotal: e.target.value})}
                placeholder="e.g. 30000" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax (%)</label>
              <input type="number" step="0.1" min="0" value={formData.taxPercent} onChange={e => setFormData({...formData, taxPercent: e.target.value})}
                placeholder="18" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
              <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO Number</label>
              <input type="text" value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})}
                placeholder="PO-2026-0011" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-mono" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Generate Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice ${viewInvoice.invoiceNumber}`}>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-3">
              <div><p className="font-bold text-brand-600 text-lg">LingoTech PMS</p><p className="text-xs text-slate-500">Translation & Localization Services</p></div>
              <div className="text-right"><p className="font-bold">{viewInvoice.invoiceNumber}</p><p className="text-xs text-slate-500">{new Date(viewInvoice.invoiceDate).toLocaleDateString()}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><p className="text-slate-500 font-semibold">Bill To</p><p className="font-bold text-slate-900">{viewInvoice.client?.companyName}</p><p>{viewInvoice.client?.email}</p></div>
              <div><p className="text-slate-500 font-semibold">Project</p><p className="font-bold text-slate-900">{viewInvoice.project?.projectCode || '—'}</p><p>PO: {viewInvoice.poNumber || '—'}</p></div>
            </div>
            <table className="w-full text-xs border border-slate-100 rounded">
              <thead className="bg-slate-50"><tr><th className="py-2 px-3 text-left">Service</th><th className="py-2 px-3 text-right">Amount</th></tr></thead>
              <tbody>{(viewInvoice.items || []).map((item, i) => (
                <tr key={i} className="border-t border-slate-100"><td className="py-2 px-3">{item.service}</td><td className="py-2 px-3 text-right">₹{(item.amount || 0).toLocaleString('en-IN')}</td></tr>
              ))}</tbody>
            </table>
            <div className="text-xs space-y-1 text-right">
              <p>Subtotal: <strong>₹{(viewInvoice.subtotal || 0).toLocaleString('en-IN')}</strong></p>
              <p>Tax: <strong>₹{(viewInvoice.taxAmount || 0).toLocaleString('en-IN')}</strong></p>
              <p className="text-base font-bold text-slate-900">Grand Total: ₹{(viewInvoice.grandTotal || 0).toLocaleString('en-IN')}</p>
              <p className="text-rose-600 font-semibold">Balance Due: ₹{(viewInvoice.balanceAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
