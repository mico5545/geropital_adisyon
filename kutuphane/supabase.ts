import { createClient } from "@supabase/supabase-js";

const supabaseAdresi =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bagdpvuujltcysniukry.supabase.co";

const supabaseAnonAnahtari =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_7iNM53rPPMlbZM_GxbBIxw_dJP6RQqw";

export const supabase = createClient(
  supabaseAdresi,
  supabaseAnonAnahtari
);