// src/lib/supabase.ts
//import { createClient } from '@supabase/supabase-js';
//import { cookies } from 'next/headers';

// These values should come from your .env.local file
//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Base client - use this for client components
//export const supabase = createClient(supabaseUrl, supabaseKey);

// // Server component client with cookie handling
// export function createServerSupabaseClient() {
//   const cookieStore = cookies();
  
//   return createClient(
//     supabaseUrl,
//     supabaseKey,
//     {
//       cookies: {
//         get: (name) => cookieStore.get(name)?.value,
//         set: () => {},
//         remove: () => {},
//       },
//     }
//   );
// }