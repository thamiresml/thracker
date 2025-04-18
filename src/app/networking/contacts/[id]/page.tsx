// src/app/networking/contacts/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import ContactPageClient from './ContactPageClient';

export const dynamic = 'force-dynamic';

export default async function ContactDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { id } = await props.params;
  const { returnUrl } = await props.searchParams;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  try {
    // Fetch contact with company data
    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`*, company:companies (id, name, logo, website)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!contact) {
      return redirect('/networking');
    }

    // Get interactions for this contact
    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });

    // Get return URL or default to networking page
    const navigateBackUrl = returnUrl || '/networking';

    return (
      <DashboardLayout>
        <div className="flex items-center space-x-2 mb-6">
          <Link
            href={navigateBackUrl}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Link>
        </div>

        <ContactPageClient 
          contact={contact} 
          interactions={interactions || []} 
          returnUrl={navigateBackUrl}
        />
      </DashboardLayout>
    );
  } catch (err) {
    // If we can't find the contact (likely because it was deleted), 
    // redirect to the networking page instead of showing an error
    return redirect('/networking');
  }
}