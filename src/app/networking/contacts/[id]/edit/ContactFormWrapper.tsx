// src/app/networking/contacts/[id]/edit/ContactFormWrapper.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ContactForm from '@/app/networking/ContactForm';

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
  const router = useRouter();
  
  // Create a client-side handler for the close action
  const handleClose = useCallback(() => {
    router.push(returnUrl);
  }, [router, returnUrl]);

  return (
    <ContactForm
      contactId={contactId}
      initialData={initialData}
      onClose={handleClose}
    />
  );
}