import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionFormWrapper from './InteracionFormWrapper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string }; // contact id
}

export default async function AddInteractionPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const contactId = parseInt(id);

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

      <PageHeader title="Add Interaction" />

      <div className="mt-4">
        <InteractionFormWrapper
          preselectedContactId={contactId}
          returnUrl={`/networking/contacts/${id}`}
        />
      </div>
    </DashboardLayout>
  );
}