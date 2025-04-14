// src/app/applications/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import EditApplicationForm from './EditApplicationForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditApplicationPage({ params }: PageProps) {
  // Await params to comply with Next.js 15 standards
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const supabase = await createClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch application to make sure it exists and belongs to the user
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      companies (id, name)
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !application) {
    console.error('Error fetching application:', error);
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href={`/applications/${id}`} 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Application</span>
        </Link>
      </div>
      
      <PageHeader 
        title={`Edit Application: ${application.position} at ${application.companies?.name}`} 
      />
      
      <div className="bg-white shadow rounded-lg overflow-hidden p-6">
        <EditApplicationForm applicationId={parseInt(id)} />
      </div>
    </DashboardLayout>
  );
}