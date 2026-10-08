'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CV_MAX, extensionCv } from '../../../lib/cv';

export default function CvCard({
  cvNombre,
  actualizado,
}: {
  cvNombre: string | null;
  actualizado: string | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    setError('');
    setOk('');
    if (!extensionCv(archivo.name)) return setError('El CV debe ser un archivo PDF, DOC o DOCX.');
    if (archivo.size > CV_MAX) return setError('El archivo supera los 4 MB.');

    setCargando(true);
    try {
      const form = new FormData();
      form.append('cv', archivo);
      const r = await fetch('/api/perfil/cv', { method: 'POST', body: form });
      const data: { error?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos cargar el archivo.');
      setOk('Tu CV se cargó correctamente.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos cargar el archivo.'
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
      const r = await fetch('/api/perfil/cv', { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setConfirmando(false);
      setOk('Se quitó tu CV.');
      router.refresh();
    } catch {
      setError('No pudimos quitar el CV. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={elegir}
      />

      {cvNombre ? (
        <div className="cv-actual">
          <div>
            <p className="cv-nombre">{cvNombre}</p>
            {actualizado && <p className="meta">Cargado el {actualizado}</p>}
          </div>
          <div className="acciones">
            <a className="btn btn-sec" href="/api/perfil/cv" target="_blank" rel="noopener noreferrer">
              Ver CV
            </a>
            <button className="btn btn-sec" onClick={() => input.current?.click()} disabled={cargando}>
              {cargando ? 'Cargando…' : 'Reemplazar'}
            </button>
            {confirmando ? (
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
                Quitar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p>Todavía no cargaste tu currículum. Lo necesitás para postularte a las ofertas.</p>
          <div className="acciones">
            <button className="btn" onClick={() => input.current?.click()} disabled={cargando}>
              {cargando ? 'Cargando…' : 'Cargar CV'}
            </button>
          </div>
        </div>
      )}

      <p className="meta">Formatos admitidos: PDF, DOC o DOCX. Tamaño máximo: 4 MB.</p>
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
