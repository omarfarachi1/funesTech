import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { buscarPorUsuario } from '../../../lib/cuentas';
import { crearSesion } from '../../../lib/session';

// Límite simple de intentos fallidos por IP (5 cada 10 minutos)
const fallos = new Map<string, number[]>();
const VENTANA = 10 * 60 * 1000;

function intentosRecientes(ip: string) {
  const lista = (fallos.get(ip) ?? []).filter((t) => Date.now() - t < VENTANA);
  fallos.set(ip, lista);
  return lista;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

  if (intentosRecientes(ip).length >= 5) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' },
      { status: 429 }
    );
  }

  const cuerpo: { usuario?: string; password?: string } = await req
    .json()
    .catch(() => ({}));
  const cuenta = await buscarPorUsuario(String(cuerpo.usuario ?? '').trim().toLowerCase());
  const ok = cuenta ? await bcrypt.compare(String(cuerpo.password ?? ''), cuenta.hash) : false;

  if (!cuenta || !ok) {
    fallos.set(ip, [...intentosRecientes(ip), Date.now()]);
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos. Revisá los datos e intentá de nuevo.' },
      { status: 401 }
    );
  }

  await crearSesion({
    usuario: cuenta.usuario,
    nombre: cuenta.nombre,
    tipo: cuenta.tipo,
    personeria: cuenta.personeria,
  });
  return NextResponse.json({ ok: true });
}
