import { NextResponse, type NextRequest } from 'next/server';
import { autorizar, cambiarHabilitada } from '../../../../../lib/admin';

// Habilitar o deshabilitar la cuenta de un candidato o una empresa
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await autorizar('candidatos', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { habilitada?: unknown } = await req.json().catch(() => ({}));
    if (typeof c.habilitada !== 'boolean') return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    return (await cambiarHabilitada(id, c.habilitada))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: 'No encontramos esa cuenta.' }, { status: 404 });
  } catch (err) {
    console.error('Error en /api/admin/cuentas/[id]:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
