'use client';

// src/app/networking/contacts/[id]/edit/ContactFormWrapper.tsx
import { useRouter } from 'next/navigation';
import ContactForm from '../../../ContactForm';

interface ContactFormWrapperProps {
  contactId: number;
  initialData: any;
  returnUrl: string;
}

export default function ContactFormWrapper({ 
  contactId, 
  initialData, 
  returnUrl 
}: ContactFormWrapperProps) {
  const router = useRouter();
  
  // Create an onClose function in this client component
  const handleClose = () => {
    router.push(returnUrl);
  };
  
  return (
    <ContactForm 
      contactId={contactId}
      initialData={initialData}
      onClose={handleClose}
    />
  );
}