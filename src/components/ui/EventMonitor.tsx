'use client';

import { useEffect } from 'react';

export default function EventMonitor() {
  useEffect(() => {
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(
      type: string, 
      listener: EventListenerOrEventListenerObject, 
      options?: boolean | AddEventListenerOptions
    ) {
      console.log(`Event listener added: ${type}`);
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    return () => {
      document.addEventListener = originalAddEventListener;
    };
  }, []);

  return null; // This component doesn't render anything
} 