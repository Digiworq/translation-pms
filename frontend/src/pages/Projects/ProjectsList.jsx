import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, RefreshCw } from 'lucide-react';

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
            clientAmount: 30000,
            totalVendorCost: 9000,
            grossProfit: 21000,
            status: 'NEW',
            deadline: '2026-08-28T00:00:00.000Z'
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
            clientAmount: 60000,
            totalVendorCost: 22500,
            grossProfit: 37500,
            status: 'COMPLETED',
            deadline: '2026-08-22T00:00:00.000Z'
          }
        ]);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Create project ─────────────────────────────────────────────────────────
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    if (!formData.clientName.trim()) {
      setFormError('Client name is required.');
      return;
    }
    if (!formData.deadline) {
      setFormError('Deadline is required.');
      return;
    }

    setSubmitting(true);

    const wCount    = parseInt(formData.wordCount, 10)  || 0;
    const pCount    = parseInt(formData.pageCount, 10)  || 0;
    const rPerWord  = parseFloat(formData.ratePerWord)  || 0;
    const rPerPage  = parseFloat(formData.ratePerPage)  || 0;

    const payload = {
      projectName:  formData.projectName.trim(),
      clientName:   formData.clientName.trim(),
      clientContact: formData.clientContact || '',
      projectType:  formData.projectType,
      sourceLang:   formData.sourceLang,
      targetLang:   formData.targetLang,
      wordCount:    wCount,
      pageCount:    pCount,
      ratePerWord:  rPerWord,
      ratePerPage:  rPerPage,
      deadline:     formData.deadline,
      priority:     formData.priority,
      poNumber:     formData.poNumber || '',
      notes:        formData.notes    || '',
      status:       'NEW'
    };

    try {
      const res = await api.post('/projects', payload);
      if (res.data?.success) {
        // Re-fetch from DB so the list reflects exactly what MySQL stored
        await fetchProjects();
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
      } else {
        setFormError(res.data?.message || 'Failed to create project.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Server error. Could not create project.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete project ─────────────────────────────────────────────────────────
  const handleDeleteProject = async (projectId, projectCode) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`Delete project ${projectCode}?`)) return;

    try {
      await api.delete(`/projects/${projectId}`);
      // Refresh from DB
      await fetchProjects();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete project.');
    }
  };

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (projectId, newStatus) => {
    if (!isSuperAdmin) return;
    // Optimistic update
    setProjects(prev =>
      prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
    );
    try {
      await api.patch(`/projects/${projectId}/status`, { status: newStatus });
    } catch (e) {
      // Revert on failure
      fetchProjects();
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredProjects = projects.filter(p => {
    const term = search.toLowerCase().trim();
    const clientName = p.clientName || p.client?.companyName || '';
    const matchSearch = !term ||
      p.projectName?.toLowerCase().includes(term) ||
      p.projectCode?.toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term);
    return (
      matchSearch &&
      (!statusFilter      || p.status      === statusFilter) &&
      (!priorityFilter    || p.priority    === priorityFilter) &&
      (!projectTypeFilter || p.projectType === projectTypeFilter)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage translation and localization jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isSuperAdmin && (
            <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-bold text-slate-800"
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
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
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
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
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

      {/* Projects Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No matching projects"
            description="No projects match your filters."
            actionLabel={isSuperAdmin ? 'Create New Project' : null}
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Language Pair</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">{isSuperAdmin ? 'Status (Admin Control)' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      <Link to={`/projects/${proj.id}`}>{proj.projectCode}</Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {proj.projectName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {proj.clientName || proj.client?.companyName || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {proj.sourceLang} → {proj.targetLang}
                    </td>
                    <td className="py-3.5 px-4">{proj.projectType}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={proj.priority || 'MEDIUM'} />
                    </td>
                    <td className="py-3.5 px-4">
                      {isSuperAdmin ? (
                        <select
                          value={proj.status || 'NEW'}
                          onChange={e => handleStatusUpdate(proj.id, e.target.value)}
                          className={`py-1 px-2.5 text-xs font-extrabold rounded-md outline-none border transition-colors cursor-pointer ${
                            ['COMPLETED', 'DELIVERED'].includes(proj.status)
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : proj.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : proj.status === 'UNDER_REVIEW'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : proj.status === 'ASSIGNED'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="ON_HOLD">ON_HOLD</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <Badge status={proj.status || 'NEW'} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Hub
                        </Link>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteProject(proj.id, proj.projectCode)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors"
                          >
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

      {/* Create Project Modal */}
      {isSuperAdmin && (
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Create New Project">
          <form onSubmit={handleCreateProject} className="space-y-4">

            {/* Form-level error */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={e => handleFormChange('projectName', e.target.value)}
                placeholder="e.g. Q4 Legal Document Translation"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={e => handleFormChange('clientName', e.target.value)}
                  placeholder="e.g. Global Enterprise Tech Corp"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type *</label>
                <select
                  value={formData.projectType}
                  onChange={e => handleFormChange('projectType', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                >
                  <option value="Translation">Translation</option>
                  <option value="Proofreading">Proofreading</option>
                  <option value="DTP">DTP</option>
                  <option value="Voice Over">Voice Over</option>
                  <option value="Certified Translation">Certified Translation</option>
                  <option value="Interpretation">Interpretation</option>
                  <option value="Localization">Localization</option>
                  <option value="Subtitling">Subtitling</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Language *</label>
                <input
                  type="text"
                  required
                  value={formData.sourceLang}
                  onChange={e => handleFormChange('sourceLang', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Language *</label>
                <input
                  type="text"
                  required
                  value={formData.targetLang}
                  onChange={e => handleFormChange('targetLang', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Word Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wordCount}
                  onChange={e => handleFormChange('wordCount', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate / Word (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ratePerWord}
                  onChange={e => handleFormChange('ratePerWord', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline *</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={e => handleFormChange('deadline', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => handleFormChange('priority', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO Number</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={e => handleFormChange('poNumber', e.target.value)}
                placeholder="e.g. PO-2026-0011"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => handleFormChange('notes', e.target.value)}
                rows={2}
                placeholder="Any special instructions..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
