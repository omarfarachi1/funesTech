import { NextResponse } from 'next/server';
import { autorizar } from '../../../../../../../lib/admin';
import { obtenerDocumento, urlDocumento } from '../../../../../../../lib/verificacion';

// La Municipalidad abre un documento de una empresa (enlace temporal de 1 minuto)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; docId: string }> }) {
  const a = await autorizar('empresas');
  if ('respuesta' in a) return a.respuesta;
  const { id, docId } = await ctx.params;
  const doc = await obtenerDocumento(docId);
  if (!doc || doc.empresaId !== id) return NextResponse.json({ error: 'No encontramos ese documento.' }, { status: 404 });
  const url = await urlDocumento(doc.ruta);
  return url ? NextResponse.redirect(url) : NextResponse.json({ error: 'No pudimos abrir el documento.' }, { status: 404 });
}
