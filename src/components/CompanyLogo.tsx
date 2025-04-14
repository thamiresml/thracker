// src/components/CompanyLogo.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CompanyLogoProps {
  logo?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CompanyLogo({ logo, name, size = 'md' }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(logo || '');
  
  // Update imageSrc when logo prop changes
  useEffect(() => {
    setImageSrc(logo || '');
    setHasError(false);
  }, [logo]);
  
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
  
  // Define sizes in pixels for Next.js Image component
  const sizePixels = {
    sm: 40,
    md: 48,
    lg: 64
  };
  
  // Handle errors safely
  const handleImageError = () => {
    setHasError(true);
    console.log(`Failed to load logo for ${name}`);
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {imageSrc && !hasError ? (
        <div className="relative w-full h-full">
          <Image 
            src={imageSrc} 
            alt={`${name} logo`}
            width={sizePixels[size]}
            height={sizePixels[size]}
            className="h-full w-full object-cover"
            onError={handleImageError}
            unoptimized={true}
            loading="eager"
          />
        </div>
      ) : (
        <span className={`text-gray-500 font-medium ${textSizeClasses[size]}`}>
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}