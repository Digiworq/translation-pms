import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { EmptyState } from '../../components/UI/EmptyState';
import { Plus, Search, FileText, Download, ExternalLink, Trash2, RefreshCw, FileSpreadsheet } from 'lucide-react';

const EMPTY_FORM = {
  projectCode: 'PRJ-2026-0001',
  fileName: '',
  fileType: 'PDF',
  fileUrl: 'https://cdn.vismatranslation.com/docs/sample_doc.pdf',
  version: 'v1.0',
  status: 'DRAFT',
  notes: ''
};

export const DocumentsList = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('pms_documents_list');
      if (saved) {
        setDocuments(JSON.parse(saved));
      } else {
        setDocuments([
          {
            id: 'doc-01',
            documentCode: 'DOC-2026-0001',
            projectCode: 'PRJ-2026-0001',
            fileName: 'German_Localization_Source_v1.docx',
            fileType: 'DOCX',
            fileUrl: 'https://cdn.lingotech.com/docs/German_Localization_Source_v1.docx',
            receivedDate: '2026-08-21',
            version: 'v1.0',
            status: 'TRANSLATED',
            notes: 'Source document received from client Alex Mercer.'
          },
          {
            id: 'doc-02',
            documentCode: 'DOC-2026-0002',
            projectCode: 'PRJ-2026-0002',
            fileName: 'BioHealth_Clinical_Protocol_Final.pdf',
            fileType: 'PDF',
            fileUrl: 'https://cdn.lingotech.com/docs/BioHealth_Clinical_Protocol_Final.pdf',
            receivedDate: '2026-08-15',
            version: 'v2.0',
            status: 'FINAL',
            notes: 'Certified & stamped final translation delivered.'
          }
        ]);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.fileName.trim()) { setFormError('Document name is required.'); return; }
    setSubmitting(true);

    const newDoc = {
      id: `doc-${Date.now()}`,
      documentCode: `DOC-2026-${String(documents.length + 1).padStart(4, '0')}`,
      projectCode: formData.projectCode || 'PRJ-2026-0001',
      fileName: formData.fileName,
      fileType: formData.fileType || 'PDF',
      fileUrl: formData.fileUrl || 'https://cdn.lingotech.com/docs/file.pdf',
      receivedDate: new Date().toISOString().split('T')[0],
      version: formData.version || 'v1.0',
      status: formData.status || 'DRAFT',
      notes: formData.notes || ''
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('pms_documents_list', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setSubmitting(false);
  };

  const handleDelete = (id) => {
    if (!isSuperAdmin) return;
    if (!window.confirm('Delete document record?')) return;
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('pms_documents_list', JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    const headers = [
      'Document ID', 'Project ID', 'Document Name', 'File Type',
      'File Location / Link', 'Received Date', 'Version', 'Status', 'Notes'
    ];

    const rows = filteredDocs.map(d => [
      d.documentCode,
      d.projectCode,
      `"${(d.fileName || '').replace(/"/g, '""')}"`,
      d.fileType,
      d.fileUrl,
      d.receivedDate ? new Date(d.receivedDate).toLocaleDateString() : '',
      d.version,
      d.status,
      `"${(d.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Documents_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = documents.filter(d => {
    const t = search.toLowerCase();
    return !t ||
      d.documentCode?.toLowerCase().includes(t) ||
      d.projectCode?.toLowerCase().includes(t) ||
      d.fileName?.toLowerCase().includes(t) ||
      d.fileType?.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Document & Asset Repository</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Project translation files, version control & cloud storage links</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="secondary" icon={FileSpreadsheet}>
            Export Excel (CSV)
          </Button>
          <Button onClick={() => { setFormError(''); setIsModalOpen(true); }} icon={Plus}>Upload Document</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search document ID, project code, filename..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium" />
        </div>
      </Card>

      {/* Documents Table — Exact 9 Columns Specified by Client */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium text-sm">Loading document repository...</div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState title="No documents uploaded" description="Upload project translation assets."
            actionLabel="Upload Document" onAction={() => setIsModalOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Document ID</th>
                  <th className="py-3.5 px-4">Project ID</th>
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4 text-center">File Type</th>
                  <th className="py-3.5 px-4">File Location / Link</th>
                  <th className="py-3.5 px-4 text-center">Received Date</th>
                  <th className="py-3.5 px-4 text-center">Version</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    {/* 1. Document ID */}
                    <td className="py-3.5 px-4 font-bold text-brand-600">{doc.documentCode}</td>
                    {/* 2. Project ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{doc.projectCode}</td>
                    {/* 3. Document Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate" title={doc.fileName}>{doc.fileName}</td>
                    {/* 4. File Type */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                        {doc.fileType}
                      </span>
                    </td>
                    {/* 5. File Location / Link */}
                    <td className="py-3.5 px-4 font-mono text-brand-600">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Download File
                      </a>
                    </td>
                    {/* 6. Received Date */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      {doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() : '—'}
                    </td>
                    {/* 7. Version */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{doc.version || 'v1.0'}</td>
                    {/* 8. Status */}
                    <td className="py-3.5 px-4 text-center"><Badge status={doc.status || 'DRAFT'} /></td>
                    {/* 9. Notes */}
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={doc.notes}>{doc.notes || '—'}</td>
                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(''); }} title="Upload Project Document">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{formError}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID *</label>
              <input type="text" required value={formData.projectCode} onChange={e => setFormData({...formData, projectCode: e.target.value})}
                placeholder="PRJ-2026-0001" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Name *</label>
              <input type="text" required value={formData.fileName} onChange={e => setFormData({...formData, fileName: e.target.value})}
                placeholder="e.g. Legal_Agreement_v1.pdf" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Type</label>
              <select value={formData.fileType} onChange={e => setFormData({...formData, fileType: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono">
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
                <option value="ZIP">ZIP</option>
                <option value="TMX">TMX</option>
                <option value="XLIFF">XLIFF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version</label>
              <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}
                placeholder="v1.0" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold">
                <option value="DRAFT">DRAFT</option>
                <option value="IN_TRANSLATION">IN TRANSLATION</option>
                <option value="TRANSLATED">TRANSLATED</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="FINAL">FINAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">File Location / Storage Link URL</label>
            <input type="url" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})}
              placeholder="https://cdn.lingotech.com/docs/file.pdf" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Document version notes & client instructions..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setFormError(''); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>Upload Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsList;
