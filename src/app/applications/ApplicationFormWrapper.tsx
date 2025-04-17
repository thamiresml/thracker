// src/app/applications/ApplicationFormWrapper.tsx

'use client';

import { useRouter } from 'next/navigation';
import ApplicationForm from './ApplicationForm';

interface ApplicationFormWrapperProps {
  preselectedCompanyId?: number;
  returnUrl: string;
}

export default function ApplicationFormWrapper({ 
  preselectedCompanyId,
  returnUrl 
}: ApplicationFormWrapperProps) {
  const router = useRouter();
  
  const handleClose = () => {
    router.push(returnUrl);
  };
  
  return (
    <ApplicationForm 
      onClose={handleClose}
      preselectedCompanyId={preselectedCompanyId} 
    />
  );
}