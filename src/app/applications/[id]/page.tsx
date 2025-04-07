// src/app/applications/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import ApplicationDetail from './ApplicationDetail';

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch application with company data
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      companies (id, name, logo, website)
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !application) {
    console.error('Error fetching application:', error);
    notFound();
  }
  
  // Get interactions related to this company
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('company_id', application.company_id)
    .eq('user_id', session.user.id)
    .order('interaction_date', { ascending: false });
  
  return (
    <DashboardLayout>
      <ApplicationDetail 
        application={application} 
        interactions={interactions || []} 
      />
    </DashboardLayout>
  );
}