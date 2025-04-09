// src/app/networking/add-interaction/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionForm from '@/app/networking/InteractionForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    contactId?: string;
  };
}

export default async function AddInteractionPage({ searchParams }: PageProps) {
  // Properly await searchParams before using
  const params = await searchParams;
  
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get preselected contact ID if provided
  const preselectedContactId = params.contactId ? parseInt(params.contactId) : undefined;
  
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
        <InteractionForm 
          onClose={() => redirect('/networking')}
          preselectedContactId={preselectedContactId}
        />
      </div>
    </DashboardLayout>
  );
}