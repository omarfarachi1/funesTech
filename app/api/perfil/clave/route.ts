import { NextResponse, type NextRequest } from 'next/server';
import { cambiarClave, cuentaPropia } from '../../../../lib/cuenta';

// Cambiar la contraseña (postulantes, empresas y administradores)
export async function PUT(req: NextRequest) {
  try {
    const cuenta = await cuentaPropia();
    if (!cuenta) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    const c: { actual?: unknown; nueva?: unknown } = await req.json().catch(() => ({}));
    const r = await cambiarClave(cuenta, String(c.actual ?? ''), String(c.nueva ?? ''));
    if ('error' in r) return NextResponse.json(r.campo ? { errores: { [r.campo]: r.error } } : { error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/perfil/clave:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
