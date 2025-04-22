// src/app/networking/contacts/[id]/add-interaction/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionFormWrapper from './InteractionFormWrapper';

export const dynamic = 'force-dynamic';

export default async function AddInteractionPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { id } = await props.params;
  const { returnUrl } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const contactId = parseInt(id);
  const navigateBackUrl = returnUrl || `/networking/contacts/${id}`;

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

      <PageHeader title="Add Interaction" />

      <div className="mt-4">
        <InteractionFormWrapper
          preselectedContactId={contactId}
          returnUrl={navigateBackUrl}
        />
      </div>
    </DashboardLayout>
  );
}