// src/components/CompanyLogo.tsx
'use client';

import { useState } from 'react';

interface CompanyLogoProps {
  logo?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CompanyLogo({ logo, name, size = 'md' }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  
  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {logo && !hasError ? (
        <img 
          src={logo} 
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`text-gray-500 font-medium ${textSizeClasses[size]}`}>
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}