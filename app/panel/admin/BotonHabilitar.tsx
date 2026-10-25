'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Dar de baja (deshabilitar) o reactivar una cuenta. "api" es la dirección que atiende el cambio.
export default function BotonHabilitar({ api, habilitada }: { api: string; habilitada: boolean }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cambiar() {
    setError('');
    setCargando(true);
    try {
      const r = await fetch(api, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitada: !habilitada }),
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos hacer el cambio.');
      setConfirmando(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos hacer el cambio.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="acciones acciones-oferta">
      {!habilitada ? (
        <button className="btn" onClick={cambiar} disabled={cargando}>
          {cargando ? 'Guardando…' : 'Habilitar'}
        </button>
      ) : confirmando ? (
        <>
          <button className="btn btn-peligro" onClick={cambiar} disabled={cargando}>
            {cargando ? 'Guardando…' : 'Sí, deshabilitar'}
          </button>
          <button className="btn btn-sec" onClick={() => setConfirmando(false)} disabled={cargando}>
            Cancelar
          </button>
        </>
      ) : (
        <button className="btn btn-sec" onClick={() => setConfirmando(true)}>
          Deshabilitar
        </button>
      )}
      {error && (
        <span className="campo-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
