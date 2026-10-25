import { NextResponse, type NextRequest } from 'next/server';
import { autorizar, crearCurso } from '../../../../lib/admin';

// Alta de un curso de capacitación
export async function POST(req: NextRequest) {
  try {
    const a = await autorizar('candidatos', true);
    if ('respuesta' in a) return a.respuesta;
    const c: { nombre?: unknown; descripcion?: unknown } = await req.json().catch(() => ({}));
    const r = await crearCurso(String(c.nombre ?? ''), String(c.descripcion ?? ''));
    return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Error en /api/admin/cursos:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
