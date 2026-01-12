// src/app/networking/page.tsx
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/utils/supabase/server';
import ContactsEmptyState from './ContactsEmptyState';
import ContactsList from './ContactList';
import ContactsFilter from './ContactsFilter';
import AddContactButton from './AddContactButton';
import dynamic from 'next/dynamic';
import { Contact } from '@/types/networking';

// Dynamically import Gmail component to prevent SSR/build issues
const GmailConnectionCard = dynamic(() => import('./GmailConnectionCard'), {
  ssr: false,
  loading: () => <div className="bg-white rounded-lg border border-gray-200 p-6 h-32 animate-pulse" />,
});

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
  searchParams: Promise<SearchParams> 
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

  // Fetch all contacts
  let contacts = [];
  const { data: contactsData, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching contacts:', error);
  } else {
    contacts = contactsData || [];
  }

  // Get company data for all contacts
  const { data: companiesData } = await supabase
    .from('companies')
    .select('id, name, logo')
    .in('id', contacts.map(c => c.company_id).filter(Boolean))
    .order('name');
  
  // Create a map of company data by id for easy lookup
  const companiesMap = (companiesData || []).reduce((map, company) => {
    map[company.id] = company;
    return map;
  }, {} as Record<string | number, {
    id: number;
    name: string;
    logo?: string;
  }>);

  // Apply filters to the contacts
  let filteredContacts = contacts || [];
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredContacts = filteredContacts.filter(contact => {
      // Check if company name matches the query
      const companyName = companiesMap[contact.company_id]?.name || '';
      
      return contact.name.toLowerCase().includes(lowerQuery) || 
        (contact.role && contact.role.toLowerCase().includes(lowerQuery)) || 
        (contact.email && contact.email.toLowerCase().includes(lowerQuery)) ||
        companyName.toLowerCase().includes(lowerQuery);
    });
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
  
  // Get additional data for each contact
  const contactIds = filteredContacts.map(contact => contact.id);
  
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
  }, {} as Record<string | number, Array<{
    contact_id: number;
    interaction_date: string;
  }>>);
  
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
  } else if (sortBy === 'company.name') {
    processedContacts.sort((a, b) => {
      const nameA = a.company?.name || '';
      const nameB = b.company?.name || '';
      const result = nameA.localeCompare(nameB);
      return sortOrder === 'asc' ? result : -result;
    });
  } else if (sortBy === 'status') {
    processedContacts.sort((a, b) => {
      const result = a.status.localeCompare(b.status);
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
    'To Reach Out', 'Scheduled', 'Connected', 'Following Up', 'Dormant'
  ];
  
  // Add default statuses if they don't exist in the data
  defaultStatuses.forEach(status => uniqueStatuses.add(status));
  
  // Convert to sorted array
  const availableStatuses = Array.from(uniqueStatuses).sort() as string[];
  
  return (
    <DashboardLayout>
      <PageHeader
        title="Network Contacts"
        action={<AddContactButton />}
      />

      {/* Gmail Integration Card */}
      <div className="mb-6">
        <GmailConnectionCard />
      </div>

      {/* Show Empty State only if the user has NO contacts overall */}
      {contacts.length === 0 ? (
        <ContactsEmptyState />
      ) : (
        /* Otherwise, always show filters and the list (list handles empty filtered results) */
        <div className="space-y-6">
          {/* Search and Filters */}
          <ContactsFilter
            statuses={availableStatuses}
            currentStatus={status}
            currentQuery={query}
            currentIsAlumni={isAlumni}
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