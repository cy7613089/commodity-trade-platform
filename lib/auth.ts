import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function getUserSession() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getUserSession();
  if (!session) return null;
  
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isUserLoggedIn() {
  const session = await getUserSession();
  return !!session;
}

export async function signOut() {
  const supabase = createServerComponentClient<Database>({ cookies });
  await supabase.auth.signOut();
} 