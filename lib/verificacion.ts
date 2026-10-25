import { randomUUID } from 'node:crypto';
import { db } from './supabase';
import { esUuid } from './validar';
import { MAX_DOCUMENTOS, TIPO_MIME, type EstadoVerificacion, type ExtDoc, type TipoDocumento } from './documentos';
import type { Admin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

const BUCKET = 'documentacion';

export type Documento = { id: string; tipo: TipoDocumento; nombre: string; subido: string };
export type Resultado = { ok: true } | { error: string; status: number };

const aDocumento = (f: Fila): Documento => ({ id: f.id, tipo: f.tipo, nombre: f.nombre_archivo, subido: f.subido_en });

// ---------- Del lado de la empresa ----------
export async function listarDocumentos(empresaId: string): Promise<Documento[]> {
  const { data, error } = await db()
    .from('documentos_empresa')
    .select('id, tipo, nombre_archivo, subido_en')
    .eq('empresa_id', empresaId)
    .order('subido_en', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Fila[]).map(aDocumento);
}

// Al subir un documento, la empresa queda "en revisión" (si estaba sin enviar o con observaciones).
export async function subirDocumento(
  empresa: { id: string; verificacion: EstadoVerificacion },
  tipo: TipoDocumento,
  nombre: string,
  ext: ExtDoc,
  contenido: Buffer
): Promise<Resultado> {
  if ((await listarDocumentos(empresa.id)).length >= MAX_DOCUMENTOS) {
    return { error: `Podés subir hasta ${MAX_DOCUMENTOS} documentos. Eliminá alguno para agregar otro.`, status: 409 };
  }
  const id = randomUUID();
  const ruta = `${empresa.id}/${id}.${ext}`;
  const { error } = await db().storage.from(BUCKET).upload(ruta, contenido, { contentType: TIPO_MIME[ext], upsert: false });
  if (error) throw new Error(error.message);

  const { error: e2 } = await db().from('documentos_empresa').insert({ id, empresa_id: empresa.id, tipo, nombre_archivo: nombre.slice(0, 150), ruta });
  if (e2) {
    await db().storage.from(BUCKET).remove([ruta]);
    throw new Error(e2.message);
  }
  if (empresa.verificacion === 'sin_enviar' || empresa.verificacion === 'observada') {
    const { error: e3 } = await db().from('cuentas').update({ verificacion: 'en_revision' }).eq('id', empresa.id);
    if (e3) throw new Error(e3.message);
  }
  return { ok: true };
}

export async function obtenerDocumento(id: string): Promise<{ empresaId: string; ruta: string } | null> {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('documentos_empresa').select('empresa_id, ruta').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { empresaId: data.empresa_id, ruta: data.ruta } : null;
}

// Si la empresa ya está verificada no puede borrar documentos. Si se queda sin ninguno, vuelve a "sin documentación".
export async function eliminarDocumento(empresa: { id: string; verificacion: EstadoVerificacion }, docId: string): Promise<Resultado> {
  const doc = await obtenerDocumento(docId);
  if (!doc || doc.empresaId !== empresa.id) return { error: 'No encontramos ese documento.', status: 404 };
  if (empresa.verificacion === 'verificada') {
    return { error: 'Tu empresa ya está verificada: los documentos no se pueden eliminar. Escribile a la Municipalidad si necesitás cambiar algo.', status: 409 };
  }
  await db().storage.from(BUCKET).remove([doc.ruta]);
  const { error } = await db().from('documentos_empresa').delete().eq('id', docId).eq('empresa_id', empresa.id);
  if (error) throw new Error(error.message);
  if ((await listarDocumentos(empresa.id)).length === 0 && empresa.verificacion === 'en_revision') {
    const { error: e2 } = await db().from('cuentas').update({ verificacion: 'sin_enviar' }).eq('id', empresa.id);
    if (e2) throw new Error(e2.message);
  }
  return { ok: true };
}

// Enlace temporal (1 minuto) para ver el documento
export async function urlDocumento(ruta: string): Promise<string | null> {
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(ruta, 60);
  return error ? null : data.signedUrl;
}

// ---------- Del lado de la Municipalidad ----------
export type EmpresaJuridica = {
  id: string;
  nombre: string;
  dni: string;
  usuario: string;
  email: string;
  telefono: string;
  localidad: string;
  creada: string;
  verificacion: EstadoVerificacion;
  nota: string;
  documentos: number;
};

const COLS = 'id, nombre, dni, usuario, email, telefono, localidad, creada_en, verificacion, verificacion_nota';
const aEmpresa = (f: Fila, documentos: number): EmpresaJuridica => ({
  id: f.id,
  nombre: f.nombre,
  dni: f.dni,
  usuario: f.usuario,
  email: f.email ?? '',
  telefono: f.telefono ?? '',
  localidad: f.localidad ?? '',
  creada: f.creada_en,
  verificacion: f.verificacion ?? 'sin_enviar',
  nota: f.verificacion_nota ?? '',
  documentos,
});

export async function listarEmpresasJuridicas(): Promise<EmpresaJuridica[]> {
  const { data, error } = await db().from('cuentas').select(COLS).eq('tipo', 'empresa').eq('personeria', 'juridica').order('nombre');
  if (error) throw new Error(error.message);
  const { data: docs, error: e2 } = await db().from('documentos_empresa').select('empresa_id');
  if (e2) throw new Error(e2.message);
  const cuenta: Record<string, number> = {};
  for (const d of docs as Fila[]) cuenta[d.empresa_id] = (cuenta[d.empresa_id] ?? 0) + 1;
  return (data as Fila[]).map((f) => aEmpresa(f, cuenta[f.id] ?? 0));
}

export async function obtenerEmpresaJuridica(id: string) {
  if (!esUuid(id)) return null;
  const { data, error } = await db().from('cuentas').select(COLS).eq('id', id).eq('tipo', 'empresa').eq('personeria', 'juridica').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const documentos = await listarDocumentos(id);
  return { empresa: aEmpresa(data, documentos.length), documentos };
}

// La Municipalidad evalúa la documentación: verifica la empresa o deja observaciones.
export async function evaluarEmpresa(admin: Admin, id: string, accion: 'verificar' | 'observar', nota: string): Promise<Resultado> {
  const r = await obtenerEmpresaJuridica(id);
  if (!r) return { error: 'No encontramos esa empresa.', status: 404 };
  if (r.documentos.length === 0) return { error: 'La empresa todavía no subió documentación.', status: 409 };
  const texto = nota.trim();
  if (accion === 'observar' && (texto.length < 5 || texto.length > 500)) {
    return { error: 'Escribí las observaciones para la empresa (entre 5 y 500 caracteres).', status: 400 };
  }
  const { error } = await db()
    .from('cuentas')
    .update({
      verificacion: accion === 'verificar' ? 'verificada' : 'observada',
      verificacion_nota: accion === 'observar' ? texto : null,
      verificada_por: admin.id,
      verificada_en: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// Empresas jurídicas con documentación esperando revisión (para el tablero)
export async function contarEnRevision(): Promise<number> {
  const { count, error } = await db()
    .from('cuentas')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'empresa')
    .eq('personeria', 'juridica')
    .eq('verificacion', 'en_revision');
  if (error) throw new Error(error.message);
  return count ?? 0;
}
