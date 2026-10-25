import { NextResponse, type NextRequest } from 'next/server';
import { actualizarCuenta, cuentaPropia } from '../../../../lib/cuenta';
import { validarCuenta, type DatosCuenta } from '../../../../lib/perfilCuenta';

// Modificar los datos del perfil de una empresa o un administrador (el postulante usa /api/perfil)
export async function PUT(req: NextRequest) {
  try {
    const cuenta = await cuentaPropia();
    if (!cuenta) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    if (cuenta.tipo === 'persona') return NextResponse.json({ error: 'Esta acción no corresponde a tu cuenta.' }, { status: 403 });

    const c = await req.json().catch(() => null);
    if (!c) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    const d: DatosCuenta = {
      nombre: String(c.nombre ?? '').trim(),
      email: String(c.email ?? '').trim().toLowerCase(),
      telefono: String(c.telefono ?? '').trim(),
      localidad: String(c.localidad ?? '').trim(),
      presentacion: String(c.presentacion ?? '').trim(),
    };
    const errores = validarCuenta(d);
    if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

    const r = await actualizarCuenta(cuenta, d);
    if ('error' in r) return NextResponse.json(r.campo ? { errores: { [r.campo]: r.error } } : { error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/perfil/cuenta:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
