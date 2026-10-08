// Reglas para el currículum. Se usan en el formulario y en el servidor.
export const CV_MAX = 4 * 1024 * 1024; // 4 MB

export const CV_FORMATOS = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export type ExtCv = keyof typeof CV_FORMATOS;

export function extensionCv(nombre: string): ExtCv | null {
  const e = nombre.toLowerCase().split('.').pop();
  return e === 'pdf' || e === 'doc' || e === 'docx' ? e : null;
}

// Comprueba los primeros bytes del archivo, para que no alcance con renombrar la extensión.
export function coincideContenido(ext: ExtCv, b: Uint8Array): boolean {
  const empieza = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  if (ext === 'pdf') return empieza(0x25, 0x50, 0x44, 0x46, 0x2d); // %PDF-
  if (ext === 'docx') return empieza(0x50, 0x4b, 0x03, 0x04); // PK.. (zip)
  return empieza(0xd0, 0xcf, 0x11, 0xe0); // formato DOC antiguo
}
