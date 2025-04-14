// src/app/networking/interactions/[id]/edit/InteractionFormWrapper.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import InteractionForm from '@/app/networking/InteractionForm';
import { Interaction } from '@/types/common';

interface InteractionFormWrapperProps {
  interactionId: number;
  initialData: Interaction;
  returnUrl: string;
}

export default function InteractionFormWrapper({
  interactionId,
  initialData,
  returnUrl,
}: InteractionFormWrapperProps) {
  const router = useRouter();
  
  // Create a client-side handler for the close action
  const handleClose = useCallback(() => {
    router.push(returnUrl);
  }, [router, returnUrl]);

  return (
    <InteractionForm
      interactionId={interactionId}
      initialData={initialData}
      onClose={handleClose}
      preselectedContactId={initialData.contact_id}
    />
  );
}