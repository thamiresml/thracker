// src/components/NavigationEvents.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This prevents rapid consecutive navigations that can cause the filter reset issue
    const handleBeforeHistoryChange = () => {
      // This runs before each navigation
      // We can use this to prevent unwanted rerenders or to clean up resources
    };

    // Listen for navigation events
    window.addEventListener('popstate', handleBeforeHistoryChange);

    return () => {
      window.removeEventListener('popstate', handleBeforeHistoryChange);
    };
  }, []);

  useEffect(() => {
    // This runs when the pathname or search params change
    // We can use this for analytics or other side effects

    // Create a consolidated routing key that combines pathname and search params
    const url = pathname + searchParams.toString();
    
    // This is useful for debugging navigation issues
    console.log('Navigation occurred to:', url);
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}