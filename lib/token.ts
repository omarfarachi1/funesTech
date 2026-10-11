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

// En producción no se acepta una clave por defecto: si falta SESSION_SECRET, la app avisa en lugar de funcionar sin protección.
function clave() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto && process.env.NODE_ENV === 'production') {
    throw new Error('Falta SESSION_SECRET en las variables de entorno.');
  }
  return new TextEncoder().encode(secreto || 'cambiar-este-secreto-de-desarrollo');
}

export function firmar(datos: DatosSesion) {
  return new SignJWT({ ...datos })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACION}s`)
    .sign(clave());
}

export async function verificar(token: string): Promise<DatosSesion | null> {
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ['HS256'] });
    return payload as unknown as DatosSesion;
  } catch {
    return null;
  }
}