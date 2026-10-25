import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { contarAdmins, crearAdmin } from '../../../lib/admin';
import { validarAdmin, type DatosAdmin } from '../../../lib/roles';
import { normalizarDni } from '../../../lib/validar';

// Máximo 5 códigos incorrectos por hora y por conexión
const fallos = new Map<string, number[]>();
const VENTANA = 60 * 60 * 1000;
const recientes = (ip: string) => {
  const lista = (fallos.get(ip) ?? []).filter((t) => Date.now() - t < VENTANA);
  fallos.set(ip, lista);
  return lista;
};

function codigoCorrecto(dado: string, esperado: string) {
  const a = Buffer.from(dado);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function procesar(req: NextRequest) {
  const esperado = process.env.CODIGO_INSTALACION ?? '';
  if (esperado.length < 8) {
    return NextResponse.json(
      { error: 'Falta definir CODIGO_INSTALACION (de 8 caracteres o más) en las variables de entorno.' },
      { status: 503 }
    );
  }
  // Solo funciona mientras no exista ningún administrador
  if ((await contarAdmins()) > 0) {
    return NextResponse.json({ error: 'La configuración inicial ya se hizo.' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (recientes(ip).length >= 5) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo más tarde.' }, { status: 429 });
  }

  const c = await req.json().catch(() => null);
  if (!c) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });

  if (!codigoCorrecto(String(c.codigo ?? ''), esperado)) {
    fallos.set(ip, [...recientes(ip), Date.now()]);
    return NextResponse.json({ errores: { codigo: 'El código de instalación no es correcto.' } }, { status: 401 });
  }

  const d: DatosAdmin = {
    nombre: String(c.nombre ?? '').trim(),
    dni: normalizarDni(String(c.dni ?? '')),
    fechaNacimiento: String(c.fechaNacimiento ?? ''),
    email: String(c.email ?? '').trim().toLowerCase(),
    usuario: String(c.usuario ?? '').trim().toLowerCase(),
    password: String(c.password ?? ''),
    rol: 'superadmin',
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
    console.error('Error en /api/configurar:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
