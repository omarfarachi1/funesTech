import { SignJWT, jwtVerify } from 'jose';
import type { Personeria, TipoCuenta } from './validar';

export const COOKIE = 'funes_sesion';
export const DURACION = 60 * 60 * 8; // 8 horas

export type DatosSesion = {
  usuario: string;
  nombre: string;
  tipo: TipoCuenta;
  personeria?: Personeria;
};

const clave = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'cambiar-este-secreto-de-desarrollo'
);

export function firmar(datos: DatosSesion) {
  return new SignJWT({ ...datos })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACION}s`)
    .sign(clave);
}

export async function verificar(token: string): Promise<DatosSesion | null> {
  try {
    const { payload } = await jwtVerify(token, clave, { algorithms: ['HS256'] });
    return payload as unknown as DatosSesion;
  } catch {
    return null;
  }
}
