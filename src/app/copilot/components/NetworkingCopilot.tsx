'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Contact } from '@/types/networking';
import { Lightbulb, Mail, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

interface NetworkingCopilotProps {
  selectedCompanyId?: number;
}

export default function NetworkingCopilot({ selectedCompanyId }: NetworkingCopilotProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftingEmail, setDraftingEmail] = useState<Contact | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  
  const supabase = createClient();
  
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('You must be logged in to view contacts');
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User data not available');
        }
        
        // Fetch contacts, optionally filtered by company if selectedCompanyId is provided
        let query = supabase
          .from('contacts')
          .select('*, company:companies(id, name, logo)')
          .eq('user_id', user.id);
          
        if (selectedCompanyId) {
          query = query.eq('company_id', selectedCompanyId);
        }
        
        // Only get active contacts
        query = query.in('status', ['Active', 'Connected', 'Following Up']);
        
        // Order by most recent first
        query = query.order('updated_at', { ascending: false });
        
        // Execute the query
        const { data: contactsData, error: contactsError } = await query;
        
        if (contactsError) throw contactsError;
        
        // Fetch last interaction date for each contact
        const contactIds = (contactsData || []).map(contact => contact.id);
        
        if (contactIds.length > 0) {
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
          const processedContacts: Contact[] = (contactsData || []).map(contact => {
            // Get interactions for this contact
            const contactInteractions = interactionsByContact[contact.id] || [];
            const interactionsCount = contactInteractions.length;
            
            // Get last interaction date
            let lastInteractionDate = null;
            if (contactInteractions.length > 0) {
              // Get the most recent date
              lastInteractionDate = contactInteractions[0].interaction_date;
            }
            
            return {
              ...contact,
              last_interaction_date: lastInteractionDate,
              interactions_count: interactionsCount
            };
          });
          
          setContacts(processedContacts);
        } else {
          setContacts([]);
        }
      } catch (err: unknown) {
        console.error('Error fetching contacts:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [supabase, selectedCompanyId]);
  
  const handleDraftEmail = async (contact: Contact) => {
    setDraftingEmail(contact);
    setGeneratingEmail(true);
    
    try {
      // Fetch your resume content for context if available
      let resumeContent = '';
      try {
        const { data: resumeData } = await supabase
          .from('documents')
          .select('content')
          .eq('type', 'resume')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (resumeData && resumeData.length > 0) {
          resumeContent = resumeData[0].content;
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
        // Continue without resume content
      }
      
      // Generate email draft using AI
      const response = await fetch('/api/generate-networking-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactName: contact.name,
          contactRole: contact.role,
          companyName: contact.company?.name,
          lastInteraction: contact.last_interaction_date,
          isAlumni: contact.is_alumni,
          resumeContent: resumeContent
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate email draft');
      }
      
      const data = await response.json();
      setEmailDraft(data.emailDraft);
    } catch (err: unknown) {
      console.error('Error generating email draft:', err);
      // Fallback to a generic template if generation fails
      setEmailDraft(`
Subject: Connect with [Your Name]

Dear ${contact.name},

I hope this email finds you well. My name is [Your Name], and I'm reaching out because [reason for contact - mention mutual connection or interest in their company].

[Brief paragraph about your background and current situation]

I would greatly appreciate the opportunity to connect and learn more about your experience at ${contact.company?.name}. Would you be available for a brief 15-20 minute call in the coming weeks?

Thank you for your time, and I look forward to potentially connecting.

Best regards,
[Your Name]
[Your Contact Information]
      `);
    } finally {
      setGeneratingEmail(false);
    }
  };
  
  const handleCopyEmail = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(emailDraft);
      // You could add a toast notification here if you want
    }
  };
  
  const handleSendEmail = () => {
    if (draftingEmail?.email && emailDraft) {
      const subject = emailDraft.split('\n')[0].replace('Subject: ', '');
      const body = emailDraft.split('\n').slice(1).join('\n');
      window.open(`mailto:${draftingEmail.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };
  
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your network contacts...</span>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-6">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </Card>
    );
  }
  
  if (contacts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-6">
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-4">
            {selectedCompanyId 
              ? "You don't have any contacts at this company yet." 
              : "You haven't added any networking contacts yet."}
          </p>
          <Button
            onClick={() => {
              toast.info("To add contacts, please visit the Networking section from the main menu", {
                duration: 4000,
                position: 'top-center',
              })
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> 
            Add Contact
          </Button>
        </div>
      </Card>
    );
  }
  
  // If we're in email drafting mode, show the email editor
  if (draftingEmail) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Draft Email to {draftingEmail.name}
          </h3>
          <Button variant="ghost" onClick={() => setDraftingEmail(null)}>
            Back to Contacts
          </Button>
        </div>
        
        {generatingEmail ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Drafting your email...</span>
          </div>
        ) : (
          <>
            <textarea
              className="w-full h-64 p-3 border rounded-md mb-4 font-mono text-sm"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
            />
            
            <div className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={handleCopyEmail}
                >
                  Copy to Clipboard
                </Button>
                {draftingEmail.email && (
                  <Button onClick={handleSendEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    Open in Email Client
                  </Button>
                )}
              </div>
              <Button variant="ghost" onClick={() => setDraftingEmail(null)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }
  
  // Otherwise, show the list of contacts
  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Network Contacts</h3>
        <Link href="/networking">
          <Button variant="ghost">View All in Networking</Button>
        </Link>
      </div>
      
      <div className="space-y-4">
        {contacts.slice(0, 5).map((contact) => (
          <div 
            key={contact.id} 
            className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 text-indigo-700 h-10 w-10 flex items-center justify-center flex-shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {contact.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span>{contact.role} at {contact.company?.name}</span>
                </div>
                {contact.last_interaction_date && (
                  <div className="text-xs text-gray-400 mt-1">
                    Last contact: {format(new Date(contact.last_interaction_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDraftEmail(contact)}
              >
                <Lightbulb className="w-4 h-4 mr-1 text-amber-500" />
                Draft Email
              </Button>
              <Link href={`/networking/contacts/${contact.id}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </div>
          </div>
        ))}
        
        {contacts.length > 5 && (
          <div className="text-center pt-2">
            <Link href="/networking">
              <Button variant="link">
                View all {contacts.length} contacts
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
} 