import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { Tabs } from '../../components/UI/Tabs';
import { Plus, CreditCard, DollarSign, RefreshCw } from 'lucide-react';

export const PaymentsList = () => {
  const { user } = useAuth();
  const canRecord = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTS';

  const [activeTab, setActiveTab]             = useState('client');
  const [clientPayments, setClientPayments]   = useState([]);
  const [vendorPayments, setVendorPayments]   = useState([]);
  const [invoices, setInvoices]               = useState([]);
  const [vendors, setVendors]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [submitting, setSubmitting]               = useState(false);
  const [formError, setFormError]                 = useState('');

  const [clientForm, setClientForm] = useState({ invoiceId: '', clientId: '', amount: '', paymentMethod: 'BANK_TRANSFER', transactionRef: '', notes: '' });
  const [vendorForm, setVendorForm] = useState({ vendorId: '', amount: '', paymentMethod: 'BANK_TRANSFER', transactionRef: '', notes: '' });

  const fetchClientPayments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [pRes, invRes] = await Promise.all([api.get('/payments/client'), api.get('/invoices?limit=100')]);
      if (pRes.data?.success)   setClientPayments(pRes.data.payments || []);
      if (invRes.data?.success) setInvoices(invRes.data.invoices || []);
    } catch { setError('Could not load client payments.'); }
    finally { setLoading(false); }
  }, []);

  const fetchVendorPayments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [pRes, vRes] = await Promise.all([api.get('/payments/vendor'), api.get('/vendors?limit=100')]);
      if (pRes.data?.success) setVendorPayments(pRes.data.payments || []);
      if (vRes.data?.success) setVendors(vRes.data.vendors || []);
    } catch { setError('Could not load vendor payments.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'client') fetchClientPayments();
    else fetchVendorPayments();
  }, [activeTab, fetchClientPayments, fetchVendorPayments]);

  const handleRecordClientPayment = async (e) => {
    e.preventDefault(); setFormError('');
    if (!clientForm.invoiceId) { setFormError('Please select an invoice.'); return; }
    if (!clientForm.amount)    { setFormError('Amount is required.');        return; }
    // Derive clientId from the selected invoice
    const selInv = invoices.find(i => i.id === clientForm.invoiceId);
    if (!selInv) { setFormError('Invoice not found.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/payments/client', {
        invoiceId:      clientForm.invoiceId,
        clientId:       selInv.clientId || selInv.client?.id,
        projectId:      selInv.projectId || null,
        amount:         parseFloat(clientForm.amount),
        paymentMethod:  clientForm.paymentMethod,
        transactionRef: clientForm.transactionRef || null,
        notes:          clientForm.notes || null
      });
      if (res.data?.success) {
        await fetchClientPayments();
        setIsClientModalOpen(false);
        setClientForm({ invoiceId: '', clientId: '', amount: '', paymentMethod: 'BANK_TRANSFER', transactionRef: '', notes: '' });
      } else { setFormError(res.data?.message || 'Failed to record payment.'); }
    } catch (e) { setFormError(e.response?.data?.message || 'Server error.'); }
    finally { setSubmitting(false); }
  };

  const handleRecordVendorPayment = async (e) => {
    e.preventDefault(); setFormError('');
    if (!vendorForm.vendorId) { setFormError('Please select a vendor.'); return; }
    if (!vendorForm.amount)   { setFormError('Amount is required.');      return; }
    setSubmitting(true);
    try {
      const res = await api.post('/payments/vendor', {
        vendorId:       vendorForm.vendorId,
        amount:         parseFloat(vendorForm.amount),
        paymentMethod:  vendorForm.paymentMethod,
        transactionRef: vendorForm.transactionRef || null,
        notes:          vendorForm.notes || null
      });
      if (res.data?.success) {
        await fetchVendorPayments();
        setIsVendorModalOpen(false);
        setVendorForm({ vendorId: '', amount: '', paymentMethod: 'BANK_TRANSFER', transactionRef: '', notes: '' });
      } else { setFormError(res.data?.message || 'Failed to record payment.'); }
    } catch (e) { setFormError(e.response?.data?.message || 'Server error.'); }
    finally { setSubmitting(false); }
  };

  const tabs = [
    { id: 'client', label: 'Client Payments Received', icon: DollarSign },
    { id: 'vendor', label: 'Vendor Disbursements', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track incoming client receipts and outbound translator payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => activeTab === 'client' ? fetchClientPayments() : fetchVendorPayments()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canRecord && activeTab === 'client' && (
            <Button onClick={() => { setFormError(''); setIsClientModalOpen(true); }} icon={Plus}>Record Client Payment</Button>
          )}
          {canRecord && activeTab === 'vendor' && (
            <Button onClick={() => { setFormError(''); setIsVendorModalOpen(true); }} icon={Plus}>Record Vendor Payout</Button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></Card>

      {/* Client Payments Table */}
      {activeTab === 'client' && (
        <Card className="overflow-hidden p-0">
          {loading ? <div className="py-12 text-center text-slate-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Date</th><th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Client</th><th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Ref</th><th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientPayments.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">No client payments recorded yet.</td></tr>
                  ) : clientPayments.map(cp => (
                    <tr key={cp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">{new Date(cp.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-brand-600 font-mono">{cp.invoice?.invoiceNumber || '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{cp.client?.companyName || '—'}</td>
                      <td className="py-3.5 px-4"><Badge status={cp.paymentMethod} /></td>
                      <td className="py-3.5 px-4 font-mono">{cp.transactionRef || '—'}</td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-right">+₹{(cp.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Vendor Payments Table */}
      {activeTab === 'vendor' && (
        <Card className="overflow-hidden p-0">
          {loading ? <div className="py-12 text-center text-slate-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Date</th><th className="py-3.5 px-4">Vendor</th>
                    <th className="py-3.5 px-4">Method</th><th className="py-3.5 px-4">Ref</th>
                    <th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorPayments.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">No vendor payments recorded yet.</td></tr>
                  ) : vendorPayments.map(vp => (
                    <tr key={vp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">{new Date(vp.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{vp.vendor?.name || '—'} ({vp.vendor?.vendorCode || '—'})</td>
                      <td className="py-3.5 px-4"><Badge status={vp.paymentMethod} /></td>
                      <td className="py-3.5 px-4 font-mono">{vp.transactionRef || '—'}</td>
                      <td className="py-3.5 px-4"><Badge status={vp.status || 'PAID'} /></td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-right">-₹{(vp.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Record Client Payment Modal */}
      {canRecord && (
        <Modal isOpen={isClientModalOpen} onClose={() => { setIsClientModalOpen(false); setFormError(''); }} title="Record Client Payment">
          <form onSubmit={handleRecordClientPayment} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice *</label>
              <select required value={clientForm.invoiceId} onChange={e => setClientForm({...clientForm, invoiceId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option value="">— Select invoice —</option>
                {invoices.filter(i => i.paymentStatus !== 'PAID').map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.client?.companyName} (Bal: ₹{(inv.balanceAmount || 0).toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input type="number" required min="1" step="0.01" value={clientForm.amount} onChange={e => setClientForm({...clientForm, amount: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select value={clientForm.paymentMethod} onChange={e => setClientForm({...clientForm, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UTR</label>
              <input type="text" value={clientForm.transactionRef} onChange={e => setClientForm({...clientForm, transactionRef: e.target.value})}
                placeholder="e.g. UTR998822311" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-mono" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => { setIsClientModalOpen(false); setFormError(''); }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Record Payment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Vendor Payment Modal */}
      {canRecord && (
        <Modal isOpen={isVendorModalOpen} onClose={() => { setIsVendorModalOpen(false); setFormError(''); }} title="Record Vendor Payout">
          <form onSubmit={handleRecordVendorPayment} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor *</label>
              <select required value={vendorForm.vendorId} onChange={e => setVendorForm({...vendorForm, vendorId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option value="">— Select vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.vendorCode})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input type="number" required min="1" step="0.01" value={vendorForm.amount} onChange={e => setVendorForm({...vendorForm, amount: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select value={vendorForm.paymentMethod} onChange={e => setVendorForm({...vendorForm, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref</label>
              <input type="text" value={vendorForm.transactionRef} onChange={e => setVendorForm({...vendorForm, transactionRef: e.target.value})}
                placeholder="e.g. PAY-VND-1001" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-mono" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => { setIsVendorModalOpen(false); setFormError(''); }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Record Payout</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
