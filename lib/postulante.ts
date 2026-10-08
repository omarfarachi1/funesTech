import { cache } from 'react';
import { db } from './supabase';
import { obtenerSesion } from './session';
import { CV_FORMATOS, type ExtCv } from './cv';
import type { EstadoPostulacion } from './formato';
import type { DatosPerfil } from './validar';

export type Perfil = {
  id: string;
  usuario: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  localidad: string;
  presentacion: string;
  cvPath: string | null;
  cvNombre: string | null;
  cvActualizado: string | null;
  fotoPath: string | null;
  fotoVersion: string | null; // cambia cada vez que se sube una foto nueva
};

export type Oferta = {
  id: string;
  titulo: string;
  categoria: string;
  empresa: string;
  descripcion: string;
  requisitos: string[];
  localidad: string;
  horario: string;
  creada: string;
};

export type Postulacion = {
  id: string;
  estado: EstadoPostulacion;
  creada: string;
  titulo: string;
  empresa: string;
  localidad: string;
};

const COLS =
  'id, usuario, nombre, dni, fecha_nacimiento, email, telefono, localidad, presentacion, cv_path, cv_nombre, cv_actualizado_en, foto_path, foto_actualizada_en';
const BUCKET = 'cvs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

function aPerfil(f: Fila): Perfil {
  return {
    id: f.id,
    usuario: f.usuario,
    nombre: f.nombre,
    dni: f.dni,
    fechaNacimiento: f.fecha_nacimiento,
    email: f.email ?? '',
    telefono: f.telefono ?? '',
    localidad: f.localidad ?? '',
    presentacion: f.presentacion ?? '',
    cvPath: f.cv_path ?? null,
    cvNombre: f.cv_nombre ?? null,
    cvActualizado: f.cv_actualizado_en ?? null,
    fotoPath: f.foto_path ?? null,
    fotoVersion: f.foto_path ? (f.foto_actualizada_en ?? '1') : null,
  };
}

// Perfil del postulante con la sesión iniciada (null si no hay sesión o no es postulante).
// "cache" evita repetir la consulta dentro de una misma carga de página.
export const perfilActual = cache(async (): Promise<Perfil | null> => {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.tipo !== 'persona') return null;
  const { data, error } = await db()
    .from('cuentas')
    .select(COLS)
    .eq('usuario', sesion.usuario)
    .eq('tipo', 'persona')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aPerfil(data) : null;
});

export async function actualizarPerfil(id: string, d: DatosPerfil): Promise<{ error: string } | null> {
  const { error } = await db()
    .from('cuentas')
    .update({
      nombre: d.nombre,
      fecha_nacimiento: d.fechaNacimiento,
      email: d.email || null,
      telefono: d.telefono || null,
      localidad: d.localidad || null,
      presentacion: d.presentacion || null,
    })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'Ese correo ya está registrado en otra cuenta.' };
    throw new Error(error.message);
  }
  return null;
}

// ---------- Ofertas y postulaciones ----------
export async function listarOfertas(cuentaId: string) {
  const [of, po] = await Promise.all([
    db()
      .from('ofertas')
      .select('id, titulo, categoria, empresa_nombre, descripcion, requisitos, localidad, horario, creada_en')
      .eq('activa', true)
      .order('creada_en', { ascending: false }),
    db().from('postulaciones').select('oferta_id, estado').eq('cuenta_id', cuentaId),
  ]);
  if (of.error) throw new Error(of.error.message);
  if (po.error) throw new Error(po.error.message);

  const ofertas: Oferta[] = (of.data as Fila[]).map((f) => ({
    id: f.id,
    titulo: f.titulo,
    categoria: f.categoria ?? 'General',
    empresa: f.empresa_nombre,
    descripcion: f.descripcion,
    requisitos: f.requisitos ?? [],
    localidad: f.localidad,
    horario: f.horario,
    creada: f.creada_en,
  }));
  const estados: Record<string, EstadoPostulacion> = {};
  for (const p of po.data as Fila[]) estados[p.oferta_id] = p.estado;
  return { ofertas, estados };
}

