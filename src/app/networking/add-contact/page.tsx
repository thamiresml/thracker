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
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await props.searchParams;

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

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link
          href="/networking"
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Contacts</span>
        </Link>
      </div>

      <PageHeader title="Add New Contact" />

      <div className="mt-4">
        <ContactFormWrapper
          returnUrl="/networking"
          preselectedCompanyId={preselectedCompanyId}
        />
      </div>
    </DashboardLayout>
  );
}