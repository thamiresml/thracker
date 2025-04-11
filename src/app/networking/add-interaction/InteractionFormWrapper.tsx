// src/app/networking/add-interaction/InteractionFormWrapper.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import InteractionForm from '@/app/networking/InteractionForm';

interface InteractionFormWrapperProps {
  returnUrl: string;
  preselectedContactId?: number;
}

export default function InteractionFormWrapper({
  returnUrl,
  preselectedContactId
}: InteractionFormWrapperProps) {
  const router = useRouter();
  
  // Create a client-side handler for the close action
  const handleClose = useCallback(() => {
    router.push(returnUrl);
  }, [router, returnUrl]);

  return (
    <InteractionForm 
      onClose={handleClose}
      preselectedContactId={preselectedContactId}
    />
  );
}