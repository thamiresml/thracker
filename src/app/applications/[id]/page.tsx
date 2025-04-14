// src/app/applications/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import ApplicationDetail from './ApplicationDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({ params }: PageProps) {
  // Await params to comply with Next.js standards
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
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
  
  if (error) {
    console.error('Error fetching application:', error);
    notFound();
  }
  
  if (!application) {
    console.error('Application not found');
    notFound();
  }
  
  // First get contacts associated with this company
  const { data: companyContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .eq('company_id', application.company_id)
    .eq('user_id', session.user.id);
    
  if (contactsError) {
    console.error('Error fetching company contacts:', contactsError);
  }
  
  // Initialize interactions as empty array
  let interactions = [];
  
  // Then get interactions only for contacts from this company
  if (companyContacts && companyContacts.length > 0) {
    const contactIds = companyContacts.map(contact => contact.id);
    
    const { data: interactionData, error: interactionError } = await supabase
      .from('interactions')
      .select(`
        *,
        contact:contacts (
          id,
          name,
          role
        )
      `)
      .in('contact_id', contactIds)
      .eq('user_id', session.user.id)
      .order('interaction_date', { ascending: false });
      
    if (interactionError) {
      console.error('Error fetching interactions:', interactionError);
    } else {
      interactions = interactionData || [];
    }
  }
  
  return (
    <DashboardLayout>
      <ApplicationDetail 
        application={application} 
        interactions={interactions} 
      />
    </DashboardLayout>
  );
}