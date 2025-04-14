// src/app/networking/interactions/[id]/edit/page.tsx

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionFormWrapper from './InteractionFormWrapper';

export const dynamic = 'force-dynamic';

export default async function EditInteractionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

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

  // Fetch interaction with contact data
  const { data: interaction, error } = await supabase
    .from('interactions')
    .select(`
      *,
      contact:contacts (id, name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !interaction) {
    console.error('Error fetching interaction:', error);
    notFound();
  }

  // Get return URL based on whether this interaction is tied to a contact
  const returnUrl = interaction.contact_id
    ? `/networking/contacts/${interaction.contact_id}`
    : '/networking';

  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link
          href={returnUrl}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to {interaction.contact ? 'Contact' : 'Contacts'}</span>
        </Link>
      </div>

      <PageHeader title={`Edit Interaction with ${interaction.contact?.name || 'Contact'}`} />

      <div className="mt-4">
        <InteractionFormWrapper
          interactionId={parseInt(id)}
          initialData={interaction}
          returnUrl={returnUrl}
        />
      </div>
    </DashboardLayout>
  );
}