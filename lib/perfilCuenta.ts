import { EMAIL_RE } from './validar';

// Datos que pueden modificar las empresas y los administradores en su perfil
export type DatosCuenta = { nombre: string; email: string; telefono: string; localidad: string; presentacion: string };
export type ErroresCuenta = Partial<Record<keyof DatosCuenta, string>>;

export function validarCuenta(d: DatosCuenta): ErroresCuenta {
  const e: ErroresCuenta = {};
  const nombre = d.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) e.nombre = 'Ingresá el nombre (entre 2 y 100 caracteres).';

  const email = d.email.trim();
  if (!email) e.email = 'Ingresá el correo electrónico.';
  else if (email.length > 120 || !EMAIL_RE.test(email)) e.email = 'Ingresá un correo válido.';

  const tel = d.telefono.trim();
  if (tel && !/^[0-9+()\s-]{6,20}$/.test(tel)) e.telefono = 'Usá solo números, espacios, + ( ) o guiones (de 6 a 20 caracteres).';

  if (d.localidad.trim().length > 80) e.localidad = 'Máximo 80 caracteres.';
  if (d.presentacion.trim().length > 600) e.presentacion = 'Máximo 600 caracteres.';
  return e;
}
