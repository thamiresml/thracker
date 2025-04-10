// src/components/forms/FormWrapper.tsx

'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface FormWrapperProps {
  returnUrl: string;
  children: ReactNode;
  onCloseCallback: (handleClose: () => void) => void;
}

export default function FormWrapper({ 
  returnUrl,
  children,
  onCloseCallback
}: FormWrapperProps) {
  const router = useRouter();

  // This is safe because it runs *after* the render
  useEffect(() => {
    const handleClose = () => {
      router.push(returnUrl);
    };

    onCloseCallback(handleClose);
  }, [onCloseCallback, returnUrl, router]);

  return <>{children}</>;
}