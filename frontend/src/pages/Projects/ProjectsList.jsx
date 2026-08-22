import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

const EMPTY_FORM = {
  projectName: '',
  clientName: '',
  clientContact: '',
  projectType: 'Translation',
  sourceLang: 'English',
  targetLang: 'German',
  wordCount: 1000,
  pageCount: 0,
  ratePerWord: 2.50,
  ratePerPage: 0,
  rateUnit: 'Per Word',
  translatorName: '',
  reviewerName: '',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  priority: 'MEDIUM',
  poNumber: '',
  notes: ''
};

export const ProjectsList = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filters
  const [search, setSearch]               = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('create') === 'true');
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  // ── Fetch projects from MySQL via API with silent backend-off fallback ─────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects');
      if (res.data?.success && Array.isArray(res.data.projects)) {
        setProjects(res.data.projects);
        localStorage.setItem('pms_projects_list', JSON.stringify(res.data.projects));
        setLoading(false);
        return;
      }
    } catch (e) {}

    // Fallback to local storage or defaults when backend is OFF
    try {
      const saved = localStorage.getItem('pms_projects_list');
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        setProjects([
          {
            id: 'prj-1',
            projectCode: 'PRJ-2026-0001',
            projectName: 'Q3 Enterprise Software Manual Localization',
            clientName: 'Global Enterprise Tech Corp',
            projectType: 'Translation',
            sourceLang: 'English',
            targetLang: 'German',
            wordCount: 10000,
            pageCount: 25,
            ratePerWord: 3.00,
            rateUnit: 'Per Word',
            clientAmount: 30000,
            totalVendorCost: 9000,
            outstandingAmount: 30000,
            paymentStatus: 'PENDING',
            status: 'NEW',
            priority: 'MEDIUM',
            translatorName: 'Hans Gruber',
            reviewerName: 'Anna Schmidt',
            date: '2026-08-21',
            deadline: '2026-08-28',
            deliveredDate: '—',
            notes: 'High priority German localization.'
          },
          {
            id: 'prj-2',
            projectCode: 'PRJ-2026-0002',
            projectName: 'BioHealth Clinical Protocol Translation & Review',
            clientName: 'BioHealth Solutions Inc.',
            projectType: 'Certified Translation',
            sourceLang: 'English',
            targetLang: 'Spanish',
            wordCount: 15000,
            pageCount: 40,
            ratePerWord: 4.00,
            rateUnit: 'Per Word',
            clientAmount: 60000,
            totalVendorCost: 22500,
            outstandingAmount: 0,
            paymentStatus: 'PAID',
            status: 'COMPLETED',
            priority: 'HIGH',
            translatorName: 'Carlos Gomez',
            reviewerName: 'Maria Silva',
            date: '2026-08-15',
            deadline: '2026-08-22',
            deliveredDate: '2026-08-21',
            notes: 'Certified clinical translation completed.'
          }
        ]);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle Project Creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/projects', formData);
      if (res.data?.success) {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        fetchProjects();
        return;
      }
    } catch (err) {}

    // Local fallback creation
    const newProj = {
      id: `prj-${Date.now()}`,
      projectCode: `PRJ-2026-${String(projects.length + 1).padStart(4, '0')}`,
      projectName: formData.projectName,
      clientName: formData.clientName || 'Direct Client',
      projectType: formData.projectType,
      sourceLang: formData.sourceLang,
      targetLang: formData.targetLang,
      wordCount: Number(formData.wordCount),
      pageCount: Number(formData.pageCount),
      ratePerWord: Number(formData.ratePerWord),
      rateUnit: formData.rateUnit || 'Per Word',
      clientAmount: Number(formData.wordCount) * Number(formData.ratePerWord),
      totalVendorCost: Number(formData.wordCount) * 1.5,
      outstandingAmount: Number(formData.wordCount) * Number(formData.ratePerWord),
      paymentStatus: 'PENDING',
      status: 'NEW',
      priority: formData.priority,
      translatorName: formData.translatorName || 'Unassigned',
      reviewerName: formData.reviewerName || 'Unassigned',
      date: new Date().toISOString().split('T')[0],
      deadline: formData.deadline,
      deliveredDate: '—',
      notes: formData.notes || ''
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    localStorage.setItem('pms_projects_list', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setSubmitting(false);
  };

  // Handle Quick Status Change
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await api.patch(`/projects/${projectId}`, { status: newStatus });
    } catch (e) {}

    const updated = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    setProjects(updated);
    localStorage.setItem('pms_projects_list', JSON.stringify(updated));
  };

  // Export Table to CSV / Excel Format
  const handleExportCSV = () => {
    const headers = [
      'Project ID', 'Client Name', 'Source Language', 'Target Language',
      'Document Name', 'Document Type', 'Pages', 'Words', 'Rate', 'Rate Unit',
      'Status', 'Priority', 'Received Date', 'Due Date', 'Translator', 'Reviewer',
      'Total Amount', 'Balance Due', 'Payment Status', 'Delivered Date', 'Notes'
    ];

    const rows = filteredProjects.map(p => [
      p.projectCode,
      p.clientName || p.client?.companyName || '',
      p.sourceLang,
      p.targetLang,
      p.projectName,
      p.projectType,
      p.pageCount || 0,
      p.wordCount || 0,
      p.ratePerWord || p.ratePerPage || 0,
      p.rateUnit || 'Per Word',
      p.status,
      p.priority,
      p.date ? new Date(p.date).toLocaleDateString() : '',
      p.deadline ? new Date(p.deadline).toLocaleDateString() : '',
      p.translatorName || p.vendors?.[0]?.vendor?.name || 'Unassigned',
      p.reviewerName || 'Unassigned',
      p.clientAmount || 0,
      p.outstandingAmount || 0,
      p.paymentStatus || 'PENDING',
      p.deliveredDate || '—',
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      (p.projectCode && p.projectCode.toLowerCase().includes(search.toLowerCase())) ||
      (p.projectName && p.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesPriority = !priorityFilter || p.priority === priorityFilter;
    const matchesType = !projectTypeFilter || p.projectType === projectTypeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Translation Projects Master</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Full enterprise operations table & multi-attribute tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="secondary" icon={FileSpreadsheet}>
            Export Excel (CSV)
          </Button>
          {isSuperAdmin && (
            <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code, name, client..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-semibold text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
          <select
            value={projectTypeFilter}
            onChange={e => setProjectTypeFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium"
          >
            <option value="">All Service Types</option>
            <option value="Translation">Translation</option>
            <option value="Proofreading">Proofreading</option>
            <option value="DTP">DTP</option>
            <option value="Voice Over">Voice Over</option>
            <option value="Interpretation">Interpretation</option>
            <option value="Localization">Localization</option>
            <option value="Certified Translation">Certified Translation</option>
            <option value="Subtitling">Subtitling</option>
          </select>
        </div>
      </Card>

      {/* Projects Table — Exact 21 Columns Specified by Client */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading projects database...</div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No matching projects"
            description="No projects match your filters."
            actionLabel={isSuperAdmin ? 'Create New Project' : null}
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-3">Project ID</th>
                  <th className="py-3.5 px-3">Client Name</th>
                  <th className="py-3.5 px-3">Source Lang</th>
                  <th className="py-3.5 px-3">Target Lang</th>
                  <th className="py-3.5 px-3">Document Name</th>
                  <th className="py-3.5 px-3">Doc Type</th>
                  <th className="py-3.5 px-3 text-center">Pages</th>
                  <th className="py-3.5 px-3 text-center">Words</th>
                  <th className="py-3.5 px-3 text-right">Rate</th>
                  <th className="py-3.5 px-3 text-center">Rate Unit</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Priority</th>
                  <th className="py-3.5 px-3 text-center">Rec. Date</th>
                  <th className="py-3.5 px-3 text-center">Due Date</th>
                  <th className="py-3.5 px-3">Translator</th>
                  <th className="py-3.5 px-3">Reviewer</th>
                  <th className="py-3.5 px-3 text-right">Total Amount</th>
                  <th className="py-3.5 px-3 text-right">Balance Due</th>
                  <th className="py-3.5 px-3 text-center">Payment Status</th>
                  <th className="py-3.5 px-3 text-center">Delivered Date</th>
                  <th className="py-3.5 px-3">Notes</th>
                  <th className="py-3.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                    {/* 1. Project ID */}
                    <td className="py-3.5 px-3 font-bold text-brand-600">
                      <Link to={`/projects/${proj.id}`}>{proj.projectCode}</Link>
                    </td>

                    {/* 2. Client Name */}
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {proj.clientName || proj.client?.companyName || '—'}
                    </td>

                    {/* 3. Source Lang */}
                    <td className="py-3.5 px-3 font-mono text-slate-700">{proj.sourceLang}</td>

                    {/* 4. Target Lang */}
                    <td className="py-3.5 px-3 font-mono text-slate-700">{proj.targetLang}</td>

                    {/* 5. Document Name */}
                    <td className="py-3.5 px-3 max-w-xs truncate font-semibold text-slate-800" title={proj.projectName}>
                      {proj.projectName}
                    </td>

                    {/* 6. Document Type */}
                    <td className="py-3.5 px-3 text-slate-600">{proj.projectType}</td>

                    {/* 7. Pages */}
                    <td className="py-3.5 px-3 text-center font-mono">{proj.pageCount || 0}</td>

                    {/* 8. Words */}
                    <td className="py-3.5 px-3 text-center font-mono">{proj.wordCount ? proj.wordCount.toLocaleString() : 0}</td>

                    {/* 9. Rate */}
                    <td className="py-3.5 px-3 text-right font-mono">₹{proj.ratePerWord || proj.ratePerPage || 0}</td>

                    {/* 10. Rate Unit */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                        {proj.rateUnit || 'Per Word'}
                      </span>
                    </td>

                    {/* 11. Status */}
                    <td className="py-3.5 px-3 text-center">
                      {isSuperAdmin ? (
                        <select
                          value={proj.status}
                          onChange={e => handleStatusChange(proj.id, e.target.value)}
                          className="text-[11px] font-extrabold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 outline-none text-slate-800"
                        >
                          <option value="NEW">NEW</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="ON_HOLD">ON HOLD</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <Badge status={proj.status} />
                      )}
                    </td>

                    {/* 12. Priority */}
                    <td className="py-3.5 px-3 text-center"><Badge status={proj.priority} /></td>

                    {/* 13. Received Date */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                      {proj.date ? new Date(proj.date).toLocaleDateString() : '—'}
                    </td>

                    {/* 14. Due Date */}
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-800">
                      {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : '—'}
                    </td>

                    {/* 15. Translator */}
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      {proj.translatorName || proj.vendors?.[0]?.vendor?.name || 'Unassigned'}
                    </td>

                    {/* 16. Reviewer */}
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      {proj.reviewerName || 'Unassigned'}
                    </td>

                    {/* 17. Total Amount */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      ₹{(proj.clientAmount || 0).toLocaleString()}
                    </td>

                    {/* 18. Balance Due */}
                    <td className="py-3.5 px-3 text-right font-bold text-amber-600">
                      ₹{(proj.outstandingAmount || 0).toLocaleString()}
                    </td>

                    {/* 19. Payment Status */}
                    <td className="py-3.5 px-3 text-center"><Badge status={proj.paymentStatus || 'PENDING'} /></td>

                    {/* 20. Delivered Date */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                      {proj.deliveredDate || '—'}
                    </td>

                    {/* 21. Notes */}
                    <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate" title={proj.notes}>
                      {proj.notes || '—'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/projects/${proj.id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 inline-block"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Master Translation Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document / Project Name *</label>
            <input
              type="text"
              required
              value={formData.projectName}
              onChange={e => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="e.g. Annual Financial Audit Report Localization"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Global Tech Corp"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Type *</label>
              <select
                value={formData.projectType}
                onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-900"
              >
                <option value="Translation">Translation</option>
                <option value="Proofreading">Proofreading</option>
                <option value="DTP">DTP</option>
                <option value="Voice Over">Voice Over</option>
                <option value="Interpretation">Interpretation</option>
                <option value="Localization">Localization</option>
                <option value="Certified Translation">Certified Translation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Source Language *</label>
              <input
                type="text"
                required
                value={formData.sourceLang}
                onChange={e => setFormData({ ...formData, sourceLang: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Language *</label>
              <input
                type="text"
                required
                value={formData.targetLang}
                onChange={e => setFormData({ ...formData, targetLang: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Words</label>
              <input
                type="number"
                value={formData.wordCount}
                onChange={e => setFormData({ ...formData, wordCount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Pages</label>
              <input
                type="number"
                value={formData.pageCount}
                onChange={e => setFormData({ ...formData, pageCount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rate (₹)</label>
              <input
                type="number"
                step="0.1"
                value={formData.ratePerWord}
                onChange={e => setFormData({ ...formData, ratePerWord: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rate Unit</label>
              <select
                value={formData.rateUnit}
                onChange={e => setFormData({ ...formData, rateUnit: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold"
              >
                <option value="Per Word">Per Word</option>
                <option value="Per Page">Per Page</option>
                <option value="Per Hour">Per Hour</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Translator</label>
              <input
                type="text"
                value={formData.translatorName}
                onChange={e => setFormData({ ...formData, translatorName: e.target.value })}
                placeholder="e.g. Hans Gruber"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Reviewer</label>
              <input
                type="text"
                value={formData.reviewerName}
                onChange={e => setFormData({ ...formData, reviewerName: e.target.value })}
                placeholder="e.g. Anna Schmidt"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-900"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes / Instructions</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Deliver as certified PDF with stamp."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsList;
