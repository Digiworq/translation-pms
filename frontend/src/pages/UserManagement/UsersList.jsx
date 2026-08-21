import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { Plus, Search, UserCheck, KeyRound, Shield } from 'lucide-react';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'PROJECT_MANAGER'
  });

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/users', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchUsers();
        setFormData({ name: '', email: '', password: '', phone: '', role: 'PROJECT_MANAGER' });
      }
    } catch (e) {
      alert(e.response?.data?.message || 'User creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Administration & RBAC</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage staff permissions, administrative credentials & roles</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Create System User</Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4">{u.email}</td>
                    <td className="py-3.5 px-4"><Badge status={u.role} /></td>
                    <td className="py-3.5 px-4"><Badge status={u.status} /></td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">System Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ACCOUNTS">Accounts</option>
              <option value="VENDOR">Vendor / Translator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
