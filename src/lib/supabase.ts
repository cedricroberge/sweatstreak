// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,   // keep users logged in (if you later use Supabase Auth)
      autoRefreshToken: true, // refresh in background
      storageKey: 'sweatstreak-auth'
    }
  }
)
