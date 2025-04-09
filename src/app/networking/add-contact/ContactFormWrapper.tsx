'use client';

// src/app/networking/add-contact/ContactFormWrapper.tsx
import { useRouter } from 'next/navigation';
import ContactForm from '../ContactForm';

interface ContactFormWrapperProps {
  returnUrl: string;
}

export default function ContactFormWrapper({ returnUrl }: ContactFormWrapperProps) {
  const router = useRouter();
  
  // Create an onClose function in this client component
  const handleClose = () => {
    router.push(returnUrl);
  };
  
  return (
    <ContactForm onClose={handleClose} />
  );
}