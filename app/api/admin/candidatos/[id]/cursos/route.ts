import { NextResponse, type NextRequest } from 'next/server';
import { autorizar, derivarACurso } from '../../../../../../lib/admin';

// Registrar la derivación de un postulante a un curso
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await autorizar('candidatos', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { cursoId?: unknown; observaciones?: unknown } = await req.json().catch(() => ({}));
    const r = await derivarACurso(a.admin, id, String(c.cursoId ?? ''), String(c.observaciones ?? ''));
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Error al derivar a un curso:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
