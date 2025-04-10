// src/app/networking/add-interaction/InteractionFormWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import FormWrapper from '@/components/forms/FormWrapper';
import InteractionForm from '@/app/networking/InteractionForm';

interface InteractionFormWrapperProps {
  returnUrl: string;
  preselectedContactId?: number;
}

export default function InteractionFormWrapper({
  returnUrl,
  preselectedContactId
}: InteractionFormWrapperProps) {
  const [handleClose, setHandleClose] = useState<(() => void) | null>(null);

  return (
    <FormWrapper
      returnUrl={returnUrl}
      onCloseCallback={(closeFunc) => setHandleClose(() => closeFunc)}
    >
      {handleClose && (
        <InteractionForm 
          onClose={handleClose}
          preselectedContactId={preselectedContactId}
        />
      )}
    </FormWrapper>
  );
}