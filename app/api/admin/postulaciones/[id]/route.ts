import { NextResponse, type NextRequest } from 'next/server';
import { autorizar, derivarPostulacion, descartarPostulacion } from '../../../../../lib/admin';

// La Municipalidad deriva la postulación a la empresa (la preentrevista es opcional) o la descarta
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await autorizar('candidatos', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { accion?: unknown; nota?: unknown } = await req.json().catch(() => ({}));
    const nota = String(c.nota ?? '').trim().slice(0, 500);
    const r =
      c.accion === 'derivar' ? await derivarPostulacion(a.admin, id, nota)
      : c.accion === 'descartar' ? await descartarPostulacion(a.admin, id, nota)
      : null;
    if (!r) return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 });
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/admin/postulaciones/[id]:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
