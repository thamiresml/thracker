// src/app/networking/contacts/[id]/edit/ContactFormWrapper.tsx
'use client';

import { useState, useCallback } from 'react';
import FormWrapper from '@/components/forms/FormWrapper';
import ContactForm from '../../../ContactForm';

interface ContactFormWrapperProps {
  contactId: number;
  initialData: any;
  returnUrl: string;
}

export default function ContactFormWrapper({
  contactId,
  initialData,
  returnUrl,
}: ContactFormWrapperProps) {
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
        <ContactForm
          contactId={contactId}
          initialData={initialData}
          onClose={handleClose}
        />
      )}
    </FormWrapper>
  );
}