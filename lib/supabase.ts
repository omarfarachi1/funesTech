import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase a veces responde "JWT issued at future" (error PGRST303) por una diferencia de reloj entre
// sus propios servicios. Es ajeno a esta aplicación y suele durar poco: se reintenta hasta 4 veces,
// esperando un poco más cada vez, sin importar el código de estado de la respuesta.
const ESPERAS_MS = [300, 700, 1200, 2000];

async function fetchConReintento(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let intento = 0; ; intento++) {
    const r = await fetch(input, init);
    if (r.ok || intento >= ESPERAS_MS.length) return r;
    const texto = await r.clone().text().catch(() => '');
    if (!texto.includes('issued at future')) return r;
    await new Promise((ok) => setTimeout(ok, ESPERAS_MS[intento]));
  }
}

// Cliente de Supabase para uso EXCLUSIVO del servidor (usa la clave secreta).
// Esta clave nunca debe llegar al navegador: no usar el prefijo NEXT_PUBLIC_.
let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) {
    throw new Error('Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) o SUPABASE_SECRET_KEY en las variables de entorno');
  }
  cliente = createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchConReintento },
  });
  return cliente;
}
