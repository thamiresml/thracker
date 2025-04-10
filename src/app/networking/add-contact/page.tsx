// src/app/networking/add-contact/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from '@/app/networking/ContactForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    companyId?: string;
  };
}

export default async function AddContactPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get preselected company ID if provided
  const preselectedCompanyId = searchParams.companyId ? 
    parseInt(searchParams.companyId) : undefined;
  
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
      
      <PageHeader title="Add New Contact" />
      
      <div className="mt-4">
        <ContactForm 
          onClose={() => redirect('/networking')}
          preselectedCompanyId={preselectedCompanyId}
        />
      </div>
    </DashboardLayout>
  );
}