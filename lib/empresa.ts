import { cache } from 'react';
import { db } from './supabase';
import { obtenerSesion } from './session';
import { FOTO_MAX, esJpeg } from './foto';
import { DERIVADOS, type EstadoPostulacion } from './formato';
import { listaRequisitos, validarOferta, type DatosOferta, type ErroresOferta, type EstadoRevision } from './oferta';
import { adminActual } from './admin';
import { esUuid } from './validar';
import type { Oferta } from './postulante';
import type { EstadoVerificacion } from './documentos';

export type Empresa = {
  id: string;
  nombre: string;
  personeria: 'fisica' | 'juridica' | null;
  dni: string;
  usuario: string;
  email: string;
  verificacion: EstadoVerificacion; // solo tiene sentido en personas jurídicas
  verificacionNota: string;
};
export type OfertaEmpresa = Oferta & {
  activa: boolean;
  postulantes: number; // candidatos derivados por la Municipalidad
  estadoRevision: EstadoRevision;
  motivoRechazo: string | null;
};
// Candidato derivado a la empresa
export type Postulante = {
  id: string; // id de la postulación
  estado: EstadoPostulacion;
  derivada: string | null;
  notaMunicipal: string;
  resultadoEn: string | null;
  motivo: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  localidad: string;
  presentacion: string;
  ocupacion: string;
  experiencia: string;
  categorias: string[];
  cvNombre: string | null;
  tieneCv: boolean;
  fotoVersion: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

const BUCKET_FOTOS_OFERTA = 'fotosOfertas';
const COLS_OFERTA =
  'id, titulo, categoria, empresa_nombre, descripcion, requisitos, localidad, horario, creada_en, foto_path, foto_actualizada_en, activa, estado_revision, motivo_rechazo';

function aOferta(f: Fila, postulantes = 0): OfertaEmpresa {
  return {
    id: f.id,
    titulo: f.titulo,
    categoria: f.categoria ?? 'General',
    empresa: f.empresa_nombre,
    descripcion: f.descripcion,
    requisitos: f.requisitos ?? [],
    localidad: f.localidad,
    horario: f.horario,
    creada: f.creada_en,
    fotoVersion: f.foto_path ? (f.foto_actualizada_en ?? '1') : null,
    activa: f.activa,
    postulantes,
    estadoRevision: f.estado_revision,
    motivoRechazo: f.motivo_rechazo ?? null,
  };
}

// Empresa con la sesión iniciada (null si no hay sesión o no es una empresa)
export const empresaActual = cache(async (): Promise<Empresa | null> => {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.tipo !== 'empresa') return null;
  const { data, error } = await db()
    .from('cuentas')
    .select('id, nombre, personeria, dni, usuario, email, verificacion, verificacion_nota')
    .eq('usuario', sesion.usuario)
    .eq('tipo', 'empresa')
    .eq('habilitada', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data
    ? { id: data.id, nombre: data.nombre, personeria: data.personeria ?? null, dni: data.dni, usuario: data.usuario, email: data.email ?? '', verificacion: (data.verificacion ?? 'sin_enviar') as EstadoVerificacion, verificacionNota: data.verificacion_nota ?? '' }
    : null;
});

// ---------- Ofertas de la empresa ----------
export async function listarOfertasEmpresa(empresaId: string): Promise<OfertaEmpresa[]> {
  const { data, error } = await db()
    .from('ofertas')
    .select(COLS_OFERTA)
    .eq('empresa_id', empresaId)
    .order('creada_en', { ascending: false });
  if (error) throw new Error(error.message);
  const filas = data as Fila[];
  const cuentas: Record<string, number> = {};
  if (filas.length > 0) {
    const { data: po, error: e2 } = await db()
      .from('postulaciones')
      .select('oferta_id')
      .in('oferta_id', filas.map((f) => f.id))
      .in('estado', DERIVADOS);
    if (e2) throw new Error(e2.message);
    for (const p of po as Fila[]) cuentas[p.oferta_id] = (cuentas[p.oferta_id] ?? 0) + 1;
  }
  return filas.map((f) => aOferta(f, cuentas[f.id] ?? 0));
}

// Solo devuelve la oferta si pertenece a esa empresa
export async function obtenerOfertaEmpresa(empresaId: string, id: string): Promise<OfertaEmpresa | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('ofertas')
    .select(COLS_OFERTA)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aOferta(data) : null;
}

