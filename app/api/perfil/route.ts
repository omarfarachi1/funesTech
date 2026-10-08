import { NextResponse, type NextRequest } from 'next/server';
import { actualizarPerfil, perfilActual } from '../../../lib/postulante';
import { validarPerfil, type DatosPerfil } from '../../../lib/validar';

export async function PUT(req: NextRequest) {
  const perfil = await perfilActual();
  if (!perfil) {
    return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
  }
  const c = await req.json().catch(() => null);
  if (!c) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });

  const datos: DatosPerfil = {
    nombre: String(c.nombre ?? '').trim(),
    fechaNacimiento: String(c.fechaNacimiento ?? ''),
    email: String(c.email ?? '').trim().toLowerCase(),
    telefono: String(c.telefono ?? '').trim(),
    localidad: String(c.localidad ?? '').trim(),
    presentacion: String(c.presentacion ?? '').trim(),
  };
  const errores = validarPerfil(datos);
  if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

  const fallo = await actualizarPerfil(perfil.id, datos);
  if (fallo) return NextResponse.json({ errores: { email: fallo.error } }, { status: 409 });
  return NextResponse.json({ ok: true });
}
