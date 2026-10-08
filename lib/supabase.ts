import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente de Supabase para uso EXCLUSIVO del servidor (usa la clave secreta).
// Esta clave nunca debe llegar al navegador: no usar el prefijo NEXT_PUBLIC_.
let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) {
    throw new Error('Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) o SUPABASE_SECRET_KEY en .env.local');
  }
  cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}
