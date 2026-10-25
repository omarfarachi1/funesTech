// Verificación de empresas jurídicas: tipos de documento, estados y reglas de los archivos.
export const TIPOS_DOCUMENTO = {
  estatuto: 'Estatuto o contrato social',
  cuit: 'Constancia de inscripción en ARCA (CUIT)',
  autoridades: 'Acta de designación de autoridades o poder del representante',
  otro: 'Otro documento de respaldo',
} as const;
export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;
export const esTipoDocumento = (v: unknown): v is TipoDocumento => typeof v === 'string' && v in TIPOS_DOCUMENTO;

// Documentación mínima recomendada (se muestra como lista de control; no bloquea nada)
export const OBLIGATORIOS: TipoDocumento[] = ['estatuto', 'cuit', 'autoridades'];

export const VERIFICACION = {
  sin_enviar: 'Sin documentación',
  en_revision: 'En revisión',
  verificada: 'Verificada',
  observada: 'Con observaciones',
} as const;
export type EstadoVerificacion = keyof typeof VERIFICACION;

export const claseVerificacion = (e: EstadoVerificacion) =>
  e === 'verificada' ? 'badge badge-contratado'
  : e === 'en_revision' ? 'badge badge-en_revision'
  : e === 'observada' ? 'badge badge-no_contratado'
  : 'badge';

export const DOC_MAX = 4 * 1024 * 1024; // 4 MB
export const MAX_DOCUMENTOS = 10;

export type ExtDoc = 'pdf' | 'jpg' | 'png';
export const TIPO_MIME: Record<ExtDoc, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' };

export function extensionDoc(nombre: string): ExtDoc | null {
  const e = nombre.toLowerCase().split('.').pop();
  if (e === 'pdf') return 'pdf';
  if (e === 'jpg' || e === 'jpeg') return 'jpg';
  if (e === 'png') return 'png';
  return null;
}

// Comprueba los primeros bytes: no alcanza con renombrar la extensión
export function coincideDoc(ext: ExtDoc, b: Uint8Array): boolean {
  const empieza = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  if (ext === 'pdf') return empieza(0x25, 0x50, 0x44, 0x46, 0x2d); // %PDF-
  if (ext === 'jpg') return empieza(0xff, 0xd8, 0xff);
  return empieza(0x89, 0x50, 0x4e, 0x47); // PNG
}
