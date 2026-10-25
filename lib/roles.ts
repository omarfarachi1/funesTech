import { EMAIL_RE, edad, errorPassword, normalizarDni } from './validar';

// Roles de los administradores
export const ROLES = {
  superadmin: {
    nombre: 'Superadministrador',
    descripcion: 'Puede todo: administra a otros administradores y sus roles, las ofertas y los candidatos.',
  },
  gestor: {
    nombre: 'Gestor',
    descripcion: 'Revisa, publica y modifica ofertas, y gestiona candidatos. No administra otros administradores.',
  },
  consulta: {
    nombre: 'Consulta',
    descripcion: 'Solo puede ver ofertas y candidatos. No puede modificar nada.',
  },
} as const;

export type RolAdmin = keyof typeof ROLES;
export const esRol = (v: unknown): v is RolAdmin => typeof v === 'string' && v in ROLES;

export type Recurso = 'ofertas' | 'candidatos' | 'empresas' | 'administradores';

// Quién puede ver cada sección
export const puede = (rol: RolAdmin, recurso: Recurso) => (recurso === 'administradores' ? rol === 'superadmin' : true);
// Quién puede modificarla
export const puedeEscribir = (rol: RolAdmin, recurso: Recurso) =>
  recurso === 'administradores' ? rol === 'superadmin' : rol !== 'consulta';

export type CampoAdmin = 'nombre' | 'dni' | 'fechaNacimiento' | 'email' | 'usuario' | 'password' | 'rol';
export type DatosAdmin = Record<CampoAdmin, string>;
export type ErroresAdmin = Partial<Record<CampoAdmin, string>>;

// En "editar" no se cambian DNI, fecha ni usuario, y la contraseña es opcional.
export function validarAdmin(d: DatosAdmin, modo: 'crear' | 'editar'): ErroresAdmin {
  const e: ErroresAdmin = {};
  const nombre = d.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) e.nombre = 'Ingresá el nombre y apellido.';

  const email = d.email.trim();
  if (!email) e.email = 'Ingresá el correo electrónico.';
  else if (email.length > 120 || !EMAIL_RE.test(email)) e.email = 'Ingresá un correo válido.';

  if (!esRol(d.rol)) e.rol = 'Elegí un rol.';

  if (modo === 'crear') {
    if (!/^\d{7,8}$/.test(normalizarDni(d.dni))) e.dni = 'El DNI tiene 7 u 8 números, sin puntos.';
    const f = d.fechaNacimiento;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(Date.parse(f)) || f < '1900-01-01') e.fechaNacimiento = 'Ingresá una fecha válida.';
    else if (new Date(f) > new Date()) e.fechaNacimiento = 'La fecha no puede ser futura.';
    else if (edad(f) < 18) e.fechaNacimiento = 'Tiene que ser mayor de 18 años.';
    if (!/^[a-z0-9._-]{4,30}$/.test(d.usuario.trim().toLowerCase())) {
      e.usuario = 'Usá entre 4 y 30 letras, números, punto, guion o guion bajo.';
    }
    const ep = errorPassword(d.password);
    if (ep) e.password = ep;
  } else if (d.password) {
    const ep = errorPassword(d.password);
    if (ep) e.password = ep;
  }
  return e;
}
