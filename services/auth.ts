export async function getInitialSession(supabase: any) {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function subscribeToAuthChanges(supabase: any, cb: (session: any) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event: any, next: any) => cb(next));
  return () => data.subscription.unsubscribe();
}

export async function fetchProfileUsername(supabase: any, userId: string) {
  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
  if (error) return null;
  return (data as any)?.username ?? null;
}

export async function signOut(supabase: any) {
  await supabase.auth.signOut();
}