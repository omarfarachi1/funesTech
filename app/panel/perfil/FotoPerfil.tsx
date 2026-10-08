'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../Avatar';
import { FOTO_CALIDAD, FOTO_ENTRADA_MAX, FOTO_LADO, TIPOS_FOTO } from '../../../lib/foto';

// Recorta la imagen en un cuadrado centrado, la achica y la convierte a JPEG.
async function procesar(archivo: File): Promise<Blob> {
  const img = await createImageBitmap(archivo);
  const lado = Math.min(img.width, img.height);
  const salida = Math.min(FOTO_LADO, lado);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = salida;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff'; // los PNG con transparencia quedan sobre fondo blanco
  ctx.fillRect(0, 0, salida, salida);
  ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, salida, salida);
  img.close();
  return new Promise((ok, fallo) =>
    canvas.toBlob((b) => (b ? ok(b) : fallo(new Error('blob'))), 'image/jpeg', FOTO_CALIDAD)
  );
}

export default function FotoPerfil({ nombre, fotoVersion }: { nombre: string; fotoVersion: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [nueva, setNueva] = useState<{ blob: Blob; url: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Libera la vista previa cuando se reemplaza o se cierra la pantalla
  useEffect(() => () => { if (nueva) URL.revokeObjectURL(nueva.url); }, [nueva]);

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    setOk('');
    if (!TIPOS_FOTO.includes(archivo.type)) return setError('Elegí una imagen JPG, PNG o WebP.');
    if (archivo.size > FOTO_ENTRADA_MAX) return setError('La imagen supera los 10 MB.');
    try {
      const blob = await procesar(archivo);
      setNueva({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError('No pudimos leer esa imagen. Probá con otra.');
    }
  }

  async function guardar() {
    if (!nueva) return;
    setError('');
    setCargando(true);
    try {
      const form = new FormData();
      form.append('foto', nueva.blob, 'foto.jpg');
      const r = await fetch('/api/perfil/foto', { method: 'POST', body: form });
      const data: { error?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos guardar la foto.');
      setNueva(null);
      setOk('Tu foto se actualizó.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos guardar la foto.'
      );
    } finally {
      setCargando(false);
    }
  }

  async function quitar() {
    setError('');
    setOk('');
    setCargando(true);
    try {
      const r = await fetch('/api/perfil/foto', { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setConfirmando(false);
      setOk('Se quitó tu foto.');
      router.refresh();
    } catch {
      setError('No pudimos quitar la foto. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <input ref={input} type="file" hidden accept={TIPOS_FOTO.join(',')} onChange={elegir} />

      <div className="foto-bloque">
        {nueva ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={nueva.url} alt="Vista previa de tu nueva foto" width={112} height={112} style={{ width: 112, height: 112 }} />
        ) : (
          <Avatar nombre={nombre} fotoVersion={fotoVersion} tam={112} />
        )}

        <div>
          {nueva ? (
            <>
              <p className="meta">Así se va a ver tu foto.</p>
              <div className="acciones">
                <button className="btn" onClick={guardar} disabled={cargando}>
                  {cargando ? 'Guardando…' : 'Guardar foto'}
                </button>
                <button className="btn btn-sec" onClick={() => input.current?.click()} disabled={cargando}>
                  Elegir otra
                </button>
                <button className="btn btn-sec" onClick={() => setNueva(null)} disabled={cargando}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="acciones">
              <button className="btn" onClick={() => input.current?.click()} disabled={cargando}>
                {fotoVersion ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {fotoVersion &&
                (confirmando ? (
                  <>
                    <button className="btn btn-peligro" onClick={quitar} disabled={cargando}>
                      Sí, quitar
                    </button>
                    <button className="btn btn-sec" onClick={() => setConfirmando(false)} disabled={cargando}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button className="btn btn-sec" onClick={() => setConfirmando(true)} disabled={cargando}>
                    Quitar foto
                  </button>
                ))}
            </div>
          )}
          <p className="meta">JPG, PNG o WebP. Se recorta en cuadrado automáticamente.</p>
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="ok" role="status">
          {ok}
        </p>
      )}
    </div>
  );
}
