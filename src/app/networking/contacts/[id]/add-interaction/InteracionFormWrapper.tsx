'use client';

import { useState, useCallback } from 'react';
import FormWrapper from '@/components/forms/FormWrapper';
import InteractionForm from '@/app/networking/InteractionForm';

interface InteractionFormWrapperProps {
  returnUrl: string;
  preselectedContactId: number;
}

export default function InteractionFormWrapper({
  returnUrl,
  preselectedContactId,
}: InteractionFormWrapperProps) {
  const [handleClose, setHandleClose] = useState<(() => void) | null>(null);

  const handleCallback = useCallback((closeFunc: () => void) => {
    setHandleClose(() => closeFunc);
  }, []);

  return (
    <FormWrapper
      returnUrl={returnUrl}
      onCloseCallback={handleCallback}
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