import { createClient, SupabaseClient } from "@supabase/supabase-js";

let istemci: SupabaseClient | null = null;

export function supabaseAl() {
  if (istemci) return istemci;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://bagdpvuujltcysniukry.supabase.co";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "sb_publishable_7iNM53rPPMlbZM_GxbBIxw_dJP6RQqw";

  istemci = createClient(url, key);
  return istemci;
}