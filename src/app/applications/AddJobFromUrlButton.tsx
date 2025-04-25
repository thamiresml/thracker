'use client';

import { Link } from 'lucide-react';

interface AddJobFromUrlButtonProps {
  onClick: () => void;
}

export default function AddJobFromUrlButton({ onClick }: AddJobFromUrlButtonProps) {
  return (
    <>
      <button
        onClick={onClick}
        className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <Link className="mr-2 h-4 w-4" />
        Add Job from URL
      </button>
    </>
  );
} 