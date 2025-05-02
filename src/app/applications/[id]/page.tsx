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

interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

interface Interaction {
  id: string;
  contact_id?: string;
  contact_name: string;
  contact_role: string;
  contact_email?: string;
  contact_phone?: string;
  interaction_type: string;
  interaction_date: string;
  notes?: string;
}

interface InteractionData {
  id: string;
  type: string;
  interaction_date: string;
  notes?: string;
  contact?: Contact;
}

export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({ params }: PageProps) {
  // Await params to comply with Next.js standards
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
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
    .eq('user_id', user.id)
    .single();
  
  // Handle case when application is not found or error occurs
  if (error || !application) {
    console.error('Error fetching application:', error);
    notFound();
  }
  
  // First get contacts associated with this company
  const { data: companyContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .eq('company_id', application.company_id)
    .eq('user_id', user.id);
    
  if (contactsError) {
    console.error('Error fetching company contacts:', contactsError);
  }
  
  // Initialize interactions as empty array
  let interactions: Interaction[] = [];
  
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
          role,
          email,
          phone
        )
      `)
      .in('contact_id', contactIds)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });
      
    if (interactionError) {
      console.error('Error fetching interactions:', interactionError);
    } else {
      // Map the data to the expected format in ApplicationDetail component
      interactions = (interactionData as InteractionData[] || []).map(interaction => ({
        id: interaction.id,
        contact_id: interaction.contact?.id,
        contact_name: interaction.contact?.name || 'Unknown',
        contact_role: interaction.contact?.role || '',
        contact_email: interaction.contact?.email,
        contact_phone: interaction.contact?.phone,
        interaction_type: interaction.type,
        interaction_date: interaction.interaction_date,
        notes: interaction.notes
      }));
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