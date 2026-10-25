import { NextResponse } from 'next/server';
import { empresaActual } from '../../../../../lib/empresa';
import { eliminarDocumento, obtenerDocumento, urlDocumento } from '../../../../../lib/verificacion';

type Contexto = { params: Promise<{ id: string }> };

// Ver un documento propio (redirige a un enlace temporal)
export async function GET(_req: Request, ctx: Contexto) {
  const empresa = await empresaActual();
  if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
  const { id } = await ctx.params;
  const doc = await obtenerDocumento(id);
  if (!doc || doc.empresaId !== empresa.id) return NextResponse.json({ error: 'No encontramos ese documento.' }, { status: 404 });
  const url = await urlDocumento(doc.ruta);
  return url ? NextResponse.redirect(url) : NextResponse.json({ error: 'No pudimos abrir el documento.' }, { status: 404 });
}

// Eliminar un documento propio
export async function DELETE(_req: Request, ctx: Contexto) {
  try {
    const empresa = await empresaActual();
    if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    const { id } = await ctx.params;
    const r = await eliminarDocumento(empresa, id);
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error al eliminar un documento:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
