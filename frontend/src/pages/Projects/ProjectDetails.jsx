import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, StatCard } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { ArrowLeft, Calendar, DollarSign, FileText, Users, TrendingUp, Clock, Download, Plus, UserPlus } from 'lucide-react';

export const ProjectDetails = () => {
  const { id }   = useParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isVendor     = user?.role === 'VENDOR';

  const [project, setProject]     = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting]   = useState(false);
  const [assignError, setAssignError]             = useState('');
  const [assignForm, setAssignForm] = useState({
    vendorId: '', taskType: 'Translation', assignedWords: '', vendorRate: ''
  });

  // ── Load project from API ─────────────────────────────────────────────────
  const loadProject = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data?.success && res.data.project) {
        setProject(res.data.project);
        setAuditLogs(res.data.auditLogs || []);
      } else { setError('Project not found.'); }
    } catch { setError('Could not load project.'); }
    finally { setLoading(false); }
  }, [id]);

  // ── Load vendor list for assign dropdown ─────────────────────────────────
  const loadVendors = useCallback(async () => {
    try {
      const res = await api.get('/vendors');
      if (res.data?.success) setVendors(res.data.vendors || []);
    } catch {}
  }, []);

  useEffect(() => { loadProject(); loadVendors(); }, [loadProject, loadVendors]);

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!isSuperAdmin) return;
    setProject(prev => ({ ...prev, status: newStatus })); // optimistic
    try {
      await api.patch(`/projects/${project.id}/status`, { status: newStatus });
    } catch { loadProject(); } // revert on failure
  };

  // ── Assign vendor ─────────────────────────────────────────────────────────
  const handleAssignVendor = async (e) => {
    e.preventDefault(); setAssignError('');
    if (!assignForm.vendorId) { setAssignError('Please select a vendor.'); return; }
    setAssignSubmitting(true);
    try {
      const res = await api.post(`/projects/${project.id}/vendors`, {
        vendorId:      assignForm.vendorId,
        taskType:      assignForm.taskType,
        assignedWords: parseInt(assignForm.assignedWords, 10) || project.wordCount || 0,
        vendorRate:    parseFloat(assignForm.vendorRate) || 0
      });
      if (res.data?.success) {
        await loadProject(); // re-fetch full project from DB
        setIsAssignModalOpen(false);
        setAssignForm({ vendorId: '', taskType: 'Translation', assignedWords: '', vendorRate: '' });
      } else { setAssignError(res.data?.message || 'Failed to assign vendor.'); }
    } catch (e) { setAssignError(e.response?.data?.message || 'Server error.'); }
    finally { setAssignSubmitting(false); }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading project hub...</div>;
  if (error)   return <div className="py-12 text-center text-red-500">{error} <Link to="/projects" className="underline text-brand-600">Back to projects</Link></div>;
  if (!project) return null;

  const clientName = project.client?.companyName || project.clientName || '—';
  const pmName     = project.projectManager?.name || '—';

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Projects Directory
        </Link>
        <div className="flex items-center gap-2">
          <Badge status={project.priority || 'MEDIUM'} />
          <Badge status={project.status || 'NEW'} />
        </div>
      </div>

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200/60 font-mono">{project.projectCode}</span>
              <h1 className="text-xl font-extrabold text-slate-900">{project.projectName}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-4">
              <span>Client: <strong className="text-slate-800">{clientName}</strong></span>
              <span>PM: <strong className="text-slate-800">{pmName}</strong></span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">{project.sourceLang} → {project.targetLang}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSuperAdmin ? (
              <select value={project.status || 'NEW'} onChange={e => handleStatusChange(e.target.value)}
                className="py-2 px-3 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg outline-none focus:border-brand-500 cursor-pointer">
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            ) : <Badge status={project.status || 'NEW'} />}
            {isSuperAdmin && (
              <Button onClick={() => { setAssignError(''); setIsAssignModalOpen(true); }} size="sm" icon={UserPlus}>
                Assign Vendor
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-t border-slate-100 mt-6 pt-4 text-xs font-semibold overflow-x-auto">
          {['overview', 'vendors', 'files', ...(!isVendor ? ['financials'] : [])].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 whitespace-nowrap capitalize transition-colors ${activeTab === tab ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {tab === 'vendors' ? `Assigned Vendors (${project.vendors?.length || 0})` :
               tab === 'files'   ? `Files (${project.files?.length || 0})` : tab}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Word Count" value={(project.wordCount || 0).toLocaleString()} subtitle="Billable words" icon={FileText} color="blue" />
            <StatCard title="Assigned Vendor" value={project.vendors?.[0]?.vendor?.name || 'Unassigned'} subtitle="Primary linguist" icon={Users} color="indigo" />
            <StatCard title="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'} subtitle="Target delivery" icon={Calendar} color="amber" />
            {!isVendor
              ? <StatCard title="Gross Margin" value={`${(project.profitMargin || 0).toFixed(1)}%`} subtitle={`Profit: ₹${(project.grossProfit || 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="emerald" />
              : <StatCard title="Status" value={project.status} subtitle="Current phase" icon={Clock} color="purple" />
            }
          </div>
          {project.notes && (
            <Card title="Project Notes">
              <p className="text-xs text-slate-700 leading-relaxed">{project.notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Vendors */}
      {activeTab === 'vendors' && (
        <Card title="Assigned Vendors" action={isSuperAdmin && <Button size="sm" onClick={() => setIsAssignModalOpen(true)} icon={Plus}>Add Vendor</Button>}>
          {project.vendors?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No vendors assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr><th className="py-2.5 px-3">Vendor</th><th className="py-2.5 px-3">Task</th><th className="py-2.5 px-3">Words</th><th className="py-2.5 px-3">Rate</th><th className="py-2.5 px-3">Total</th><th className="py-2.5 px-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.vendors.map(pv => (
                    <tr key={pv.id}>
                      <td className="py-3 px-3 font-bold text-slate-900">{pv.vendor?.name || '—'}</td>
                      <td className="py-3 px-3">{pv.taskType}</td>
                      <td className="py-3 px-3 font-mono">{(pv.assignedWords || 0).toLocaleString()} w</td>
                      <td className="py-3 px-3 font-bold text-brand-600">₹{pv.vendorRate}/w</td>
                      <td className="py-3 px-3 font-bold">₹{(pv.vendorAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3"><Badge status={pv.status || 'PENDING'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Files */}
      {activeTab === 'files' && (
        <Card title="Project Files">
          {project.files?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No files uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {project.files.map(f => (
                <div key={f.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand-600" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{f.fileName}</p>
                      <p className="text-[11px] text-slate-500">v{f.version} • {f.uploadedBy?.name}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" icon={Download}>Download</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Financials */}
      {activeTab === 'financials' && !isVendor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard title="Client Total Bill" value={`₹${(project.clientAmount || 0).toLocaleString('en-IN')}`} subtitle="Contract revenue" icon={DollarSign} color="emerald" />
          <StatCard title="Vendor Cost" value={`₹${(project.totalVendorCost || 0).toLocaleString('en-IN')}`} subtitle="Payout budget" icon={Users} color="blue" />
          <StatCard title="Gross Profit" value={`₹${(project.grossProfit || 0).toLocaleString('en-IN')}`} subtitle={`${(project.profitMargin || 0).toFixed(1)}% margin`} icon={TrendingUp} color="purple" />
        </div>
      )}

      {/* Modal: Assign Vendor */}
      {isSuperAdmin && (
        <Modal isOpen={isAssignModalOpen} onClose={() => { setIsAssignModalOpen(false); setAssignError(''); }} title="Assign Vendor to Project">
          <form onSubmit={handleAssignVendor} className="space-y-4">
            {assignError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{assignError}</div>}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vendor *</label>
              <select required value={assignForm.vendorId} onChange={e => setAssignForm({...assignForm, vendorId: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                <option value="">— Select a vendor —</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.vendorCode}) — ₹{v.ratePerWord}/w</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type *</label>
                <select value={assignForm.taskType} onChange={e => setAssignForm({...assignForm, taskType: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500">
                  <option>Translation</option><option>Proofreading</option><option>DTP</option><option>Voice Over</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Words</label>
                <input type="number" min="0" value={assignForm.assignedWords}
                  onChange={e => setAssignForm({...assignForm, assignedWords: e.target.value})}
                  placeholder={project.wordCount || 0}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Rate (₹/word)</label>
              <input type="number" step="0.01" min="0" value={assignForm.vendorRate}
                onChange={e => setAssignForm({...assignForm, vendorRate: e.target.value})}
                placeholder={vendors.find(v => v.id === assignForm.vendorId)?.ratePerWord || ''}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => { setIsAssignModalOpen(false); setAssignError(''); }}>Cancel</Button>
              <Button type="submit" loading={assignSubmitting}>Assign Vendor</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
