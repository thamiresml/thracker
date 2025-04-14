// src/app/target-companies/[id]/edit/page.tsx

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditCompanyForm from './EditCompanyForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCompanyPage({ params }: PageProps) {
  // Await params to comply with Next.js standards
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const supabase = await createClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch company to make sure it exists and belongs to the user
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !company) {
    console.error('Error fetching company:', error);
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href="/target-companies" 
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Companies</span>
        </Link>
      </div>
      
      <PageHeader 
        title={`Edit Company: ${company.name}`} 
      />
      
      <div className="bg-white shadow rounded-lg overflow-hidden p-6">
        <EditCompanyForm companyId={parseInt(id)} initialData={company} />
      </div>
    </DashboardLayout>
  );
}