// Reglas para la foto de perfil. Se usan en el navegador y en el servidor.
export const FOTO_MAX = 1024 * 1024; // 1 MB (ya procesada)
export const FOTO_LADO = 480; // píxeles por lado de la imagen final
export const FOTO_CALIDAD = 0.88;
export const FOTO_ENTRADA_MAX = 10 * 1024 * 1024; // 10 MB de la foto original
export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

// Los archivos JPEG empiezan con los bytes FF D8 FF
export const esJpeg = (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
