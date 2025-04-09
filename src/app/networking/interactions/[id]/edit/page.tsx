// src/app/networking/contacts/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContactFormWrapper from './ContactFormWrapper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditContactPage({ params }: PageProps) {
  // Await params before accessing
  const awaitedParams = await params;
  const { id } = awaitedParams;
  
  const supabase = await createClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get user with proper authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  // Fetch contact to make sure it exists and belongs to the user
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error || !contact) {
    console.error('Error fetching contact:', error);
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href={`/networking/contacts/${id}`} 
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Contact</span>
        </Link>
      </div>
      
      <PageHeader 
        title={`Edit Contact: ${contact.name}`} 
      />
      
      <div className="mt-4">
        {/* Use a client component wrapper instead of directly passing server functions */}
        <ContactFormWrapper 
          contactId={parseInt(id)}
          initialData={contact}
          returnUrl={`/networking/contacts/${id}`}
        />
      </div>
    </DashboardLayout>
  );
}