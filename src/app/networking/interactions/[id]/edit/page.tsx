'use client';

import { useState, useEffect } from 'react';
import { notFound, redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import InteractionForm from '@/app/networking/InteractionForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// This needs to be a client component to use the form wrapper

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditInteractionPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [interaction, setInteraction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get the interaction ID from params
  const { id } = params;
  
  // Fetch the interaction data
  useEffect(() => {
    const fetchInteraction = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return router.push('/auth/login');
        }
        
        // Fetch interaction
        const { data, error } = await supabase
          .from('interactions')
          .select(`
            *,
            contact:contacts (id, name)
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Interaction not found');
        
        setInteraction(data);
      } catch (err: any) {
        console.error('Error fetching interaction:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInteraction();
  }, [id, router, supabase]);
  
  // Handle close
  const handleClose = () => {
    router.push(`/networking/contacts/${interaction?.contact_id}`);
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !interaction) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          {error || 'Interaction not found'}
        </div>
        <div className="mt-4">
          <Link
            href="/networking"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Back to Contacts
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  
  const returnUrl = `/networking/contacts/${interaction.contact_id}`;
  
  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href={returnUrl}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Contact</span>
        </Link>
      </div>
      
      <PageHeader 
        title={`Edit Interaction with ${interaction.contact?.name}`} 
      />
      
      <div className="mt-4">
        <InteractionForm 
          onClose={handleClose}
          interactionId={parseInt(id)}
          preselectedContactId={interaction.contact_id}
          initialData={interaction}
        />
      </div>
    </DashboardLayout>
  );
}