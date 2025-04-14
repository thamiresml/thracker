// src/components/LogoutButton.tsx
'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Logout</span>
    </button>
  );
}