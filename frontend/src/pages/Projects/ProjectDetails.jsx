import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, StatCard } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import {
  ArrowLeft, Calendar, DollarSign, FileText, Users, TrendingUp, Clock,
  Download, Plus, UserPlus, CheckCircle2, Trash2, RefreshCw, Upload, UploadCloud, Eye
} from 'lucide-react';

export const ProjectDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
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
    vendorId: '', taskType: 'Translation', assignedWords: '', vendorRate: '1.50'
  });

  // File Upload State
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileSubmitting, setFileSubmitting] = useState(false);
  const [fileForm, setFileForm] = useState({
    fileName: '', category: 'Source Document', fileType: 'DOCX', fileUrl: '', version: 'v1.0', notes: ''
  });

  // ── Load project from API with LocalStorage fallback ─────────────────────
  const loadProject = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data?.success && res.data.project) {
        setProject(res.data.project);
        setAuditLogs(res.data.auditLogs || []);
        setLoading(false);
        return;
      }
    } catch (e) {}

    // Local Storage / Default Fallback for new projects
    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const found = list.find(p => String(p.id) === String(id) || String(p.projectCode) === String(id));
        if (found) {
          setProject(found);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setError('Could not load project.');
    setLoading(false);
  }, [id]);

  // ── Load vendor list for assign dropdown ─────────────────────────────────
  const loadVendors = useCallback(async () => {
    try {
      const res = await api.get('/vendors');
      if (res.data?.success && Array.isArray(res.data.vendors)) {
        setVendors(res.data.vendors);
      } else {
        const saved = localStorage.getItem('pms_vendors_list');
        if (saved) setVendors(JSON.parse(saved));
        else {
          setVendors([
            { id: 'vnd-01', vendorCode: 'VND-0001', name: 'Hans Gruber', specialization: 'Technical, Legal', ratePerWord: 1.50 },
            { id: 'vnd-02', vendorCode: 'VND-0002', name: 'Carlos Gomez', specialization: 'Medical', ratePerWord: 1.50 }
          ]);
        }
      }
    } catch {
      try {
        const saved = localStorage.getItem('pms_vendors_list');
        if (saved) setVendors(JSON.parse(saved));
        else {
          setVendors([
            { id: 'vnd-01', vendorCode: 'VND-0001', name: 'Hans Gruber', specialization: 'Technical, Legal', ratePerWord: 1.50 },
            { id: 'vnd-02', vendorCode: 'VND-0002', name: 'Carlos Gomez', specialization: 'Medical', ratePerWord: 1.50 }
          ]);
        }
      } catch (err) {}
    }
  }, []);

  useEffect(() => { loadProject(); loadVendors(); }, [loadProject, loadVendors]);

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!isSuperAdmin) return;
    const updated = { ...project, status: newStatus };
    setProject(updated);
    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const updatedList = list.map(p => (String(p.id) === String(project.id) || String(p.projectCode) === String(project.projectCode)) ? updated : p);
        localStorage.setItem('pms_projects_list', JSON.stringify(updatedList));
      }
    } catch (e) {}

    try {
      await api.patch(`/projects/${project.id}/status`, { status: newStatus });
    } catch (e) {}
  };

  // ── Delete Project (Super Admin Only) ────────────────────────────────────
  const handleDeleteProject = async () => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Are you sure you want to delete ${project.projectCode} (${project.projectName})? This cannot be undone.`)) return;

    try {
      await api.delete(`/projects/${project.id}`);
    } catch (e) {}

    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const updatedList = list.filter(p => String(p.id) !== String(project.id) && String(p.projectCode) !== String(project.projectCode));
        localStorage.setItem('pms_projects_list', JSON.stringify(updatedList));
      }
    } catch (e) {}

    navigate('/projects');
  };

  // ── Assign Single Vendor (1 Vendor per Project Rule) ────────────────────
  const handleAssignVendor = async (e) => {
    e.preventDefault(); setAssignError('');
    if (!assignForm.vendorId) { setAssignError('Please select a vendor.'); return; }
    setAssignSubmitting(true);

    const selectedVendor = vendors.find(v => String(v.id) === String(assignForm.vendorId) || String(v.vendorCode) === String(assignForm.vendorId)) || {
      id: assignForm.vendorId,
      name: 'Hans Gruber',
      vendorCode: 'VND-0001',
      ratePerWord: 1.50
    };

    const vRate  = parseFloat(assignForm.vendorRate) || selectedVendor.ratePerWord || 1.50;
    const vWords = parseInt(assignForm.assignedWords, 10) || project.wordCount || 1000;
    const vendorCost = vRate * vWords;

    const singleAssignment = {
      id: `pv-${Date.now()}`,
      vendorId: assignForm.vendorId,
      vendor: selectedVendor,
      taskType: assignForm.taskType || 'Translation',
      assignedWords: vWords,
      vendorRate: vRate,
      vendorAmount: vendorCost,
      status: 'ASSIGNED'
    };

    try {
      await api.post(`/projects/${project.id}/vendors`, {
        vendorId:      assignForm.vendorId,
        taskType:      assignForm.taskType,
        assignedWords: vWords,
        vendorRate:    vRate
      });
    } catch (e) {}

    const updatedVendors = [singleAssignment];
    const clientAmount = Number(project.clientAmount || 0);
    const newGrossProfit = Math.max(0, clientAmount - vendorCost);

    const updatedProject = {
      ...project,
      vendors: updatedVendors,
      totalVendorCost: vendorCost,
      grossProfit: newGrossProfit,
      translatorName: selectedVendor.name,
      status: project.status === 'NEW' ? 'IN_PROGRESS' : project.status
    };

    setProject(updatedProject);

    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const updatedList = list.map(p => (String(p.id) === String(project.id) || String(p.projectCode) === String(project.projectCode)) ? updatedProject : p);
        localStorage.setItem('pms_projects_list', JSON.stringify(updatedList));
      }
    } catch (e) {}

    setIsAssignModalOpen(false);
    setAssignForm({ vendorId: '', taskType: 'Translation', assignedWords: '', vendorRate: '1.50' });
    setAssignSubmitting(false);
  };

  // ── Upload Project Asset File ─────────────────────────────────────────────
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!fileForm.fileName) return;
    setFileSubmitting(true);

    const newFile = {
      id: `doc-${Date.now()}`,
      fileName: fileForm.fileName,
      category: fileForm.category,
      fileType: fileForm.fileType,
      fileUrl: fileForm.fileUrl || '#',
      uploadedBy: user?.name || 'Executive Super Admin',
      uploadedAt: new Date().toISOString().split('T')[0],
      version: fileForm.version || 'v1.0',
      notes: fileForm.notes || ''
    };

    const updatedFiles = [newFile, ...(project.files || [])];
    const updatedProject = { ...project, files: updatedFiles };
    setProject(updatedProject);

    // Save to local cache
    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const updatedList = list.map(p => (String(p.id) === String(project.id) || String(p.projectCode) === String(project.projectCode)) ? updatedProject : p);
        localStorage.setItem('pms_projects_list', JSON.stringify(updatedList));
      }
    } catch (e) {}

    setIsFileModalOpen(false);
    setFileForm({ fileName: '', category: 'Source Document', fileType: 'DOCX', fileUrl: '', version: 'v1.0', notes: '' });
    setFileSubmitting(false);
  };

  const handleDeleteFile = (fileId) => {
    const updatedFiles = (project.files || []).filter(f => f.id !== fileId);
    const updatedProject = { ...project, files: updatedFiles };
    setProject(updatedProject);

    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        const list = JSON.parse(saved);
        const updatedList = list.map(p => (String(p.id) === String(project.id) || String(p.projectCode) === String(project.projectCode)) ? updatedProject : p);
        localStorage.setItem('pms_projects_list', JSON.stringify(updatedList));
      }
    } catch (e) {}
  };

  if (loading) return <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading project hub...</div>;
  if (error)   return <div className="py-12 text-center text-red-500 font-medium text-sm">{error} <Link to="/projects" className="underline text-brand-600">Back to projects</Link></div>;
  if (!project) return null;

  const clientName = project.client?.companyName || project.clientName || '—';
  const pmName     = project.projectManager?.name || 'Executive Super Admin';

  const assignedLinguist = project.vendors?.[0] || null;
  const projectFiles = project.files || [];

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
          {isSuperAdmin && (
            <button
              onClick={handleDeleteProject}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
              title="Delete Project (Super Admin Only)"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Hero card */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6 mb-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded border border-brand-800">
              {project.projectCode}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">{project.projectName}</h1>
            <p className="text-xs text-slate-400 mt-1">Client: <strong className="text-slate-200">{clientName}</strong></p>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Set Status:</span>
              {['NEW', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'].map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all ${
                    project.status === st ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Language Pair</span>
            <strong className="text-white text-sm font-mono mt-0.5 block">{project.sourceLang} → {project.targetLang}</strong>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Word Count</span>
            <strong className="text-white text-sm font-mono mt-0.5 block">{(project.wordCount || 0).toLocaleString()} words</strong>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Billing</span>
            <strong className="text-emerald-400 text-sm font-mono mt-0.5 block">₹{(project.clientAmount || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Deadline</span>
            <strong className="text-white text-sm font-mono mt-0.5 block">
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
            </strong>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {['overview', 'vendors', 'files', 'audit'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Project Specification</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service Category:</span>
                <strong className="text-slate-900">{project.projectType || 'Translation'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Project Manager:</span>
                <strong className="text-slate-900">{pmName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rate / Unit:</span>
                <strong className="text-slate-900">₹{project.ratePerWord || project.ratePerPage || 1.50}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Vendor Expenses:</span>
                <strong className="text-rose-600 font-bold">₹{(project.totalVendorCost || 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Estimated Gross Profit:</span>
                <strong className="text-emerald-600 font-bold">₹{(project.grossProfit !== undefined ? project.grossProfit : (project.clientAmount - (project.totalVendorCost || 0))).toLocaleString()}</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Assigned Linguist (1 Vendor per Project)</h3>
              {isSuperAdmin && (
                <Button onClick={() => setIsAssignModalOpen(true)} size="sm" icon={assignedLinguist ? RefreshCw : UserPlus}>
                  {assignedLinguist ? 'Reassign / Change Vendor' : 'Assign Vendor'}
                </Button>
              )}
            </div>
            {!assignedLinguist ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No vendor assigned yet. Click Assign Vendor to link 1 translator.
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {assignedLinguist.vendor?.name || assignedLinguist.vendorName || project.translatorName || 'Assigned Translator'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {assignedLinguist.taskType || 'Translation'} • {(assignedLinguist.assignedWords || project.wordCount || 0).toLocaleString()} units @ ₹{assignedLinguist.vendorRate || 1.50}
                    </p>
                  </div>
                  <Badge status={assignedLinguist.status || 'ASSIGNED'} />
                </div>
                <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80 font-mono">
                  <span>Vendor Payout Cost:</span>
                  <strong className="text-rose-600">
                    ₹{(assignedLinguist.vendorAmount || ((assignedLinguist.assignedWords || project.wordCount || 0) * (assignedLinguist.vendorRate || 1.50))).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'vendors' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Assigned Linguist Detail</h3>
            {isSuperAdmin && (
              <Button onClick={() => setIsAssignModalOpen(true)} size="sm" icon={assignedLinguist ? RefreshCw : UserPlus}>
                {assignedLinguist ? 'Reassign / Change Vendor' : 'Assign Vendor'}
              </Button>
            )}
          </div>
          {!assignedLinguist ? (
            <div className="py-12 text-center text-xs text-slate-400">No vendor assigned to this project yet.</div>
          ) : (
            <div className="py-3 flex items-center justify-between text-xs border-b">
              <div>
                <h4 className="font-bold text-slate-900">{assignedLinguist.vendor?.name || project.translatorName}</h4>
                <p className="text-slate-500">{assignedLinguist.taskType || 'Translation'} • {(assignedLinguist.assignedWords || project.wordCount || 0).toLocaleString()} words • ₹{assignedLinguist.vendorRate || 1.50}/w</p>
              </div>
              <Badge status={assignedLinguist.status || 'ASSIGNED'} />
            </div>
          )}
        </Card>
      )}

      {/* FILES TAB — Complete Interactive Asset Uploader & Repository */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Project Asset Documents & Deliverables</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload source files, reference glossaries, and finished translated deliverables for {project.projectCode}</p>
              </div>
              <Button onClick={() => setIsFileModalOpen(true)} icon={UploadCloud}>
                + Upload New File / Asset
              </Button>
            </div>

            {projectFiles.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">No files uploaded to this project yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Upload source documents or completed translation files for team access</p>
                </div>
                <Button onClick={() => setIsFileModalOpen(true)} size="sm" icon={Plus}>
                  Upload First File
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Document / File Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">File Format</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4 text-center">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {projectFiles.map(file => (
                      <tr key={file.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-600" /> {file.fileName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                            {file.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{file.fileType}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{file.version || 'v1.0'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{file.uploadedBy}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">{file.uploadedAt}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={file.fileUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {activeTab === 'audit' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Project Activity Trail</h3>
          <div className="py-8 text-center text-xs text-slate-400">Audit logs & status updates trail for {project.projectCode}.</div>
        </Card>
      )}

      {/* Assign Vendor Modal (Enforces 1 Vendor per Project Rule) */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={assignedLinguist ? "Reassign / Change Vendor" : "Assign Single Vendor to Project"}>
        <form onSubmit={handleAssignVendor} className="space-y-4">
          {assignError && <div className="bg-red-50 text-red-700 text-xs p-3 rounded">{assignError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vendor *</label>
            <select required value={assignForm.vendorId} onChange={e => setAssignForm({...assignForm, vendorId: e.target.value})}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium">
              <option value="">— Select translator —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.vendorCode || 'VND'})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
              <select value={assignForm.taskType} onChange={e => setAssignForm({...assignForm, taskType: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium">
                <option value="Translation">Translation</option>
                <option value="Proofreading">Proofreading</option>
                <option value="DTP">DTP</option>
                <option value="Transcription">Transcription</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Words/Units</label>
              <input type="number" value={assignForm.assignedWords} onChange={e => setAssignForm({...assignForm, assignedWords: e.target.value})}
                placeholder={project.wordCount || 1000} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Pay Rate (₹)</label>
              <input type="number" step="0.1" value={assignForm.vendorRate} onChange={e => setAssignForm({...assignForm, vendorRate: e.target.value})}
                placeholder="1.50" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold text-rose-600" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={assignSubmitting}>
              {assignedLinguist ? 'Confirm Reassignment' : 'Assign Vendor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Asset File Modal */}
      <Modal isOpen={isFileModalOpen} onClose={() => setIsFileModalOpen(false)} title="Upload Project Asset / Deliverable File">
        <form onSubmit={handleUploadFile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document / File Name *</label>
            <input
              type="text"
              required
              value={fileForm.fileName}
              onChange={e => setFileForm({ ...fileForm, fileName: e.target.value })}
              placeholder="e.g. Master_Source_Document_English.docx"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Category</label>
              <select
                value={fileForm.category}
                onChange={e => setFileForm({ ...fileForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"
              >
                <option value="Source Document">Source Document</option>
                <option value="Translated Deliverable">Translated Deliverable</option>
                <option value="Reference Material">Reference Material</option>
                <option value="Glossary / Termbase">Glossary / Termbase</option>
                <option value="Proofreading Audit">Proofreading Audit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Format / Extension</label>
              <select
                value={fileForm.fileType}
                onChange={e => setFileForm({ ...fileForm, fileType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"
              >
                <option value="DOCX">Word Document (.docx)</option>
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
                <option value="ZIP">Archive Package (.zip)</option>
                <option value="TXT">Plain Text (.txt)</option>
                <option value="PNG">Image Asset (.png)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Version</label>
              <input
                type="text"
                value={fileForm.version}
                onChange={e => setFileForm({ ...fileForm, version: e.target.value })}
                placeholder="v1.0 Final"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Link / Direct URL (optional)</label>
              <input
                type="text"
                value={fileForm.fileUrl}
                onChange={e => setFileForm({ ...fileForm, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/file/..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={fileForm.notes}
              onChange={e => setFileForm({ ...fileForm, notes: e.target.value })}
              placeholder="Internal file instructions..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsFileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={fileSubmitting} icon={Upload}>
              Upload File Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
