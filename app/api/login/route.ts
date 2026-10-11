import { NextResponse, type NextRequest } from 'next/server';
import { db } from '../../../lib/supabase';

// RUTA TEMPORAL DE DIAGNÓSTICO: borrarla cuando termines de probar.
// No muestra claves completas: solo largos, formato y el resultado de la conexión.
export async function GET(req: NextRequest) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const clave = process.env.SUPABASE_SECRET_KEY ?? '';

  const resultado: Record<string, unknown> = {
    version: 'lee-supabase',
    entorno: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    rama: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    variables: {
      URL_de_Supabase: Boolean(url),
      SUPABASE_SECRET_KEY: Boolean(clave),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    },
    detalle: {
      url_largo: url.length,
      url_empieza_con_https: url.startsWith('https://'),
      url_termina_en_supabase_co: url.endsWith('.supabase.co'),
      url_con_espacios: url !== url.trim(),
      clave_largo: clave.length,
      clave_prefijo: clave.slice(0, 7),
      clave_con_espacios: clave !== clave.trim(),
      sesion_largo: (process.env.SESSION_SECRET ?? '').length,
    },
  };

  // 1) Prueba directa contra la API de Supabase (sin librería), para ver el código HTTP real
  try {
    const r = await fetch(`${url.trim().replace(/\/$/, '')}/rest/v1/cuentas?select=id&limit=1`, {
      headers: { apikey: clave.trim() },
      cache: 'no-store',
    });
    resultado.rest_status = r.status;
    resultado.rest_respuesta = (await r.text()).slice(0, 160);
  } catch (err) {
    resultado.rest_status = 'no se pudo conectar';
    resultado.rest_respuesta = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  // 2) Prueba con la misma librería que usa la app
  try {
    const { count, error } = await db().from('cuentas').select('id', { count: 'exact', head: true });
    if (error) {
      resultado.conexion = 'error';
      resultado.supabase = { message: error.message, code: error.code, details: error.details, hint: error.hint };
    } else {
      resultado.conexion = 'ok';
      resultado.cuentasEnLaBase = count;
      const usuario = req.nextUrl.searchParams.get('usuario')?.trim().toLowerCase();
      if (usuario) {
        const { data } = await db().from('cuentas').select('id').eq('usuario', usuario).maybeSingle();
        resultado.usuarioExiste = Boolean(data);
      }
    }
  } catch (err) {
    resultado.conexion = 'error';
    resultado.mensaje = err instanceof Error ? `${err.name}: ${err.message || '(sin mensaje)'}` : String(err);
  }

  return NextResponse.json(resultado, { headers: { 'Cache-Control': 'no-store' } });
}