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

  const formInitialData = {
    contact_id: initialData.contact_id,
    interaction_date: initialData.interaction_date,
    interaction_type: initialData.interaction_type,
    notes: initialData.notes || '',
    follow_up_date: initialData.follow_up_date || null
  };

  return (
    <InteractionForm
      interactionId={interactionId}
      initialData={formInitialData}
      onClose={handleClose}
      preselectedContactId={initialData.contact_id}
    />
  );
}