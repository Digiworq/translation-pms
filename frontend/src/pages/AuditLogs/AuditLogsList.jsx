import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Search, RefreshCw } from 'lucide-react';

export const AuditLogsList = () => {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/audit-logs', { params: { search, limit: 50 } });
      if (res.data?.success) setLogs(res.data.logs || []);
      else setError('Failed to load audit logs.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Immutable record of all system events and admin actions</p>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search action, user, entity..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading audit trail...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">No audit logs yet. Actions you take will appear here.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4"><Badge status={log.userRole} /></td>
                    <td className="py-3 px-4 font-bold text-brand-600 font-mono">{log.action}</td>
                    <td className="py-3 px-4 text-slate-800 font-mono">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[120px] font-mono">{log.entityId || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
