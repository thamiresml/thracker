import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600 border-gray-200 mx-auto"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
} 