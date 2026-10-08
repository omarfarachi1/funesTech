import { db } from './supabase';
import type { Personeria, TipoCuenta } from './validar';

export type Cuenta = {
  id: string;
  tipo: TipoCuenta;
  personeria?: Personeria;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  usuario: string;
  email: string;
  hash: string;
};

const COLUMNAS = 'id, tipo, personeria, nombre, dni, fecha_nacimiento, usuario, password_hash, email';

// Convierte una fila de la tabla (snake_case) al formato que usa la app.
function aCuenta(f: Record<string, string | null>): Cuenta {
  return {
    id: f.id as string,
    tipo: f.tipo as TipoCuenta,
    personeria: (f.personeria as Personeria | null) ?? undefined,
    nombre: f.nombre as string,
    dni: f.dni as string,
    fechaNacimiento: f.fecha_nacimiento as string,
    usuario: f.usuario as string,
    email: (f.email as string | null) ?? '',
    hash: f.password_hash as string,
  };
}

export async function buscarPorUsuario(usuario: string): Promise<Cuenta | null> {
  const { data, error } = await db()
    .from('cuentas')
    .select(COLUMNAS)
    .eq('usuario', usuario)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aCuenta(data) : null;
}

type Resultado = { cuenta: Cuenta } | { error: string; campo: 'usuario' | 'dni' | 'email' };

export async function crearCuenta(nueva: Omit<Cuenta, 'id'>): Promise<Resultado> {
  const { data, error } = await db()
    .from('cuentas')
    .insert({
      tipo: nueva.tipo,
      personeria: nueva.personeria ?? null,
      nombre: nueva.nombre,
      dni: nueva.dni,
      fecha_nacimiento: nueva.fechaNacimiento,
      usuario: nueva.usuario,
      email: nueva.email,
      password_hash: nueva.hash,
    })
    .select(COLUMNAS)
    .single();

  if (error) {
    // 23505 = violación de restricción UNIQUE
    if (error.code === '23505') {
      if (error.message.includes('cuentas_usuario_unico')) {
        return { error: 'Ese usuario ya está en uso. Elegí otro.', campo: 'usuario' };
      }
      if (error.message.includes('cuentas_email_unico')) {
        return { error: 'Ese correo ya está registrado.', campo: 'email' };
      }
      return {
        error:
          nueva.personeria === 'juridica'
            ? 'Ya hay una empresa registrada con ese CUIT.'
            : 'Ya hay una cuenta registrada con ese DNI.',
        campo: 'dni',
      };
    }
    throw new Error(error.message);
  }
  return { cuenta: aCuenta(data) };
}

export async function buscarPorEmail(email: string): Promise<Cuenta | null> {
  const { data, error } = await db().from('cuentas').select(COLUMNAS).eq('email', email).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aCuenta(data) : null;
}
