// src/app/auth/register/page.tsx

import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  // Check if user is already logged in
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect to dashboard if already logged in
  if (session) {
    redirect('/')
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">JobTrackr</h1>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
      </div>
    </div>
  )
}