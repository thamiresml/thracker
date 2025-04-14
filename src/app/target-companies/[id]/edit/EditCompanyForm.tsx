// src/app/target-companies/[id]/edit/EditCompanyForm.tsx

'use client';

import { useRouter } from 'next/navigation';
import CompanyForm from '../../CompanyForm';

interface TargetCompanyFormData {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  logo?: string;
  description?: string;
  priority: string;
  notes?: string;
  is_target: boolean;
}

export default function EditCompanyForm({ companyId, initialData }: { companyId: number, initialData: TargetCompanyFormData }) {
  const router = useRouter();
  
  return (
    <CompanyForm
      companyId={companyId}
      initialData={initialData}
      onClose={() => router.push('/target-companies')}
    />
  );
}