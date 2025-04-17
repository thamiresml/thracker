// src/app/applications/new/page.tsx

import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicationFormWrapper from '../ApplicationFormWrapper';

export const dynamic = 'force-dynamic';

export default async function NewApplicationPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ companyId?: string, returnUrl?: string }> 
}) {
  // Await the searchParams Promise to get the actual values
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Use the awaited searchParams to get the companyId
  const preselectedCompanyId = resolvedParams.companyId ? parseInt(resolvedParams.companyId) : undefined;
  
  // Get return URL or default to applications page
  const returnUrl = resolvedParams.returnUrl || '/applications';
  
  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href={returnUrl}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back</span>
        </Link>
      </div>
      
      <PageHeader title="New Application" />
      
      <div className="bg-white shadow rounded-lg overflow-hidden p-6">
        <ApplicationFormWrapper
          preselectedCompanyId={preselectedCompanyId}
          returnUrl={returnUrl}
        />
      </div>
    </DashboardLayout>
  );
}