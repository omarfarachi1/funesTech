import { NextResponse } from 'next/server';
import { empresaActual, postulacionDeEmpresa, urlCvPostulante } from '../../../../../../lib/empresa';

// Ver el CV de un postulante (redirige a un enlace temporal de 1 minuto)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const empresa = await empresaActual();
  if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
  const { id } = await ctx.params;
  const p = await postulacionDeEmpresa(empresa.id, id);
  if (!p?.cvPath) return NextResponse.json({ error: 'No hay un CV disponible.' }, { status: 404 });
  const url = await urlCvPostulante(p.cvPath);
  if (!url) return NextResponse.json({ error: 'No pudimos abrir el CV.' }, { status: 404 });
  return NextResponse.redirect(url);
}