export async function listarPostulaciones(cuentaId: string): Promise<Postulacion[]> {
  const { data, error } = await db()
    .from('postulaciones')
    .select('id, estado, creada_en, ofertas(titulo, empresa_nombre, localidad)')
    .eq('cuenta_id', cuentaId)
    .order('creada_en', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Fila[]).map((f) => {
    const o = Array.isArray(f.ofertas) ? f.ofertas[0] : f.ofertas;
    return {
      id: f.id,
      estado: f.estado,
      creada: f.creada_en,
      titulo: o?.titulo ?? 'Oferta eliminada',
      empresa: o?.empresa_nombre ?? '',
      localidad: o?.localidad ?? '',
    };
  });
}

type ResultadoPostular = { ok: true } | { error: string; status: number };

export async function postular(perfil: Perfil, ofertaId: string): Promise<ResultadoPostular> {
  if (!UUID.test(ofertaId)) return { error: 'La oferta no es válida.', status: 400 };
  // Regla: hace falta tener un CV cargado para postularse.
  if (!perfil.cvPath) {
    return { error: 'Cargá tu CV en "Mi perfil" antes de postularte.', status: 400 };
  }

  const { data: oferta, error: e1 } = await db()
    .from('ofertas')
    .select('id')
    .eq('id', ofertaId)
    .eq('activa', true)
    .maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!oferta) return { error: 'Esa oferta ya no está disponible.', status: 404 };

  const { error } = await db().from('postulaciones').insert({ cuenta_id: perfil.id, oferta_id: ofertaId });
  if (error) {
    if (error.code === '23505') return { error: 'Ya te postulaste a esta oferta.', status: 409 };
    throw new Error(error.message);
  }
  return { ok: true };
}

// ---------- Currículum (Supabase Storage, bucket privado "cvs") ----------
export async function guardarCv(perfil: Perfil, ext: ExtCv, nombre: string, contenido: Buffer) {
  const path = `${perfil.id}/cv.${ext}`;
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(path, contenido, { contentType: CV_FORMATOS[ext], upsert: true });
  if (error) throw new Error(error.message);
  if (perfil.cvPath && perfil.cvPath !== path) {
    await db().storage.from(BUCKET).remove([perfil.cvPath]);
  }
  const { error: e2 } = await db()
    .from('cuentas')
    .update({ cv_path: path, cv_nombre: nombre, cv_actualizado_en: new Date().toISOString() })
    .eq('id', perfil.id);
  if (e2) throw new Error(e2.message);
}

export async function quitarCv(perfil: Perfil) {
  if (!perfil.cvPath) return;
  await db().storage.from(BUCKET).remove([perfil.cvPath]);
  const { error } = await db()
    .from('cuentas')
    .update({ cv_path: null, cv_nombre: null, cv_actualizado_en: null })
    .eq('id', perfil.id);
  if (error) throw new Error(error.message);
}

// Enlace temporal (60 segundos) para ver o descargar el CV propio.
export async function urlCv(perfil: Perfil): Promise<string | null> {
  if (!perfil.cvPath) return null;
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(perfil.cvPath, 60);
  return error ? null : data.signedUrl;
}

// ---------- Foto de perfil (Supabase Storage, bucket privado "fotos") ----------
const BUCKET_FOTOS = 'fotosPerfil';

export async function guardarFoto(perfil: Perfil, contenido: Buffer) {
  const path = `${perfil.id}/foto.jpg`;
  const { error } = await db()
    .storage.from(BUCKET_FOTOS)
    .upload(path, contenido, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(error.message);
  const { error: e2 } = await db()
    .from('cuentas')
    .update({ foto_path: path, foto_actualizada_en: new Date().toISOString() })
    .eq('id', perfil.id);
  if (e2) throw new Error(e2.message);
}

export async function quitarFoto(perfil: Perfil) {
  if (!perfil.fotoPath) return;
  await db().storage.from(BUCKET_FOTOS).remove([perfil.fotoPath]);
  const { error } = await db()
    .from('cuentas')
    .update({ foto_path: null, foto_actualizada_en: null })
    .eq('id', perfil.id);
  if (error) throw new Error(error.message);
}

export async function leerFoto(perfil: Perfil): Promise<ArrayBuffer | null> {
  if (!perfil.fotoPath) return null;
  const { data, error } = await db().storage.from(BUCKET_FOTOS).download(perfil.fotoPath);
  if (error || !data) return null;
  return data.arrayBuffer();
}
