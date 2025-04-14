// src/app/applications/new/page.tsx

import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicationForm from '../ApplicationForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    companyId?: string;
  }>;
}

export default async function NewApplicationPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Await searchParams to comply with Next.js standards
  const params = await searchParams;
  
  // Use searchParams to get the companyId
  const companyId = params.companyId ? parseInt(params.companyId) : undefined;
  
  // Handle navigation back to applications list
  const handleClose = () => {
    // This function will be passed to ApplicationForm but executed in the client component
    // The router.push happens within the client component's onSubmit
    return;
  };
  
  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href="/applications" 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Applications</span>
        </Link>
      </div>
      
      <PageHeader title="New Application" />
      
      <div className="bg-white shadow rounded-lg overflow-hidden p-6">
        <ApplicationForm onClose={handleClose} companyId={companyId} />
      </div>
    </DashboardLayout>
  );
}