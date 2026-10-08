// Validación compartida: la usa el formulario (cliente) y la API (servidor).
export type TipoCuenta = 'persona' | 'empresa';
export type Personeria = 'fisica' | 'juridica';
export type Campo = 'nombre' | 'dni' | 'fechaNacimiento' | 'email' | 'usuario' | 'password';
export type Errores = Partial<Record<Campo, string>>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DatosRegistro = {
  tipo: TipoCuenta;
  personeria?: Personeria;
  nombre: string;
  dni: string;
  fechaNacimiento: string; // AAAA-MM-DD
  email: string;
  usuario: string;
  password: string;
};

export const esJuridica = (d: Pick<DatosRegistro, 'tipo' | 'personeria'>) =>
  d.tipo === 'empresa' && d.personeria === 'juridica';

export const normalizarDni = (v: string) => v.replace(/[.\s-]/g, '');

function edad(fecha: string, hoy = new Date()) {
  const [y, m, d] = fecha.split('-').map(Number);
  let e = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e;
}

export function validarRegistro(d: DatosRegistro): Errores {
  const e: Errores = {};
  const juridica = esJuridica(d);

  const nombre = d.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) {
    e.nombre = juridica ? 'Ingresá la razón social.' : 'Ingresá tu nombre y apellido.';
  }

  const dni = normalizarDni(d.dni);
  if (juridica) {
    if (!/^\d{11}$/.test(dni)) e.dni = 'El CUIT tiene 11 números, sin guiones.';
  } else if (!/^\d{7,8}$/.test(dni)) {
    e.dni = 'El DNI tiene 7 u 8 números, sin puntos.';
  }

  const f = d.fechaNacimiento;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(Date.parse(f)) || f < '1900-01-01') {
    e.fechaNacimiento = 'Ingresá una fecha válida.';
  } else if (new Date(f) > new Date()) {
    e.fechaNacimiento = 'La fecha no puede ser futura.';
  } else if (!juridica) {
    const min = d.tipo === 'persona' ? 16 : 18;
    if (edad(f) < min) e.fechaNacimiento = `Tenés que tener al menos ${min} años para registrarte.`;
  }

  const email = d.email.trim();
  if (!email) e.email = 'Ingresá tu correo electrónico.';
  else if (email.length > 120 || !EMAIL_RE.test(email)) e.email = 'Ingresá un correo válido.';

  if (!/^[a-z0-9._-]{4,30}$/.test(d.usuario.trim().toLowerCase())) {
    e.usuario = 'Usá entre 4 y 30 letras, números, punto, guion o guion bajo.';
  }

  if (d.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (d.password.length > 72) e.password = 'La contraseña no puede superar los 72 caracteres.';

  return e;
}

// ---------- Perfil del postulante ----------
export type CampoPerfil = 'nombre' | 'fechaNacimiento' | 'email' | 'telefono' | 'localidad' | 'presentacion';
export type DatosPerfil = Record<CampoPerfil, string>;
export type ErroresPerfil = Partial<Record<CampoPerfil, string>>;

export function validarPerfil(d: DatosPerfil): ErroresPerfil {
  const e: ErroresPerfil = {};

  const nombre = d.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) e.nombre = 'Ingresá tu nombre y apellido.';

  const f = d.fechaNacimiento;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(Date.parse(f)) || f < '1900-01-01') {
    e.fechaNacimiento = 'Ingresá una fecha válida.';
  } else if (new Date(f) > new Date()) {
    e.fechaNacimiento = 'La fecha no puede ser futura.';
  } else if (edad(f) < 16) {
    e.fechaNacimiento = 'Tenés que tener al menos 16 años.';
  }

  const email = d.email.trim();
  if (!email) e.email = 'Ingresá tu correo electrónico.';
  else if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    e.email = 'Ingresá un correo válido.';
  }

  const tel = d.telefono.trim();
  if (tel && !/^[0-9+()\s-]{6,20}$/.test(tel)) {
    e.telefono = 'Usá solo números, espacios, + ( ) o guiones (de 6 a 20 caracteres).';
  }

  if (d.localidad.trim().length > 80) e.localidad = 'Máximo 80 caracteres.';
  if (d.presentacion.trim().length > 600) e.presentacion = 'Máximo 600 caracteres.';
  return e;
}

export function errorPassword(p: string): string | null {
  if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (p.length > 72) return 'La contraseña no puede superar los 72 caracteres.';
  return null;
}
