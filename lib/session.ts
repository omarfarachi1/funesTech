import { cookies } from 'next/headers';
import { COOKIE, DURACION, firmar, verificar, type DatosSesion } from './token';

export async function crearSesion(datos: DatosSesion) {
  const token = await firmar(datos);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACION,
    path: '/',
  });
}

export async function obtenerSesion(): Promise<DatosSesion | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return token ? verificar(token) : null;
}

export async function borrarSesion() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
