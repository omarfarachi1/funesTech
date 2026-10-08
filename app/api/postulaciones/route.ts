import { NextResponse, type NextRequest } from 'next/server';
import { perfilActual, postular } from '../../../lib/postulante';

export async function POST(req: NextRequest) {
  const perfil = await perfilActual();
  if (!perfil) {
    return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
  }
  const cuerpo: { ofertaId?: string } = await req.json().catch(() => ({}));
  const r = await postular(perfil, String(cuerpo.ofertaId ?? ''));
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}
