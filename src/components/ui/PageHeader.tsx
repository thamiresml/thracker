// src/components/ui/PageHeader.tsx

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="md:flex md:items-center md:justify-between pb-5 mb-6 border-b border-gray-200">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="mt-4 flex md:mt-0 md:ml-4">{action}</div>}
    </div>
  );
}