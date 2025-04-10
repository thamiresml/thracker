'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import FormWrapper from '@/components/forms/FormWrapper';
import InteractionForm from '@/app/networking/InteractionForm';
import { useState } from 'react';

// Note: This is now a client component

interface PageProps {
  searchParams: {
    contactId?: string;
  };
}

export default function AddInteractionPage({ searchParams }: PageProps) {
  const [handleClose, setHandleClose] = useState<(() => void) | null>(null);
  
  // Parse contact ID if provided
  const preselectedContactId = searchParams.contactId 
    ? parseInt(searchParams.contactId) 
    : undefined;
  
  const returnUrl = '/networking';
  
  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href="/networking" 
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Contacts</span>
        </Link>
      </div>
      
      <PageHeader title="Add New Interaction" />
      
      <div className="mt-4">
        <FormWrapper 
          returnUrl={returnUrl}
          onCloseCallback={(closeFunc) => setHandleClose(() => closeFunc)}
        >
          {handleClose && (
            <InteractionForm 
              onClose={handleClose}
              preselectedContactId={preselectedContactId}
            />
          )}
        </FormWrapper>
      </div>
    </DashboardLayout>
  );
}