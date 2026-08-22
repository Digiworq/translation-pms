import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { VismaLogo } from '../../components/UI/VismaLogo';
import { Plus, Search, Eye, Trash2, RefreshCw, FileSpreadsheet, Printer, Globe2, CheckCircle2 } from 'lucide-react';

const EMPTY_FORM = {
  clientId: '', projectId: '', taxPercent: '0',
  subtotal: '', initialPaid: '', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  poNumber: '', paymentMethod: 'Bank Transfer', notes: ''
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
      if (saved) {
        setInvoices(JSON.parse(saved));
      } else {
        setInvoices([
          {
            id: 'inv-01',
            invoiceNumber: 'INV-2026-0001',
            projectCode: 'PRJ-2026-0001',
            clientName: 'Global Enterprise Tech Corp',
            invoiceDate: '2026-08-21',
            dueDate: '2026-09-20',
            grandTotal: 35400,
            paidAmount: 35400,
            balanceAmount: 0,
            paymentStatus: 'PAID',
            paymentDate: '2026-08-22',
            paymentMethod: 'Bank Transfer (NEFT)',
            notes: 'Paid in full via HDFC Bank.'
          },
          {
            id: 'inv-02',
            invoiceNumber: 'INV-2026-0002',
            projectCode: 'PRJ-2026-0002',
            clientName: 'BioHealth Solutions Inc.',
            invoiceDate: '2026-08-15',
            dueDate: '2026-09-14',
            grandTotal: 35400,
            paidAmount: 15000,
            balanceAmount: 20400,
            paymentStatus: 'PARTIAL',
            paymentDate: '2026-08-18',
            paymentMethod: 'UPI / Razorpay',
            notes: 'Advance 50% paid.'
          }
        ]);
      }
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
    if (!formData.subtotal) { setFormError('Subtotal amount is required.'); return; }
    setSubmitting(true);
    try {
      const subtotal   = parseFloat(formData.subtotal) || 0;
      const taxAmount  = subtotal * ((parseFloat(formData.taxPercent) || 0) / 100);
      const grandTotal = subtotal + taxAmount;
      const initialPaid = parseFloat(formData.initialPaid) || 0;
      const balanceAmount = Math.max(0, grandTotal - initialPaid);

      let paymentStatus = 'PENDING';
      if (initialPaid >= grandTotal && grandTotal > 0) paymentStatus = 'PAID';
      else if (initialPaid > 0) paymentStatus = 'PARTIAL';

      const res = await api.post('/invoices', {
        clientId:   formData.clientId,
        projectId:  formData.projectId || null,
        subtotal,
        taxAmount,
        grandTotal,
        paidAmount: initialPaid,
        balanceAmount,
        paymentStatus,
        discount:   0,
        taxPercent: parseFloat(formData.taxPercent) || 0,
        dueDate:    formData.dueDate,
        poNumber:   formData.poNumber,
        paymentMethod: formData.paymentMethod,
        notes:      formData.notes,
        items: [{
          service:  'Translation & Localization Service',
          quantity: 1,
          unit:     'per word',
          rate:     subtotal,
          amount:   subtotal
        }]
      });

      const createdInvoice = res.data?.invoice || res.data?.data;
      const createdId = createdInvoice?.id;

      if (createdId && initialPaid > 0) {
        try {
          await api.post('/payments/client', {
            invoiceId:      createdId,
            clientId:       formData.clientId,
            projectId:      formData.projectId || null,
            amount:         initialPaid,
            paymentMethod:  formData.paymentMethod === 'Bank Transfer (NEFT/RTGS)' ? 'BANK_TRANSFER' : 'UPI',
            notes:          'Initial advance payment during invoice generation'
          });
        } catch (e) {}
      }

      // Preserve created item with initial paid amount in local storage cache
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const selectedProject = projects.find(p => p.id === formData.projectId);
      const newInv = {
        id: createdId || `inv-${Date.now()}`,
        invoiceNumber: createdInvoice?.invoiceNumber || `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`,
        projectCode: selectedProject?.projectCode || 'PRJ-2026-0001',
        clientName: selectedClient?.companyName || 'Corporate Client',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate,
        grandTotal,
        paidAmount: initialPaid,
        balanceAmount,
        paymentStatus,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      const updatedList = [newInv, ...invoices.filter(i => i.id !== newInv.id)];
      setInvoices(updatedList);
      localStorage.setItem('pms_invoices_list', JSON.stringify(updatedList));

      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
    } catch (e) {
      setFormError(e.response?.data?.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, num) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Delete invoice ${num}?`)) return;
    try {
      await api.delete(`/invoices/${id}`);
      await fetchInvoices();
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete invoice.'); }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice No', 'Project ID', 'Client Name', 'Invoice Date', 'Due Date',
      'Invoice Amount', 'Amount Paid', 'Balance', 'Payment Status', 'Payment Date',
      'Payment Method', 'Notes'
    ];

    const rows = filteredInvoices.map(inv => {
      const grandTotal = Number(inv.grandTotal || 0);
      const rawBalance = inv.balanceAmount !== undefined ? inv.balanceAmount : inv.outstandingAmount;
      const rawPaid = inv.paidAmount !== undefined ? inv.paidAmount : inv.amountPaid;
      const paidAmount = rawPaid !== undefined && rawPaid !== null ? Number(rawPaid) : (rawBalance !== undefined && rawBalance !== null ? Math.max(0, grandTotal - Number(rawBalance)) : 0);
      const calculatedBalance = Math.max(0, grandTotal - paidAmount);

      return [
        inv.invoiceNumber,
        inv.projectCode || inv.project?.projectCode || '—',
        inv.clientName || inv.client?.companyName || '—',
        inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
        grandTotal,
        paidAmount,
        calculatedBalance,
        inv.paymentStatus || 'PENDING',
        inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : '—',
        inv.paymentMethod || 'Bank Transfer',
        `"${(inv.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoices_Billing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter(inv => {
    const t = search.toLowerCase();
    return !t ||
      inv.invoiceNumber?.toLowerCase().includes(t) ||
      (inv.clientName || inv.client?.companyName)?.toLowerCase().includes(t) ||
      (inv.projectCode || inv.project?.projectCode)?.toLowerCase().includes(t);
  });

  // Calculate Live Form Totals
  const liveSubtotal = parseFloat(formData.subtotal) || 0;
  const liveTaxPercent = parseFloat(formData.taxPercent) || 0;
  const liveTaxAmount = liveSubtotal * (liveTaxPercent / 100);
  const liveGrandTotal = liveSubtotal + liveTaxAmount;
  const liveInitialPaid = parseFloat(formData.initialPaid) || 0;
  const liveBalance = Math.max(0, liveGrandTotal - liveInitialPaid);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices & Billing Master</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Corporate billing ledger, receivables & payment status tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="secondary" icon={FileSpreadsheet}>
            Export Excel (CSV)
          </Button>
          <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Create Invoice</Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice no, project ID, client..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium" />
        </div>
      </Card>

      {/* Invoices Table — Exact 12 Columns Specified by Client */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading billing records...</div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState title="No invoices found" description="Create your first client invoice."
            actionLabel="Create Invoice" onAction={() => setIsModalOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Project ID</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4 text-center">Invoice Date</th>
                  <th className="py-3.5 px-4 text-center">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Invoice Amount</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-center">Payment Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvoices.map(inv => {
                  const grandTotal = Number(inv.grandTotal || 0);
                  const rawBalance = inv.balanceAmount !== undefined ? inv.balanceAmount : inv.outstandingAmount;
                  const rawPaid = inv.paidAmount !== undefined ? inv.paidAmount : inv.amountPaid;
                  
                  const paidAmount = rawPaid !== undefined && rawPaid !== null
                    ? Number(rawPaid)
                    : (rawBalance !== undefined && rawBalance !== null ? Math.max(0, grandTotal - Number(rawBalance)) : 0);
                    
                  const calculatedBalance = Math.max(0, grandTotal - paidAmount);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Invoice No */}
                      <td className="py-3.5 px-4 font-bold text-brand-600">{inv.invoiceNumber}</td>
                      {/* 2. Project ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{inv.projectCode || inv.project?.projectCode || '—'}</td>
                      {/* 3. Client Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">{inv.clientName || inv.client?.companyName || '—'}</td>
                      {/* 4. Invoice Date */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}</td>
                      {/* 5. Due Date */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                      {/* 6. Invoice Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</td>
                      {/* 7. Amount Paid */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">₹{paidAmount.toLocaleString('en-IN')}</td>
                      {/* 8. Balance */}
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">₹{calculatedBalance.toLocaleString('en-IN')}</td>
                      {/* 9. Payment Status */}
                      <td className="py-3.5 px-4 text-center"><Badge status={inv.paymentStatus || 'PENDING'} /></td>
                      {/* 10. Payment Date */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : '—'}</td>
                      {/* 11. Payment Method */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{inv.paymentMethod || 'Bank Transfer'}</td>
                      {/* 12. Notes */}
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={inv.notes}>{inv.notes || '—'}</td>
                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-brand-600 hover:text-brand-800 rounded-lg hover:bg-brand-50 transition-colors"
                            title="Print / View Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Create New Client Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
              <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium">
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link Project (optional)</label>
              <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium">
                <option value="">— None —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Base Amount (₹) *</label>
              <input type="number" required step="0.01" value={formData.subtotal} onChange={e => setFormData({...formData, subtotal: e.target.value})}
                placeholder="5000" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax % (optional)</label>
              <input type="number" value={formData.taxPercent} onChange={e => setFormData({...formData, taxPercent: e.target.value})}
                placeholder="0" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid / Advance Received (₹)</label>
              <input type="number" step="0.01" value={formData.initialPaid} onChange={e => setFormData({...formData, initialPaid: e.target.value})}
                placeholder="0" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold text-emerald-600" />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Enter advance amount or leave blank for 0</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
              <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO / Reference No</label>
              <input type="text" value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})}
                placeholder="PO-2026-99" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium">
                <option>Bank Transfer (NEFT/RTGS)</option>
                <option>UPI / Razorpay</option>
                <option>Credit Card</option>
                <option>Wire Transfer (SWIFT)</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1.5 font-mono shadow-inner">
            <div className="flex justify-between text-slate-400">
              <span>Invoice Base Amount:</span>
              <span className="font-bold text-slate-200">₹{liveSubtotal.toLocaleString('en-IN')}</span>
            </div>
            {liveTaxPercent > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>GST Tax ({liveTaxPercent}%):</span>
                <span className="font-bold text-slate-300">+ ₹{liveTaxAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-slate-800">
              <span>Grand Total Invoice Amount:</span>
              <span className="text-brand-400">₹{liveGrandTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Amount Paid:</span>
              <span className="font-bold">₹{liveInitialPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-400">
              <span>Balance Due:</span>
              <span>₹{liveBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Payment Terms</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Payment due within 30 days of invoice date." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Generate Invoice (₹{liveGrandTotal.toLocaleString('en-IN')})</Button>
          </div>
        </form>
      </Modal>

      {/* Print-Ready Corporate Tax Invoice Modal */}
      {viewInvoice && (
        <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Tax Invoice: ${viewInvoice.invoiceNumber}`}>
          <div id="printable-invoice" className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 text-slate-800">
            {/* Header / Branding */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <VismaLogo size="md" />
                <p className="text-xs text-slate-500 font-medium mt-1">Visma Translation & Localization Services Pvt Ltd</p>
                <p className="text-[11px] text-slate-500">GSTIN: 27AABCL9988H1Z5 | Corporate HQ: Mumbai, MH, India</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1 rounded-md">
                  TAX INVOICE
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-2">{viewInvoice.invoiceNumber}</p>
                <p className="text-xs text-slate-500">Date: {new Date(viewInvoice.invoiceDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To & Invoice Info */}
            <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
                <h4 className="font-extrabold text-slate-900 text-sm">{viewInvoice.clientName || viewInvoice.client?.companyName}</h4>
                <p className="text-slate-600 mt-0.5">Project: {viewInvoice.projectCode || viewInvoice.project?.projectCode || 'N/A'}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice Details</span>
                <p className="text-slate-600">Due Date: <strong className="text-slate-900">{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : 'N/A'}</strong></p>
                <p className="text-slate-600">Payment Status: <strong className="text-brand-600 font-bold">{viewInvoice.paymentStatus || 'PENDING'}</strong></p>
                <p className="text-slate-600">Payment Method: <strong className="text-slate-800">{viewInvoice.paymentMethod || 'Bank Transfer'}</strong></p>
              </div>
            </div>

            {/* Invoice Items Table */}
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Service Item Description</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    Professional Translation & Localization Services ({viewInvoice.projectCode || 'Master Project'})
                  </td>
                  <td className="py-3 px-3 text-center font-mono">1 Service</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{(viewInvoice.grandTotal || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Grand Total:</span>
                  <span className="font-bold text-slate-900">₹{(viewInvoice.grandTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Amount Paid:</span>
                  <span className="font-bold">
                    ₹{(
                      viewInvoice.paidAmount !== undefined && viewInvoice.paidAmount !== null
                        ? Number(viewInvoice.paidAmount)
                        : viewInvoice.amountPaid !== undefined && viewInvoice.amountPaid !== null
                        ? Number(viewInvoice.amountPaid)
                        : Math.max(0, (viewInvoice.grandTotal || 0) - Number(viewInvoice.balanceAmount || viewInvoice.outstandingAmount || 0))
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 font-extrabold text-sm border-t pt-1">
                  <span>Balance Due:</span>
                  <span>
                    ₹{Math.max(
                      0,
                      (viewInvoice.grandTotal || 0) -
                        (viewInvoice.paidAmount !== undefined && viewInvoice.paidAmount !== null
                          ? Number(viewInvoice.paidAmount)
                          : viewInvoice.amountPaid !== undefined && viewInvoice.amountPaid !== null
                          ? Number(viewInvoice.amountPaid)
                          : Math.max(0, (viewInvoice.grandTotal || 0) - Number(viewInvoice.balanceAmount || viewInvoice.outstandingAmount || 0)))
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details & Terms */}
            {viewInvoice.notes && (
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-200">
                <strong className="block text-slate-900 mb-1">Billing Notes & Bank Payment Terms:</strong>
                {viewInvoice.notes}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Authorized System Generated Invoice
              </span>
              <div className="flex items-center gap-2">
                <Button onClick={handlePrint} icon={Printer}>
                  Print / Save PDF Invoice
                </Button>
                <Button onClick={() => setViewInvoice(null)} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesList;
