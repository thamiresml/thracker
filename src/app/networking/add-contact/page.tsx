// src/app/networking/add-contact/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContactFormWrapper from './ContactFormWrapper';

export const dynamic = 'force-dynamic';

export default async function AddContactPage(props: {
  searchParams: Promise<{ companyId?: string, returnUrl?: string }>;
}) {
  const params = await props.searchParams;
  const { companyId, returnUrl } = params;

  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get preselected company ID if provided
  const preselectedCompanyId = companyId ? parseInt(companyId) : undefined;
  
  // Get return URL or default to networking page
  const navigateBackUrl = returnUrl || '/networking';

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link
          href={navigateBackUrl}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back</span>
        </Link>
      </div>

      <PageHeader title="Add New Contact" />

      <div className="mt-4">
        <ContactFormWrapper
          returnUrl={navigateBackUrl}
          preselectedCompanyId={preselectedCompanyId}
        />
      </div>
    </DashboardLayout>
  );
}