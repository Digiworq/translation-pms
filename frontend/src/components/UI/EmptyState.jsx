import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  title = 'No data found',
  description = 'There are no records to display at the moment.',
  icon: Icon = FolderOpen,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
