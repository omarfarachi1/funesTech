'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Pausar o reactivar una oferta
export default function AccionesOferta({ id, activa }: { id: string; activa: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function cambiar() {
    setError('');
    setCargando(true);
    try {
      const r = await fetch(`/api/empresa/ofertas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !activa }),
      });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError('No pudimos cambiar el estado. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button className="btn btn-sec" onClick={cambiar} disabled={cargando}>
        {cargando ? 'Guardando…' : activa ? 'Cerrar oferta' : 'Reabrir oferta'}
      </button>
      {error && (
        <span className="campo-msg" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
