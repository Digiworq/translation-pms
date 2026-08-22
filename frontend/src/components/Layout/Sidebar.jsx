import React from 'react';
import { NavLink } from 'react-router-dom';
import { VismaLogo } from '../UI/VismaLogo';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users,
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  Globe2,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS', 'VENDOR'] },
    { name: 'Projects', to: '/projects', icon: FolderKanban, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'ACCOUNTS'] },
    { name: 'Clients', to: '/clients', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS'] },
    { name: 'Vendors', to: '/vendors', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS'] },
    { name: 'Invoices', to: '/invoices', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS'] },
    { name: 'Payments', to: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'PROJECT_MANAGER', 'VENDOR'] },
    { name: 'Documents', to: '/documents', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS', 'VENDOR'] },
    { name: 'Reports', to: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS'] },
    { name: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Users', to: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Settings', to: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS', 'VENDOR'] }
  ];

  const allowedNav = navigation.filter(item => {
    if (user?.role === 'SUPER_ADMIN') return true;
    return item.roles.includes(user?.role);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between border-r border-slate-800`}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
            <VismaLogo isDarkBg={true} size="md" />
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@pms.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
