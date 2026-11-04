// Cliente de Supabase. Solo usa datos PÚBLICOS (URL + publishable key).
// La seguridad real está en la base (RLS), no acá.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigurado = Boolean(url && key);

export const supabase = supabaseConfigurado
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // los links de invitación/recuperación se procesan a mano (token_hash)
        detectSessionInUrl: false,
      },
    })
  : null;

export const BUCKET = "public-images";

export function urlPublica(path) {
  if (!supabase || !path) return "";
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
