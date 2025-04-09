// src/app/networking/page.tsx
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import ContactsEmptyState from './ContactsEmptyState';
import ContactsList from './ContactList';
import ContactsFilter from './ContactsFilter';
import AddContactButton from './AddContactButton';
import { Contact } from '@/types/networking';

export const dynamic = 'force-dynamic';

interface SearchParams {
  query?: string;
  status?: string;
  companyId?: string;
  isAlumni?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function NetworkingPage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  // Await the searchParams to avoid Next.js warnings
  const params = await searchParams;
  
  // Parse search parameters
  const query = params.query || '';
  const status = params.status || '';
  const companyId = params.companyId || '';
  const isAlumni = params.isAlumni === 'true';
  const sortBy = params.sortBy || 'last_interaction_date';
  const sortOrder = params.sortOrder || 'desc';
  
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get authenticated user data
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Create a simple query to get contacts first, then manually join with other data
  // This avoids the foreign key relationship error
  let { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching contacts:', error);
    contacts = [];
  }

  // Apply filters to the contacts after fetching
  let filteredContacts = contacts || [];
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredContacts = filteredContacts.filter(
      contact => 
        contact.name.toLowerCase().includes(lowerQuery) || 
        (contact.role && contact.role.toLowerCase().includes(lowerQuery)) || 
        (contact.email && contact.email.toLowerCase().includes(lowerQuery))
    );
  }
  
  if (status) {
    filteredContacts = filteredContacts.filter(contact => contact.status === status);
  }
  
  if (companyId) {
    filteredContacts = filteredContacts.filter(contact => contact.company_id.toString() === companyId);
  }
  
  if (isAlumni) {
    filteredContacts = filteredContacts.filter(contact => contact.is_alumni === true);
  }
  
  // Now get additional data for each contact
  const contactIds = filteredContacts.map(contact => contact.id);
  
  // Get company data for the filtered contacts
  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name, logo')
    .in('id', filteredContacts.map(c => c.company_id))
    .order('name');
  
  // Create a map of company data by id for easy lookup
  const companiesMap = (companiesData || []).reduce((map, company) => {
    map[company.id] = company;
    return map;
  }, {} as Record<number, any>);

  // Get interactions data for the filtered contacts
  const { data: interactionsData } = await supabase
    .from('interactions')
    .select('contact_id, interaction_date')
    .in('contact_id', contactIds)
    .order('interaction_date', { ascending: false });
  
  // Group interactions by contact_id
  const interactionsByContact = (interactionsData || []).reduce((grouped, interaction) => {
    if (!grouped[interaction.contact_id]) {
      grouped[interaction.contact_id] = [];
    }
    grouped[interaction.contact_id].push(interaction);
    return grouped;
  }, {} as Record<number, any[]>);
  
  // Combine all the data into processed contacts
  const processedContacts: Contact[] = filteredContacts.map(contact => {
    // Get interactions for this contact
    const contactInteractions = interactionsByContact[contact.id] || [];
    const interactionsCount = contactInteractions.length;
    
    // Get last interaction date
    let lastInteractionDate = null;
    if (contactInteractions.length > 0) {
      // Get the most recent date
      lastInteractionDate = contactInteractions[0].interaction_date;
    }
    
    // Get company info
    const company = companiesMap[contact.company_id];
    
    return {
      ...contact,
      last_interaction_date: lastInteractionDate,
      interactions_count: interactionsCount,
      company: company ? {
        id: company.id,
        name: company.name,
        logo: company.logo
      } : undefined
    };
  });
  
  // Sort the processed contacts
  if (sortBy === 'name') {
    processedContacts.sort((a, b) => {
      const result = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? result : -result;
    });
  } else if (sortBy === 'last_interaction_date') {
    processedContacts.sort((a, b) => {
      if (!a.last_interaction_date && !b.last_interaction_date) return 0;
      if (!a.last_interaction_date) return sortOrder === 'asc' ? -1 : 1;
      if (!b.last_interaction_date) return sortOrder === 'asc' ? 1 : -1;
      
      const dateA = new Date(a.last_interaction_date);
      const dateB = new Date(b.last_interaction_date);
      const result = dateA.getTime() - dateB.getTime();
      return sortOrder === 'asc' ? result : -result;
    });
  }
  
  // Fetch all available statuses for the filter
  const { data: statusesData } = await supabase
    .from('contacts')
    .select('status')
    .eq('user_id', user.id)
    .is('status', 'not.null');
  
  // Extract unique statuses
  const uniqueStatuses = new Set();
  statusesData?.forEach(item => {
    if (item.status) uniqueStatuses.add(item.status);
  });
  
  // Default statuses list
  const defaultStatuses = [
    'Active', 'To Reach Out', 'Connected', 'Following Up', 'Dormant', 'Archived'
  ];
  
  // Add default statuses if they don't exist in the data
  defaultStatuses.forEach(status => uniqueStatuses.add(status));
  
  // Convert to sorted array
  const availableStatuses = Array.from(uniqueStatuses).sort() as string[];
  
  // Fetch companies for filter
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name');
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Network Contacts" 
        action={<AddContactButton />}
      />
      
      {processedContacts.length === 0 && !query && !status && !companyId ? (
        <ContactsEmptyState />
      ) : (
        <div className="space-y-6">
          {/* Search and Filters */}
          <ContactsFilter 
            statuses={availableStatuses}
            companies={companies || []}
            currentStatus={status}
            currentCompanyId={companyId}
            currentQuery={query}
            currentIsAlumni={isAlumni}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />
          
          {/* Contacts List */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ContactsList 
              contacts={processedContacts} 
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}