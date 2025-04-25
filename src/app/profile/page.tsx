import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ProfileSection from './ProfileSection';
import DocumentsSection from './DocumentsSection';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile information
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader
          title="Profile"
          description="Manage your profile information and documents"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-6">
          {/* Profile details section (left) */}
          <div className="lg:col-span-2">
            <ProfileSection 
              userId={user?.id || ''} 
              profile={profile}
            />
          </div>
          
          {/* Documents section (right) */}
          <div className="lg:col-span-3">
            <DocumentsSection 
              userId={user?.id || ''}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 