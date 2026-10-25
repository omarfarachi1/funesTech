import { cache } from 'react';
import { NextResponse } from 'next/server';
import { db } from './supabase';
import { obtenerSesion } from './session';
import { esUuid, normalizarDni } from './validar';
import { puede, puedeEscribir, type DatosAdmin, type Recurso, type RolAdmin } from './roles';
import { listaRequisitos, type DatosOferta, type EstadoRevision } from './oferta';
import type { Oferta } from './postulante';
import { DERIVADOS, RESULTADOS_PREENTREVISTA, type EstadoPostulacion } from './formato';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

export type Admin = {
  id: string;
  nombre: string;
  dni: string;
  usuario: string;
  email: string;
  rol: RolAdmin;
  habilitada: boolean;
  creada: string;
};

const COLS_ADMIN = 'id, nombre, dni, usuario, email, rol_admin, habilitada, creada_en';
const aAdmin = (f: Fila): Admin => ({
  id: f.id,
  nombre: f.nombre,
  dni: f.dni,
  usuario: f.usuario,
  email: f.email ?? '',
  rol: f.rol_admin,
  habilitada: f.habilitada,
  creada: f.creada_en,
});

// Administrador con la sesión iniciada. Se consulta en cada pedido: si lo deshabilitan, pierde el acceso enseguida.
export const adminActual = cache(async (): Promise<Admin | null> => {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.tipo !== 'admin') return null;
  const { data, error } = await db()
    .from('cuentas')
    .select(COLS_ADMIN)
    .eq('usuario', sesion.usuario)
    .eq('tipo', 'admin')
    .eq('habilitada', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aAdmin(data) : null;
});

// Para las rutas de la API: exige sesión y permiso sobre el recurso
export async function autorizar(
  recurso: Recurso,
  escribir = false
): Promise<{ admin: Admin } | { respuesta: NextResponse }> {
  const admin = await adminActual();
  if (!admin) {
    return { respuesta: NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 }) };
  }
  const ok = escribir ? puedeEscribir(admin.rol, recurso) : puede(admin.rol, recurso);
  if (!ok) return { respuesta: NextResponse.json({ error: 'No tenés permiso para hacer esto.' }, { status: 403 }) };
  return { admin };
}

// ---------- Administradores ----------
export type ResultadoAdmin = { ok: true } | { error: string; campo?: 'nombre' | 'dni' | 'email' | 'usuario' | 'rol'; status?: number };

export async function listarAdmins(): Promise<Admin[]> {
  const { data, error } = await db().from('cuentas').select(COLS_ADMIN).eq('tipo', 'admin').order('nombre');
  if (error) throw new Error(error.message);
  return (data as Fila[]).map(aAdmin);
}

export async function obtenerAdmin(id: string): Promise<Admin | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('cuentas').select(COLS_ADMIN).eq('id', id).eq('tipo', 'admin').maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aAdmin(data) : null;
}

