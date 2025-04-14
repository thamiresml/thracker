// src/app/networking/add-contact/ContactFormWrapper.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ContactForm from '@/app/networking/ContactForm';

interface ContactFormWrapperProps {
  returnUrl: string;
  preselectedCompanyId?: number;
}

export default function ContactFormWrapper({ 
  returnUrl,
  preselectedCompanyId
}: ContactFormWrapperProps) {
  const router = useRouter();
  
  // Create a client-side handler for the close action
  const handleClose = useCallback(() => {
    router.push(returnUrl);
  }, [router, returnUrl]);

  return (
    <ContactForm 
      onClose={handleClose}
      preselectedCompanyId={preselectedCompanyId}
    />
  );
}