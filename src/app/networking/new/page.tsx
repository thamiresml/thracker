// src/app/networking/new/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionForm from '../InteractionForm';

export const dynamic = 'force-dynamic';

export default async function AddInteractionPage(props: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const { contactId } = await props.searchParams;

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const preselectedContactId = contactId ? parseInt(contactId) : undefined;

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