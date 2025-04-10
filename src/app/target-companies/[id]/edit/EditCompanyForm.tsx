// src/app/target-companies/[id]/edit/EditCompanyForm.tsx

'use client';

import { useRouter } from 'next/navigation';
import CompanyForm from '../../CompanyForm';

export default function EditCompanyForm({ companyId, initialData }: { companyId: number, initialData: any }) {
  const router = useRouter();
  
  return (
    <CompanyForm
      companyId={companyId}
      initialData={initialData}
      onClose={() => router.push('/target-companies')}
    />
  );
}