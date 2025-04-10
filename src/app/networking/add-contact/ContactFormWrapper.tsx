'use client';

import { useCallback, useState } from 'react';
import ContactForm from '@/app/networking/ContactForm';
import FormWrapper from '@/components/forms/FormWrapper';

interface ContactFormWrapperProps {
  returnUrl: string;
}

export default function ContactFormWrapper({ returnUrl }: ContactFormWrapperProps) {
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
        <ContactForm onClose={handleClose} />
      )}
    </FormWrapper>
  );
}