async function superadminsActivos(): Promise<number> {
  const { count, error } = await db()
    .from('cuentas')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'admin')
    .eq('rol_admin', 'superadmin')
    .eq('habilitada', true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function errorUnico(mensaje: string): ResultadoAdmin {
  if (mensaje.includes('cuentas_usuario_unico')) return { error: 'Ese usuario ya está en uso.', campo: 'usuario' };
  if (mensaje.includes('cuentas_email_unico')) return { error: 'Ese correo ya está registrado.', campo: 'email' };
  return { error: 'Ya hay un administrador con ese DNI.', campo: 'dni' };
}

export async function crearAdmin(d: DatosAdmin, hash: string): Promise<ResultadoAdmin> {
  const { error } = await db().from('cuentas').insert({
    tipo: 'admin',
    rol_admin: d.rol,
    nombre: d.nombre.trim(),
    dni: normalizarDni(d.dni),
    fecha_nacimiento: d.fechaNacimiento,
    email: d.email.trim().toLowerCase(),
    usuario: d.usuario.trim().toLowerCase(),
    password_hash: hash,
  });
  if (error) {
    if (error.code === '23505') return errorUnico(error.message);
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function actualizarAdmin(
  id: string,
  c: { nombre: string; email: string; rol: RolAdmin; hash?: string },
  actorId: string
): Promise<ResultadoAdmin> {
  const actual = await obtenerAdmin(id);
  if (!actual) return { error: 'No encontramos ese administrador.', status: 404 };
  // Para no quedarse sin acceso por error, nadie cambia su propio rol: lo hace otro superadministrador
  if (id === actorId && c.rol !== actual.rol) {
    return { error: 'No podés cambiar tu propio rol. Pedile a otro superadministrador que lo haga.', campo: 'rol' };
  }
  if (actual.rol === 'superadmin' && actual.habilitada && c.rol !== 'superadmin' && (await superadminsActivos()) <= 1) {
    return { error: 'Tiene que quedar al menos un superadministrador activo.', campo: 'rol' };
  }
  const cambios: Record<string, unknown> = { nombre: c.nombre.trim(), email: c.email.trim().toLowerCase(), rol_admin: c.rol };
  if (c.hash) cambios.password_hash = c.hash;
  const { error } = await db().from('cuentas').update(cambios).eq('id', id).eq('tipo', 'admin');
  if (error) {
    if (error.code === '23505') return errorUnico(error.message);
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function cambiarHabilitadaAdmin(id: string, habilitada: boolean, actorId: string): Promise<ResultadoAdmin> {
  if (id === actorId && !habilitada) return { error: 'No podés deshabilitar tu propia cuenta.' };
  const a = await obtenerAdmin(id);
  if (!a) return { error: 'No encontramos ese administrador.', status: 404 };
  if (!habilitada && a.rol === 'superadmin' && a.habilitada && (await superadminsActivos()) <= 1) {
    return { error: 'Tiene que quedar al menos un superadministrador activo.' };
  }
  const { error } = await db().from('cuentas').update({ habilitada }).eq('id', id).eq('tipo', 'admin');
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ---------- Candidatos ----------
export const POR_PAGINA_ADMIN = 15;

export type Candidato = {
  id: string;
  nombre: string;
  dni: string;
  usuario: string;
  email: string;
  telefono: string;
  localidad: string;
  creada: string;
  tieneCv: boolean;
  habilitada: boolean;
  postulaciones: number;
  categorias: string[];
};

export async function listarCandidatos(q: string, pagina: number, categoria = '') {
  const desde = (pagina - 1) * POR_PAGINA_ADMIN;
  let consulta = db()
    .from('cuentas')
    .select('id, nombre, dni, usuario, email, telefono, localidad, creada_en, cv_path, habilitada, categorias', { count: 'exact' })
    .eq('tipo', 'persona');
  if (categoria) consulta = consulta.contains('categorias', [categoria]);
  const limpio = q.replace(/[,()%*\\"_]/g, ' ').trim().slice(0, 60);
  if (limpio) {
    consulta = consulta.or(`nombre.ilike.*${limpio}*,dni.ilike.*${limpio}*,usuario.ilike.*${limpio}*,email.ilike.*${limpio}*`);
  }
  const { data, count, error } = await consulta
    .order('creada_en', { ascending: false })
    .range(desde, desde + POR_PAGINA_ADMIN - 1);
  if (error) throw new Error(error.message);
  const filas = data as Fila[];

  const cuentas: Record<string, number> = {};
  if (filas.length > 0) {
    const { data: po, error: e2 } = await db().from('postulaciones').select('cuenta_id').in('cuenta_id', filas.map((f) => f.id));
    if (e2) throw new Error(e2.message);
    for (const p of po as Fila[]) cuentas[p.cuenta_id] = (cuentas[p.cuenta_id] ?? 0) + 1;
  }
  const items: Candidato[] = filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    dni: f.dni,
    usuario: f.usuario,
    email: f.email ?? '',
    telefono: f.telefono ?? '',
    localidad: f.localidad ?? '',
    creada: f.creada_en,
    tieneCv: Boolean(f.cv_path),
    habilitada: f.habilitada,
    postulaciones: cuentas[f.id] ?? 0,
    categorias: f.categorias ?? [],
  }));
  return { items, total: count ?? 0 };
}

export async function obtenerCandidato(id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('cuentas')
    .select('id, nombre, dni, usuario, email, telefono, localidad, presentacion, fecha_nacimiento, creada_en, cv_path, cv_nombre, foto_path, foto_actualizada_en, habilitada')
    .eq('id', id)
    .eq('tipo', 'persona')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: po, error: e2 } = await db()
    .from('postulaciones')
    .select('id, estado, creada_en, ofertas(titulo, empresa_nombre)')
    .eq('cuenta_id', id)
    .order('creada_en', { ascending: false });
  if (e2) throw new Error(e2.message);
  return {
    candidato: {
      id: data.id as string,
      nombre: data.nombre as string,
      dni: data.dni as string,
      usuario: data.usuario as string,
      email: (data.email ?? '') as string,
      telefono: (data.telefono ?? '') as string,
      localidad: (data.localidad ?? '') as string,
      presentacion: (data.presentacion ?? '') as string,
      fechaNacimiento: data.fecha_nacimiento as string,
      creada: data.creada_en as string,
      cvNombre: (data.cv_nombre ?? null) as string | null,
      tieneCv: Boolean(data.cv_path),
      fotoVersion: (data.foto_path ? (data.foto_actualizada_en ?? '1') : null) as string | null,
      habilitada: data.habilitada as boolean,
    },
    postulaciones: (po as Fila[]).map((f) => {
      const o = Array.isArray(f.ofertas) ? f.ofertas[0] : f.ofertas;
      return {
        id: f.id as string,
        estado: f.estado as EstadoPostulacion,
        creada: f.creada_en as string,
        titulo: (o?.titulo ?? 'Oferta eliminada') as string,
        empresa: (o?.empresa_nombre ?? '') as string,
      };
    }),
  };
}

// Habilitar o deshabilitar una cuenta de candidato o de empresa (los administradores se gestionan aparte)
export async function cambiarHabilitada(id: string, habilitada: boolean): Promise<boolean> {
  if (!esUuid(id)) return false;
  const { data, error } = await db()
    .from('cuentas')
    .update({ habilitada })
    .eq('id', id)
    .neq('tipo', 'admin')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function rutasCandidato(id: string): Promise<{ cvPath: string | null; fotoPath: string | null } | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('cuentas').select('cv_path, foto_path').eq('id', id).eq('tipo', 'persona').maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { cvPath: data.cv_path ?? null, fotoPath: data.foto_path ?? null } : null;
}

// ---------- Ofertas ----------
export type OfertaAdmin = Oferta & {
  activa: boolean;
  estadoRevision: EstadoRevision;
  motivoRechazo: string | null;
  deEmpresa: boolean;
  empresaId: string | null;
  postulantes: number;
};

const COLS_OFERTA =
  'id, titulo, categoria, empresa_id, empresa_nombre, descripcion, requisitos, localidad, horario, creada_en, foto_path, foto_actualizada_en, activa, estado_revision, motivo_rechazo';
const BUCKET = 'fotosOfertas';

const aOferta = (f: Fila, postulantes = 0): OfertaAdmin => ({
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
  estadoRevision: f.estado_revision,
  motivoRechazo: f.motivo_rechazo ?? null,
  deEmpresa: Boolean(f.empresa_id),
  empresaId: f.empresa_id ?? null,
  postulantes,
});

export async function listarOfertasAdmin(): Promise<OfertaAdmin[]> {
  const { data, error } = await db().from('ofertas').select(COLS_OFERTA).order('creada_en', { ascending: false });
  if (error) throw new Error(error.message);
  const filas = data as Fila[];
  const cuentas: Record<string, number> = {};
  if (filas.length > 0) {
    const { data: po, error: e2 } = await db().from('postulaciones').select('oferta_id').in('oferta_id', filas.map((f) => f.id));
    if (e2) throw new Error(e2.message);
    for (const p of po as Fila[]) cuentas[p.oferta_id] = (cuentas[p.oferta_id] ?? 0) + 1;
  }
  return filas.map((f) => aOferta(f, cuentas[f.id] ?? 0));
}

export async function obtenerOfertaAdmin(id: string): Promise<OfertaAdmin | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('ofertas').select(COLS_OFERTA).eq('id', id).maybeSingle();
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

export async function actualizarOfertaAdmin(id: string, d: DatosOferta, empresa: string, empresaId: string | null = null): Promise<boolean> {
  const { data, error } = await db()
    .from('ofertas')
    .update({ ...columnas(d), empresa_nombre: empresa.trim(), empresa_id: empresaId })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function revisarOferta(admin: Admin, id: string, accion: 'aprobar' | 'rechazar', motivo: string): Promise<boolean> {
  const { data, error } = await db()
    .from('ofertas')
    .update({
      estado_revision: accion === 'aprobar' ? 'aprobada' : 'rechazada',
      motivo_rechazo: accion === 'rechazar' ? motivo.trim() : null,
      revisada_por: admin.id,
      revisada_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function cambiarActivaAdmin(id: string, activa: boolean): Promise<boolean> {
  const { data, error } = await db().from('ofertas').update({ activa }).eq('id', id).select('id').maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

// Borra la oferta y, por la base de datos, también sus postulaciones
export async function eliminarOferta(id: string): Promise<boolean> {
  const { data: o, error } = await db().from('ofertas').select('foto_path').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!o) return false;
  if (o.foto_path) await db().storage.from(BUCKET).remove([o.foto_path]);
  const { error: e2 } = await db().from('ofertas').delete().eq('id', id);
  if (e2) throw new Error(e2.message);
  return true;
}

export async function guardarFotoOfertaAdmin(id: string, contenido: Buffer) {
  const path = `admin/${id}.jpg`;
  const { error } = await db().storage.from(BUCKET).upload(path, contenido, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(error.message);
  const { error: e2 } = await db()
    .from('ofertas')
    .update({ foto_path: path, foto_actualizada_en: new Date().toISOString() })
    .eq('id', id);
  if (e2) throw new Error(e2.message);
}

export async function quitarFotoOfertaAdmin(id: string) {
  const { data } = await db().from('ofertas').select('foto_path').eq('id', id).maybeSingle();
  if (data?.foto_path) await db().storage.from(BUCKET).remove([data.foto_path]);
  const { error } = await db().from('ofertas').update({ foto_path: null, foto_actualizada_en: null }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------- Resumen ----------
export async function resumenAdmin() {
  const contar = async (consulta: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const { count, error } = await consulta;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };
  const cabecera = { count: 'exact' as const, head: true };
  const [pendientes, publicadas, candidatos, empresas, admins] = await Promise.all([
    contar(db().from('ofertas').select('id', cabecera).eq('estado_revision', 'pendiente')),
    contar(db().from('ofertas').select('id', cabecera).eq('estado_revision', 'aprobada').eq('activa', true)),
    contar(db().from('cuentas').select('id', cabecera).eq('tipo', 'persona')),
    contar(db().from('cuentas').select('id', cabecera).eq('tipo', 'empresa')),
    contar(db().from('cuentas').select('id', cabecera).eq('tipo', 'admin').eq('habilitada', true)),
  ]);
  return { pendientes, publicadas, candidatos, empresas, admins };
}

// Cantidad total de administradores (habilitados o no). Sirve para saber si falta crear el primero.
export async function contarAdmins(): Promise<number> {
  const { count, error } = await db().from('cuentas').select('id', { count: 'exact', head: true }).eq('tipo', 'admin');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// =====================================================================
// Intermediación municipal: postulaciones, preentrevistas, derivaciones y cursos
// =====================================================================
export type RespuestaAccion = { ok: true } | { error: string; status: number };
const ANTES_DE_DERIVAR: string[] = ['recibida', 'preentrevistada'];
const un = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export type PostulacionAdmin = {
  id: string;
  estado: EstadoPostulacion;
  creada: string;
  derivada: string | null;
  candidatoId: string;
  candidato: string;
  categorias: string[];
  ofertaId: string;
  oferta: string;
  empresa: string;
  preentrevistas: number;
};

export async function listarPostulacionesAdmin(): Promise<PostulacionAdmin[]> {
  const { data, error } = await db()
    .from('postulaciones')
    .select('id, estado, creada_en, derivada_en, cuenta_id, oferta_id, cuentas(nombre, categorias), ofertas(titulo, empresa_nombre)')
    .order('creada_en', { ascending: false });
  if (error) throw new Error(error.message);
  const { data: pre, error: e2 } = await db().from('preentrevistas').select('postulacion_id');
  if (e2) throw new Error(e2.message);
  const cuenta: Record<string, number> = {};
  for (const p of pre as Fila[]) cuenta[p.postulacion_id] = (cuenta[p.postulacion_id] ?? 0) + 1;
  return (data as Fila[]).map((f) => {
    const c = un(f.cuentas) as Fila | undefined;
    const o = un(f.ofertas) as Fila | undefined;
    return {
      id: f.id,
      estado: f.estado,
      creada: f.creada_en,
      derivada: f.derivada_en ?? null,
      candidatoId: f.cuenta_id,
      candidato: c?.nombre ?? 'Cuenta eliminada',
      categorias: c?.categorias ?? [],
      ofertaId: f.oferta_id,
      oferta: o?.titulo ?? 'Oferta eliminada',
      empresa: o?.empresa_nombre ?? '',
      preentrevistas: cuenta[f.id] ?? 0,
    };
  });
}

export async function obtenerPostulacionAdmin(id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('postulaciones')
    .select(
      'id, estado, creada_en, derivada_en, nota_municipal, resultado_en, motivo_no_contratacion, cuentas(id, nombre, dni, fecha_nacimiento, email, telefono, localidad, presentacion, ocupacion, experiencia, categorias, cv_nombre, cv_path, foto_path, foto_actualizada_en), ofertas(id, titulo, categoria, empresa_id, empresa_nombre)'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const c = un(data.cuentas) as Fila | undefined;
  const o = un(data.ofertas) as Fila | undefined;
  if (!c) return null;
  const { data: pre, error: e2 } = await db()
    .from('preentrevistas')
    .select('id, realizada_en, resultado, observaciones')
    .eq('postulacion_id', id)
    .order('realizada_en', { ascending: false });
  if (e2) throw new Error(e2.message);
  return {
    postulacion: {
      id: data.id as string,
      estado: data.estado as EstadoPostulacion,
      creada: data.creada_en as string,
      derivada: (data.derivada_en ?? null) as string | null,
      notaMunicipal: (data.nota_municipal ?? '') as string,
      resultadoEn: (data.resultado_en ?? null) as string | null,
      motivo: (data.motivo_no_contratacion ?? '') as string,
    },
    candidato: {
      id: c.id as string,
      nombre: c.nombre as string,
      dni: c.dni as string,
      fechaNacimiento: c.fecha_nacimiento as string,
      email: (c.email ?? '') as string,
      telefono: (c.telefono ?? '') as string,
      localidad: (c.localidad ?? '') as string,
      presentacion: (c.presentacion ?? '') as string,
      ocupacion: (c.ocupacion ?? '') as string,
      experiencia: (c.experiencia ?? '') as string,
      categorias: (c.categorias ?? []) as string[],
      cvNombre: (c.cv_nombre ?? null) as string | null,
      tieneCv: Boolean(c.cv_path),
      fotoVersion: (c.foto_path ? (c.foto_actualizada_en ?? '1') : null) as string | null,
    },
    oferta: {
      id: (o?.id ?? '') as string,
      titulo: (o?.titulo ?? 'Oferta eliminada') as string,
      categoria: (o?.categoria ?? '') as string,
      empresaId: (o?.empresa_id ?? null) as string | null,
      empresa: (o?.empresa_nombre ?? '') as string,
    },
    preentrevistas: (pre as Fila[]).map((p) => ({
      id: p.id as string,
      fecha: p.realizada_en as string,
      resultado: p.resultado as string,
      observaciones: p.observaciones as string,
    })),
  };
}

async function cargarPostulacion(id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('postulaciones').select('id, estado, cuenta_id, ofertas(empresa_id)').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// La preentrevista es OPCIONAL: se registra antes de derivar y queda asociada al postulante y a la postulación.
export async function registrarPreentrevista(
  admin: Admin,
  id: string,
  d: { resultado: string; observaciones: string; fecha: string }
): Promise<RespuestaAccion> {
  const p = await cargarPostulacion(id);
  if (!p) return { error: 'No encontramos esa postulación.', status: 404 };
  if (!ANTES_DE_DERIVAR.includes(p.estado)) {
    return { error: 'Solo se puede registrar una preentrevista antes de derivar o descartar la postulación.', status: 409 };
  }
  if (!(d.resultado in RESULTADOS_PREENTREVISTA)) return { error: 'Elegí el resultado de la preentrevista.', status: 400 };
  const obs = d.observaciones.trim();
  if (obs.length < 5 || obs.length > 1000) return { error: 'Escribí las observaciones (entre 5 y 1000 caracteres).', status: 400 };
  const hoy = new Date().toISOString().slice(0, 10);
  if (d.fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha) || d.fecha > hoy)) {
    return { error: 'La fecha de la preentrevista no es válida.', status: 400 };
  }
  const { error } = await db().from('preentrevistas').insert({
    postulacion_id: id,
    cuenta_id: p.cuenta_id,
    admin_id: admin.id,
    resultado: d.resultado,
    observaciones: obs,
    realizada_en: d.fecha ? `${d.fecha}T12:00:00-03:00` : new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  if (p.estado === 'recibida') {
    const { error: e2 } = await db().from('postulaciones').update({ estado: 'preentrevistada' }).eq('id', id).eq('estado', 'recibida');
    if (e2) throw new Error(e2.message);
  }
  return { ok: true };
}

// Derivar a la empresa: no exige preentrevista previa.
export async function derivarPostulacion(admin: Admin, id: string, nota: string): Promise<RespuestaAccion> {
  const p = await cargarPostulacion(id);
  if (!p) return { error: 'No encontramos esa postulación.', status: 404 };
  if (!ANTES_DE_DERIVAR.includes(p.estado)) return { error: 'Esta postulación ya fue derivada o descartada.', status: 409 };
  const o = un(p.ofertas) as Fila | undefined;
  if (!o?.empresa_id) {
    return { error: 'La oferta no está asociada a una empresa registrada. Asignale una empresa al editarla.', status: 409 };
  }
  const { data, error } = await db()
    .from('postulaciones')
    .update({ estado: 'derivada', derivada_en: new Date().toISOString(), derivada_por: admin.id, nota_municipal: nota || null })
    .eq('id', id)
    .in('estado', ANTES_DE_DERIVAR)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ok: true } : { error: 'Esta postulación ya fue derivada o descartada.', status: 409 };
}

export async function descartarPostulacion(admin: Admin, id: string, nota: string): Promise<RespuestaAccion> {
  const p = await cargarPostulacion(id);
  if (!p) return { error: 'No encontramos esa postulación.', status: 404 };
  if (!ANTES_DE_DERIVAR.includes(p.estado)) return { error: 'Esta postulación ya fue derivada o descartada.', status: 409 };
  const { data, error } = await db()
    .from('postulaciones')
    .update({ estado: 'descartada', derivada_por: admin.id, nota_municipal: nota || null })
    .eq('id', id)
    .in('estado', ANTES_DE_DERIVAR)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ok: true } : { error: 'Esta postulación ya fue derivada o descartada.', status: 409 };
}

// ---------- Seguimiento del candidato ----------
export async function obtenerSeguimiento(id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db()
    .from('cuentas')
    .select('id, nombre, dni, usuario, email, telefono, localidad, presentacion, ocupacion, experiencia, categorias, fecha_nacimiento, creada_en, cv_path, cv_nombre, foto_path, foto_actualizada_en, habilitada')
    .eq('id', id)
    .eq('tipo', 'persona')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [po, pre, cu] = await Promise.all([
    db()
      .from('postulaciones')
      .select('id, estado, creada_en, derivada_en, resultado_en, motivo_no_contratacion, nota_municipal, ofertas(titulo, empresa_nombre)')
      .eq('cuenta_id', id)
      .order('creada_en', { ascending: false }),
    db().from('preentrevistas').select('id, postulacion_id, realizada_en, resultado, observaciones').eq('cuenta_id', id).order('realizada_en', { ascending: false }),
    db().from('derivaciones_curso').select('id, derivada_en, observaciones, cursos(nombre)').eq('cuenta_id', id).order('derivada_en', { ascending: false }),
  ]);
  for (const r of [po, pre, cu]) if (r.error) throw new Error(r.error.message);

  const conteo: Record<string, number> = {};
  for (const p of pre.data as Fila[]) conteo[p.postulacion_id] = (conteo[p.postulacion_id] ?? 0) + 1;
  const titulos: Record<string, string> = {};
  const postulaciones = (po.data as Fila[]).map((f) => {
    const o = un(f.ofertas) as Fila | undefined;
    titulos[f.id] = o?.titulo ?? 'Oferta eliminada';
    return {
      id: f.id as string,
      estado: f.estado as EstadoPostulacion,
      creada: f.creada_en as string,
      derivada: (f.derivada_en ?? null) as string | null,
      resultadoEn: (f.resultado_en ?? null) as string | null,
      motivo: (f.motivo_no_contratacion ?? '') as string,
      nota: (f.nota_municipal ?? '') as string,
      titulo: titulos[f.id],
      empresa: (o?.empresa_nombre ?? '') as string,
      preentrevistas: conteo[f.id] ?? 0,
    };
  });

  return {
    candidato: {
      id: data.id as string,
      nombre: data.nombre as string,
      dni: data.dni as string,
      usuario: data.usuario as string,
      email: (data.email ?? '') as string,
      telefono: (data.telefono ?? '') as string,
      localidad: (data.localidad ?? '') as string,
      presentacion: (data.presentacion ?? '') as string,
      ocupacion: (data.ocupacion ?? '') as string,
      experiencia: (data.experiencia ?? '') as string,
      categorias: (data.categorias ?? []) as string[],
      fechaNacimiento: data.fecha_nacimiento as string,
      creada: data.creada_en as string,
      cvNombre: (data.cv_nombre ?? null) as string | null,
      tieneCv: Boolean(data.cv_path),
      fotoVersion: (data.foto_path ? (data.foto_actualizada_en ?? '1') : null) as string | null,
      habilitada: data.habilitada as boolean,
    },
    postulaciones,
    preentrevistas: (pre.data as Fila[]).map((p) => ({
      id: p.id as string,
      postulacionId: p.postulacion_id as string,
      titulo: titulos[p.postulacion_id] ?? 'Oferta eliminada',
      fecha: p.realizada_en as string,
      resultado: p.resultado as string,
      observaciones: p.observaciones as string,
    })),
    cursos: (cu.data as Fila[]).map((f) => ({
      id: f.id as string,
      curso: ((un(f.cursos) as Fila | undefined)?.nombre ?? 'Curso eliminado') as string,
      fecha: f.derivada_en as string,
      observaciones: (f.observaciones ?? '') as string,
    })),
    // Resumen del seguimiento (incluye la cantidad de rechazos)
    resumen: {
      postulaciones: postulaciones.length,
      derivaciones: postulaciones.filter((p) => DERIVADOS.includes(p.estado)).length,
      contrataciones: postulaciones.filter((p) => p.estado === 'contratado').length,
      rechazos: postulaciones.filter((p) => p.estado === 'no_contratado').length,
    },
  };
}

// ---------- Cursos de capacitación ----------
export type Curso = { id: string; nombre: string; descripcion: string };

export async function listarCursos(): Promise<Curso[]> {
  const { data, error } = await db().from('cursos').select('id, nombre, descripcion').order('nombre');
  if (error) throw new Error(error.message);
  return (data as Fila[]).map((f) => ({ id: f.id, nombre: f.nombre, descripcion: f.descripcion ?? '' }));
}

export async function crearCurso(nombre: string, descripcion: string): Promise<RespuestaAccion> {
  const n = nombre.trim();
  const d = descripcion.trim();
  if (n.length < 3 || n.length > 120) return { error: 'El nombre del curso debe tener entre 3 y 120 caracteres.', status: 400 };
  if (d.length > 300) return { error: 'La descripción puede tener hasta 300 caracteres.', status: 400 };
  const { error } = await db().from('cursos').insert({ nombre: n, descripcion: d || null });
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un curso con ese nombre.', status: 409 };
    throw new Error(error.message);
  }
  return { ok: true };
}

// Derivación municipal de un postulante a un curso (independiente de las postulaciones laborales)
export async function derivarACurso(admin: Admin, cuentaId: string, cursoId: string, observaciones: string): Promise<RespuestaAccion> {
  if (!esUuid(cuentaId) || !esUuid(cursoId)) return { error: 'Los datos enviados no son válidos.', status: 400 };
  const obs = observaciones.trim().slice(0, 300);
  const { data: c, error: e1 } = await db().from('cuentas').select('id').eq('id', cuentaId).eq('tipo', 'persona').maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!c) return { error: 'No encontramos al postulante.', status: 404 };
  const { data: k, error: e2 } = await db().from('cursos').select('id').eq('id', cursoId).maybeSingle();
  if (e2) throw new Error(e2.message);
  if (!k) return { error: 'No encontramos ese curso.', status: 404 };
  const { error } = await db().from('derivaciones_curso').insert({ curso_id: cursoId, cuenta_id: cuentaId, admin_id: admin.id, observaciones: obs || null });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function historialCursos(limite = 50) {
  const { data, error } = await db()
    .from('derivaciones_curso')
    .select('id, derivada_en, observaciones, cursos(nombre), cuentas(id, nombre)')
    .order('derivada_en', { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data as Fila[]).map((f) => {
    const k = un(f.cursos) as Fila | undefined;
    const c = un(f.cuentas) as Fila | undefined;
    return {
      id: f.id as string,
      fecha: f.derivada_en as string,
      observaciones: (f.observaciones ?? '') as string,
      curso: (k?.nombre ?? 'Curso eliminado') as string,
      candidatoId: (c?.id ?? '') as string,
      candidato: (c?.nombre ?? 'Cuenta eliminada') as string,
    };
  });
}

// ---------- Indicadores del tablero (datos reales de la base) ----------
export async function indicadores() {
  const contar = async (consulta: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const { count, error } = await consulta;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };
  const cab = { count: 'exact' as const, head: true };
  const [pendientes, ofertasActivas, postulantes, empresas, admins, postulaciones, derivaciones, contrataciones, rechazos, derivacionesCurso] =
    await Promise.all([
      contar(db().from('ofertas').select('id', cab).eq('estado_revision', 'pendiente')),
      contar(db().from('ofertas').select('id', cab).eq('estado_revision', 'aprobada').eq('activa', true)),
      contar(db().from('cuentas').select('id', cab).eq('tipo', 'persona')),
      contar(db().from('cuentas').select('id', cab).eq('tipo', 'empresa')),
      contar(db().from('cuentas').select('id', cab).eq('tipo', 'admin').eq('habilitada', true)),
      contar(db().from('postulaciones').select('id', cab)),
      contar(db().from('postulaciones').select('id', cab).in('estado', DERIVADOS)),
      contar(db().from('postulaciones').select('id', cab).eq('estado', 'contratado')),
      contar(db().from('postulaciones').select('id', cab).eq('estado', 'no_contratado')),
      contar(db().from('derivaciones_curso').select('id', cab)),
    ]);
  const sinRevisar = await contar(db().from('postulaciones').select('id', cab).eq('estado', 'recibida'));
  const empresasEnRevision = await contar(db().from('cuentas').select('id', cab).eq('tipo', 'empresa').eq('personeria', 'juridica').eq('verificacion', 'en_revision'));
  return { pendientes, ofertasActivas, postulantes, empresas, admins, postulaciones, sinRevisar, empresasEnRevision, derivaciones, contrataciones, rechazos, derivacionesCurso };
}

// ---------- Empresas registradas (para asociarlas a una oferta) ----------
export async function listarEmpresas(): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await db().from('cuentas').select('id, nombre').eq('tipo', 'empresa').eq('habilitada', true).order('nombre');
  if (error) throw new Error(error.message);
  return (data as Fila[]).map((f) => ({ id: f.id, nombre: f.nombre }));
}

// Si se elige una empresa registrada, se usa su nombre; si no, el texto escrito
export async function resolverEmpresaAdmin(empresaId: string, nombreTexto: string): Promise<{ id: string | null; nombre: string }> {
  if (esUuid(empresaId)) {
    const { data, error } = await db().from('cuentas').select('id, nombre').eq('id', empresaId).eq('tipo', 'empresa').maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { id: data.id as string, nombre: data.nombre as string };
  }
  return { id: null, nombre: nombreTexto.trim() };
}
