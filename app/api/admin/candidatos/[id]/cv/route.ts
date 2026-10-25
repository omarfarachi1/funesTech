import { NextResponse } from 'next/server';
import { autorizar, rutasCandidato } from '../../../../../../lib/admin';
import { urlCvPostulante } from '../../../../../../lib/empresa';

// Ver el CV de un candidato (redirige a un enlace temporal de 1 minuto)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await autorizar('candidatos');
  if ('respuesta' in a) return a.respuesta;
  const { id } = await ctx.params;
  const r = await rutasCandidato(id);
  if (!r?.cvPath) return NextResponse.json({ error: 'No hay un CV disponible.' }, { status: 404 });
  const url = await urlCvPostulante(r.cvPath);
  if (!url) return NextResponse.json({ error: 'No pudimos abrir el CV.' }, { status: 404 });
  return NextResponse.redirect(url);
}
