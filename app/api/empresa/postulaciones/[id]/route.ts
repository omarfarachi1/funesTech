import { NextResponse, type NextRequest } from 'next/server';
import { decidirContratacion, empresaActual } from '../../../../../lib/empresa';
import { esUuid } from '../../../../../lib/validar';

// La empresa informa si contrata o no al candidato derivado (si no contrata, el motivo es obligatorio)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const empresa = await empresaActual();
    if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    const { id } = await ctx.params;
    const c: { decision?: unknown; motivo?: unknown } = await req.json().catch(() => ({}));
    if (!esUuid(id) || (c.decision !== 'contratar' && c.decision !== 'no_contratar')) {
      return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    }
    const r = await decidirContratacion(empresa.id, id, c.decision === 'contratar', String(c.motivo ?? ''));
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error al registrar la decisión de la empresa:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
