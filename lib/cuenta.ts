import { cache } from 'react';
import bcrypt from 'bcryptjs';
import { db } from './supabase';
import { obtenerSesion } from './session';
import { buscarPorUsuario } from './cuentas';
import { errorPassword } from './validar';
import type { DatosCuenta } from './perfilCuenta';

export type CuentaPropia = DatosCuenta & {
  id: string;
  tipo: 'persona' | 'empresa' | 'admin';
  usuario: string;
  dni: string;
  personeria: 'fisica' | 'juridica' | null;
  rol: string | null;
};

// Cuenta con la sesión iniciada, sea postulante, empresa o administrador
export const cuentaPropia = cache(async (): Promise<CuentaPropia | null> => {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const { data, error } = await db()
    .from('cuentas')
    .select('id, tipo, nombre, usuario, dni, personeria, email, telefono, localidad, presentacion, rol_admin')
    .eq('usuario', sesion.usuario)
    .eq('habilitada', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    tipo: data.tipo,
    nombre: data.nombre,
    usuario: data.usuario,
    dni: data.dni,
    personeria: data.personeria ?? null,
    email: data.email ?? '',
    telefono: data.telefono ?? '',
    localidad: data.localidad ?? '',
    presentacion: data.presentacion ?? '',
    rol: data.rol_admin ?? null,
  };
});

export type ResultadoCuenta = { ok: true } | { error: string; campo?: keyof DatosCuenta | 'actual' | 'nueva'; status: number };

// Modifica los datos de una empresa o un administrador. Si una empresa cambia su nombre, se actualiza en sus ofertas.
export async function actualizarCuenta(c: CuentaPropia, d: DatosCuenta): Promise<ResultadoCuenta> {
  const nombre = d.nombre.trim();
  const cambios: Record<string, unknown> = {
    nombre,
    email: d.email.trim().toLowerCase(),
    telefono: d.telefono.trim() || null,
    localidad: d.localidad.trim() || null,
  };
  if (c.tipo === 'empresa') cambios.presentacion = d.presentacion.trim() || null;

  const { error } = await db().from('cuentas').update(cambios).eq('id', c.id);
  if (error) {
    if (error.code === '23505') return { error: 'Ese correo ya está registrado en otra cuenta.', campo: 'email', status: 409 };
    throw new Error(error.message);
  }
  if (c.tipo === 'empresa' && nombre !== c.nombre) {
    const { error: e2 } = await db().from('ofertas').update({ empresa_nombre: nombre }).eq('empresa_id', c.id);
    if (e2) throw new Error(e2.message);
  }
  return { ok: true };
}

// Máximo 5 intentos fallidos cada 10 minutos por cuenta
const fallos = new Map<string, number[]>();
const VENTANA = 10 * 60 * 1000;
const recientes = (id: string) => {
  const lista = (fallos.get(id) ?? []).filter((t) => Date.now() - t < VENTANA);
  fallos.set(id, lista);
  return lista;
};

export async function cambiarClave(c: CuentaPropia, actual: string, nueva: string): Promise<ResultadoCuenta> {
  if (recientes(c.id).length >= 5) {
    return { error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.', status: 429 };
  }
  const cuenta = await buscarPorUsuario(c.usuario);
  if (!cuenta || !(await bcrypt.compare(actual, cuenta.hash))) {
    fallos.set(c.id, [...recientes(c.id), Date.now()]);
    return { error: 'La contraseña actual no es correcta.', campo: 'actual', status: 400 };
  }
  const mensaje = errorPassword(nueva);
  if (mensaje) return { error: mensaje, campo: 'nueva', status: 400 };
  if (nueva === actual) return { error: 'La contraseña nueva tiene que ser distinta de la actual.', campo: 'nueva', status: 400 };

  const { error } = await db().from('cuentas').update({ password_hash: await bcrypt.hash(nueva, 10) }).eq('id', c.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
