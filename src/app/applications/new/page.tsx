import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicationForm from '../ApplicationForm';

export const dynamic = 'force-dynamic';

export default async function NewApplicationPage({ searchParams }: { searchParams: { companyId?: string } }) {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Use searchParams to get the companyId
  const companyId = searchParams.companyId ? parseInt(searchParams.companyId) : undefined;
  
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
        <ApplicationForm preselectedCompanyId={companyId} />
      </div>
    </DashboardLayout>
  );
}