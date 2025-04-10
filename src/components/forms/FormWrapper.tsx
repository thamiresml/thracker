// src/components/forms/FormWrapper.tsx

'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface FormWrapperProps {
  returnUrl: string;
  // Changed from function to ReactNode
  children: ReactNode;
  // Add a new prop for the form component
  onCloseCallback: (handleClose: () => void) => void;
}

export default function FormWrapper({ 
  returnUrl,
  children,
  onCloseCallback
}: FormWrapperProps) {
  const router = useRouter();
  
  // Create an onClose function in this client component
  const handleClose = () => {
    router.push(returnUrl);
  };
  
  // Pass the handleClose function to the form through callback
  onCloseCallback(handleClose);
  
  // Render the children directly
  return <>{children}</>;
}