const columnas = (d: DatosOferta) => ({
  titulo: d.titulo.trim(),
  categoria: d.categoria.trim(),
  descripcion: d.descripcion.trim(),
  requisitos: listaRequisitos(d.requisitos),
  localidad: d.localidad.trim(),
  horario: d.horario.trim(),
});

export async function crearOferta(empresa: Empresa, d: DatosOferta): Promise<string> {
  const { data, error } = await db()
    .from('ofertas')
    .insert({ empresa_id: empresa.id, empresa_nombre: empresa.nombre, activa: true, estado_revision: 'pendiente', ...columnas(d) })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function actualizarOferta(empresaId: string, id: string, d: DatosOferta): Promise<boolean> {
  const { data, error } = await db()
    .from('ofertas')
    .update({ ...columnas(d), estado_revision: 'pendiente', motivo_rechazo: null, revisada_por: null, revisada_en: null })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

// Cerrar (activa = false) o reabrir una oferta
export async function cambiarActiva(empresaId: string, id: string, activa: boolean): Promise<boolean> {
  const { data, error } = await db()
    .from('ofertas')
    .update({ activa })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

// ---------- Miniatura de la oferta ----------
export async function guardarFotoOferta(empresaId: string, ofertaId: string, contenido: Buffer) {
  const path = `${empresaId}/${ofertaId}.jpg`;
  const { error } = await db()
    .storage.from(BUCKET_FOTOS_OFERTA)
    .upload(path, contenido, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(error.message);
  const { error: e2 } = await db()
    .from('ofertas')
    .update({ foto_path: path, foto_actualizada_en: new Date().toISOString() })
    .eq('id', ofertaId)
    .eq('empresa_id', empresaId);
  if (e2) throw new Error(e2.message);
}

export async function quitarFotoOferta(empresaId: string, ofertaId: string) {
  await db().storage.from(BUCKET_FOTOS_OFERTA).remove([`${empresaId}/${ofertaId}.jpg`]);
  const { error } = await db()
    .from('ofertas')
    .update({ foto_path: null, foto_actualizada_en: null })
    .eq('id', ofertaId)
    .eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
}

// La miniatura de una oferta publicada es pública; la de una oferta sin publicar, solo de su empresa y los administradores.
export async function leerFotoOferta(id: string): Promise<{ datos: ArrayBuffer; publica: boolean } | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('ofertas')
    .select('foto_path, activa, estado_revision, empresa_id')
    .eq('id', id)
    .maybeSingle();
  if (error || !data?.foto_path) return null;
  const publica = Boolean(data.activa) && data.estado_revision === 'aprobada';
  if (!publica) {
    const empresa = await empresaActual();
    const esPropia = Boolean(empresa) && empresa?.id === data.empresa_id;
    if (!esPropia && !(await adminActual())) return null;
  }
  const { data: blob, error: e2 } = await db().storage.from(BUCKET_FOTOS_OFERTA).download(data.foto_path);
  if (e2 || !blob) return null;
  return { datos: await blob.arrayBuffer(), publica };
}

// ---------- Candidatos derivados ----------
// La empresa ve ÚNICAMENTE a los candidatos que la Municipalidad derivó a una de sus ofertas.
export async function listarPostulantes(empresaId: string, ofertaId: string) {
  const oferta = await obtenerOfertaEmpresa(empresaId, ofertaId);
  if (!oferta) return null;
  const { data, error } = await db()
    .from('postulaciones')
    .select(
      'id, estado, derivada_en, nota_municipal, resultado_en, motivo_no_contratacion, cuentas(nombre, dni, fecha_nacimiento, email, telefono, localidad, presentacion, ocupacion, experiencia, categorias, cv_nombre, cv_path, foto_path, foto_actualizada_en)'
    )
    .eq('oferta_id', ofertaId)
    .in('estado', DERIVADOS)
    .order('derivada_en', { ascending: false });
  if (error) throw new Error(error.message);
  const postulantes: Postulante[] = (data as Fila[]).map((f) => {
    const c = Array.isArray(f.cuentas) ? f.cuentas[0] : f.cuentas;
    return {
      id: f.id,
      estado: f.estado,
      derivada: f.derivada_en ?? null,
      notaMunicipal: f.nota_municipal ?? '',
      resultadoEn: f.resultado_en ?? null,
      motivo: f.motivo_no_contratacion ?? '',
      nombre: c?.nombre ?? 'Cuenta eliminada',
      dni: c?.dni ?? '',
      fechaNacimiento: c?.fecha_nacimiento ?? '',
      email: c?.email ?? '',
      telefono: c?.telefono ?? '',
      localidad: c?.localidad ?? '',
      presentacion: c?.presentacion ?? '',
      ocupacion: c?.ocupacion ?? '',
      experiencia: c?.experiencia ?? '',
      categorias: c?.categorias ?? [],
      cvNombre: c?.cv_nombre ?? null,
      tieneCv: Boolean(c?.cv_path),
      fotoVersion: c?.foto_path ? (c.foto_actualizada_en ?? '1') : null,
    };
  });
  return { oferta, postulantes };
}

// Postulación solo si es de una oferta de esa empresa Y ya fue derivada por la Municipalidad
export async function postulacionDeEmpresa(empresaId: string, id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('postulaciones')
    .select('id, estado, ofertas(empresa_id), cuentas(cv_path, foto_path)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !DERIVADOS.includes(data.estado)) return null;
  const o = Array.isArray(data.ofertas) ? data.ofertas[0] : data.ofertas;
  if (o?.empresa_id !== empresaId) return null;
  const c = Array.isArray(data.cuentas) ? data.cuentas[0] : data.cuentas;
  return {
    id: data.id as string,
    estado: data.estado as EstadoPostulacion,
    cvPath: (c?.cv_path ?? null) as string | null,
    fotoPath: (c?.foto_path ?? null) as string | null,
  };
}

export type ResultadoDecision = { ok: true } | { error: string; status: number };

// La empresa informa si contrata o no. Si no contrata, el motivo es obligatorio. Se decide una sola vez.
export async function decidirContratacion(empresaId: string, id: string, contrata: boolean, motivo: string): Promise<ResultadoDecision> {
  const p = await postulacionDeEmpresa(empresaId, id);
  if (!p) return { error: 'No encontramos ese candidato.', status: 404 };
  if (p.estado !== 'derivada') return { error: 'Ya registraste la decisión para este candidato.', status: 409 };
  const texto = motivo.trim();
  if (!contrata && (texto.length < 5 || texto.length > 500)) {
    return { error: 'Indicá el motivo por el que no contratás (entre 5 y 500 caracteres).', status: 400 };
  }
  const { data, error } = await db()
    .from('postulaciones')
    .update({
      estado: contrata ? 'contratado' : 'no_contratado',
      resultado_en: new Date().toISOString(),
      motivo_no_contratacion: contrata ? null : texto,
    })
    .eq('id', id)
    .eq('estado', 'derivada')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ok: true } : { error: 'Ya registraste la decisión para este candidato.', status: 409 };
}

export async function urlCvPostulante(path: string): Promise<string | null> {
  const { data, error } = await db().storage.from('cvs').createSignedUrl(path, 60);
  return error ? null : data.signedUrl;
}

export async function leerFotoPostulante(path: string): Promise<ArrayBuffer | null> {
  const { data, error } = await db().storage.from('fotosPerfil').download(path);
  return error || !data ? null : data.arrayBuffer();
}

// ---------- Lectura del formulario de una oferta (servidor) ----------
export async function leerFormularioOferta(form: FormData) {
  const texto = (k: string) => String(form.get(k) ?? '');
  const datos: DatosOferta = {
    titulo: texto('titulo'),
    categoria: texto('categoria'),
    descripcion: texto('descripcion'),
    requisitos: texto('requisitos'),
    localidad: texto('localidad'),
    horario: texto('horario'),
  };
  const errores: ErroresOferta = validarOferta(datos);
  let foto: Buffer | null = null;
  const f = form.get('foto');
  if (f instanceof File && f.size > 0) {
    if (f.size > FOTO_MAX) errores.foto = 'La imagen es demasiado pesada.';
    else {
      const b = Buffer.from(await f.arrayBuffer());
      if (esJpeg(b)) foto = b;
      else errores.foto = 'La imagen no es válida. Probá con otra.';
    }
  }
  return { datos, errores, foto, quitarFoto: form.get('quitarFoto') === '1' };
}
