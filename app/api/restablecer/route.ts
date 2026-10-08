import { NextResponse, type NextRequest } from 'next/server';
import { restablecer } from '../../../lib/recuperar';
import { errorPassword } from '../../../lib/validar';

export async function POST(req: NextRequest) {
  const cuerpo: { token?: string; password?: string } = await req.json().catch(() => ({}));
  const password = String(cuerpo.password ?? '');

  const mensaje = errorPassword(password);
  if (mensaje) return NextResponse.json({ error: mensaje }, { status: 400 });

  const ok = await restablecer(String(cuerpo.token ?? ''), password);
  if (!ok) {
    return NextResponse.json({ error: 'El enlace venció o ya se usó. Pedí uno nuevo.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
