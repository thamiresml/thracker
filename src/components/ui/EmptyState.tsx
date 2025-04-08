// src/components/ui/EmptyState.tsx

import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm text-center">
      {icon && (
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-50 text-purple-500 mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-base text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}