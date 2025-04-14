'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, X } from 'lucide-react'; // Import X from lucide-react

interface Contact {
  id: number;
  name: string;
  role?: string;
  company_name?: string;
}

interface ContactSelectFieldProps {
  value: number | null;
  onChange: (contactId: number | null) => void;
  disabled?: boolean;
}

export default function ContactSelectField({
  value,
  onChange,
  disabled = false
}: ContactSelectFieldProps) {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState('');
  
  // Define fetchContacts with useCallback to avoid recreation on each render
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user ID for the query
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // First, fetch contacts
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select(`
          id,
          name,
          role,
          company_id
        `)
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      
      // Get all company IDs from contacts
      const companyIds = contactsData
        .filter(contact => contact.company_id)
        .map(contact => contact.company_id);
      
      // Fetch companies if there are any to fetch
      let companiesMap: Record<number, string> = {};
      
      if (companyIds.length > 0) {
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);
        
        // Create a map of company ID to company name
        if (companiesData) {
          companiesMap = companiesData.reduce((map, company) => {
            map[company.id] = company.name;
            return map;
          }, {} as Record<number, string>);
        }
      }
      
      // Map contacts with company names
      const processedContacts = contactsData.map(contact => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        company_name: contact.company_id ? companiesMap[contact.company_id] : undefined
      }));
      
      setContacts(processedContacts);
      setSearchResults(processedContacts);
      
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  
  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  
  // Update search results when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(contacts);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) || 
      (contact.role && contact.role.toLowerCase().includes(query)) ||
      (contact.company_name && contact.company_name.toLowerCase().includes(query))
    );
    setSearchResults(filtered);
  }, [searchQuery, contacts]);
  
  // Update selected contact name when value changes
  useEffect(() => {
    if (value && contacts.length > 0) {
      const contact = contacts.find(c => c.id === value);
      if (contact) {
        setSelectedContactName(contact.name);
      }
    } else {
      setSelectedContactName('');
    }
  }, [value, contacts]);
  
  // Handle selecting a contact
  const handleSelectContact = (contact: Contact) => {
    onChange(contact.id);
    setSelectedContactName(contact.name);
    setShowDropdown(false);
  };
  
  // Handle clearing the selection
  const handleClear = () => {
    onChange(null);
    setSelectedContactName('');
    setSearchQuery('');
  };
  
  // Handle input focus
  const handleFocus = () => {
    if (!disabled) {
      setShowDropdown(true);
    }
  };
  
  // Create a simple loading spinner component
  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
  );
  
  if (loading) {
    return (
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Loading contacts..."
          disabled={true}
        />
        <div className="absolute right-3 top-2.5">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={selectedContactName || searchQuery}
          onChange={(e) => {
            setSelectedContactName('');
            setSearchQuery(e.target.value);
            onChange(null);
          }}
          onFocus={handleFocus}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search contacts..."
          disabled={disabled}
        />
        <div className="absolute right-3 top-2.5">
          {selectedContactName ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-500"
              disabled={disabled}
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {showDropdown && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md">
          <ul className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {searchResults.length === 0 ? (
              <li className="text-gray-500 select-none relative py-2 px-3">
                No contacts found
              </li>
            ) : (
              searchResults.map((contact) => (
                <li
                  key={contact.id}
                  className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-100"
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{contact.name}</span>
                    {(contact.role || contact.company_name) && (
                      <span className="text-sm text-gray-500">
                        {contact.role}
                        {contact.role && contact.company_name && ' at '}
                        {contact.company_name}
                      </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}