import React from 'react';

const BADGE_VARIANTS = {
  // Project Status
  NEW: 'bg-sky-100 text-sky-800 border-sky-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  ON_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',

  // Payment Status
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PARTIALLY_PAID: 'bg-sky-100 text-sky-800 border-sky-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OVERDUE: 'bg-rose-100 text-rose-800 border-rose-200',

  // Priority
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200 font-bold animate-pulse',

  // User Role
  SUPER_ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
  ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PROJECT_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  ACCOUNTS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VENDOR: 'bg-purple-100 text-purple-800 border-purple-200',

  // Default
  DEFAULT: 'bg-slate-100 text-slate-800 border-slate-200'
};

export const Badge = ({ children, status, variant, className = '' }) => {
  const key = status || variant || 'DEFAULT';
  const style = BADGE_VARIANTS[key] || BADGE_VARIANTS.DEFAULT;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {children || status}
    </span>
  );
};
