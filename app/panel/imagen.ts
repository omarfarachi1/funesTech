// Recorta la imagen al centro con la proporción pedida, la achica y la convierte a JPEG (solo navegador).
export async function recortarJpeg(archivo: File, ancho: number, alto: number, calidad: number): Promise<Blob> {
  const img = await createImageBitmap(archivo);
  const proporcion = ancho / alto;
  let sw = img.width;
  let sh = img.width / proporcion;
  if (sh > img.height) {
    sh = img.height;
    sw = img.height * proporcion;
  }
  const w = Math.min(ancho, Math.round(sw));
  const h = Math.round(w / proporcion);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  img.close();
  return new Promise((ok, fallo) => canvas.toBlob((b) => (b ? ok(b) : fallo(new Error('blob'))), 'image/jpeg', calidad));
}
