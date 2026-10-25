import { NextResponse, type NextRequest } from 'next/server';
import { autorizar } from '../../../../../lib/admin';
import { evaluarEmpresa } from '../../../../../lib/verificacion';

// La Municipalidad verifica la empresa jurídica o le deja observaciones
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await autorizar('empresas', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { accion?: unknown; nota?: unknown } = await req.json().catch(() => ({}));
    if (c.accion !== 'verificar' && c.accion !== 'observar') return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 });
    const r = await evaluarEmpresa(a.admin, id, c.accion, String(c.nota ?? ''));
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/admin/empresas/[id]:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
