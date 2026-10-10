import { NextResponse, type NextRequest } from 'next/server';
import { db } from '../../../lib/supabase';

// RUTA TEMPORAL DE DIAGNÓSTICO: borrarla cuando termines de probar.
// No muestra claves: solo indica si cada variable existe y si la base responde.
export async function GET(req: NextRequest) {
  const resultado: Record<string, unknown> = {
    version: 'lee-supabase', // si ves esto, el sitio tiene el código nuevo
    entorno: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    rama: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    variables: {
      URL_de_Supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
      SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    },
  };

  try {
    const { count, error } = await db().from('cuentas').select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    resultado.cuentasEnLaBase = count;

    const usuario = req.nextUrl.searchParams.get('usuario')?.trim().toLowerCase();
    if (usuario) {
      const { data, error: e2 } = await db().from('cuentas').select('id').eq('usuario', usuario).maybeSingle();
      if (e2) throw new Error(e2.message);
      resultado.usuarioExiste = Boolean(data);
    }
    resultado.conexion = 'ok';
  } catch (err) {
    resultado.conexion = 'error';
    resultado.mensaje = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
}