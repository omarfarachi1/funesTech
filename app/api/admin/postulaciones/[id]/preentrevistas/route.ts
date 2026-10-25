import { NextResponse, type NextRequest } from 'next/server';
import { autorizar, registrarPreentrevista } from '../../../../../../lib/admin';

// Registrar una preentrevista asociada al postulante y a la postulación
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await autorizar('candidatos', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { resultado?: unknown; observaciones?: unknown; fecha?: unknown } = await req.json().catch(() => ({}));
    const r = await registrarPreentrevista(a.admin, id, {
      resultado: String(c.resultado ?? ''),
      observaciones: String(c.observaciones ?? ''),
      fecha: String(c.fecha ?? ''),
    });
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Error al registrar la preentrevista:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
