import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Search, ShieldCheck, Clock, User as UserIcon } from 'lucide-react';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-101',
    timestamp: new Date().toISOString(),
    userName: 'Executive Super Admin',
    userRole: 'SUPER_ADMIN',
    action: 'CREATE_PROJECT',
    entity: 'PROJECT',
    entityId: 'PRJ-2026-5270',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userName: 'Executive Super Admin',
    userRole: 'SUPER_ADMIN',
    action: 'UPDATE_PROJECT_STATUS',
    entity: 'PROJECT',
    entityId: 'PRJ-2026-0002',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    userName: 'Executive Super Admin',
    userRole: 'SUPER_ADMIN',
    action: 'ASSIGN_TRANSLATOR',
    entity: 'VENDOR_ASSIGNMENT',
    entityId: 'VND-0001',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    userName: 'Executive Super Admin',
    userRole: 'SUPER_ADMIN',
    action: 'CREATE_CLIENT_ACCOUNT',
    entity: 'CLIENT',
    entityId: 'CLT-0004',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    userName: 'Executive Super Admin',
    userRole: 'SUPER_ADMIN',
    action: 'GENERATE_INVOICE',
    entity: 'INVOICE',
    entityId: 'INV-2026-0001',
    ipAddress: '127.0.0.1'
  }
];

export const AuditLogsList = () => {
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/audit-logs?search=${encodeURIComponent(search)}`);
      if (res.data && res.data.success && Array.isArray(res.data.logs) && res.data.logs.length > 0) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      l.action?.toLowerCase().includes(term) ||
      l.userName?.toLowerCase().includes(term) ||
      l.entity?.toLowerCase().includes(term) ||
      l.entityId?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-0.5">Immutable record of system events, security mutations, and administrative actions</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user, entity ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
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
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">{log.userName}</td>
                    <td className="py-3 px-4 font-sans"><Badge status={log.userRole} /></td>
                    <td className="py-3 px-4 font-bold text-brand-600">{log.action}</td>
                    <td className="py-3 px-4 text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">{log.entityId || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
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
