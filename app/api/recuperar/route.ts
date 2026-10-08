import { NextResponse, type NextRequest } from 'next/server';
import { solicitarRecuperacion } from '../../../lib/recuperar';
import { EMAIL_RE } from '../../../lib/validar';

// Límite por conexión: 5 pedidos por hora
const pedidos = new Map<string, number[]>();
const VENTANA = 60 * 60 * 1000;

// La respuesta es siempre la misma, exista o no el correo, para no revelar qué correos están registrados.
const MENSAJE =
  'Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Revisá también la carpeta de spam.';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const recientes = (pedidos.get(ip) ?? []).filter((t) => Date.now() - t < VENTANA);
  if (recientes.length >= 5) {
    return NextResponse.json({ error: 'Hiciste demasiados pedidos. Probá de nuevo más tarde.' }, { status: 429 });
  }
  pedidos.set(ip, [...recientes, Date.now()]);

  const cuerpo: { email?: string } = await req.json().catch(() => ({}));
  const email = String(cuerpo.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ error: 'Ingresá un correo válido.' }, { status: 400 });
  }

  try {
    await solicitarRecuperacion(email);
  } catch (err) {
    console.error('Error al enviar la recuperación de contraseña:', err);
  }
  return NextResponse.json({ ok: true, mensaje: MENSAJE });
}
