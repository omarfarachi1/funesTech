import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { autorizar, crearAdmin } from '../../../../lib/admin';
import { normalizarDni } from '../../../../lib/validar';
import { validarAdmin, type DatosAdmin } from '../../../../lib/roles';

async function procesar(req: NextRequest) {
  const a = await autorizar('administradores', true);
  if ('respuesta' in a) return a.respuesta;

  const c = await req.json().catch(() => null);
  if (!c) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
  const d: DatosAdmin = {
    nombre: String(c.nombre ?? '').trim(),
    dni: normalizarDni(String(c.dni ?? '')),
    fechaNacimiento: String(c.fechaNacimiento ?? ''),
    email: String(c.email ?? '').trim().toLowerCase(),
    usuario: String(c.usuario ?? '').trim().toLowerCase(),
    password: String(c.password ?? ''),
    rol: String(c.rol ?? ''),
  };
  const errores = validarAdmin(d, 'crear');
  if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

  const r = await crearAdmin(d, await bcrypt.hash(d.password, 10));
  if ('error' in r) return NextResponse.json({ errores: { [r.campo ?? 'usuario']: r.error } }, { status: 409 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function POST(req: NextRequest) {
  try {
    return await procesar(req);
  } catch (err) {
    console.error('Error en /api/admin/administradores:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
