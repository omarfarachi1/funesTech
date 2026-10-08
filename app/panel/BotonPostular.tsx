'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BotonPostular({
  ofertaId,
  yaPostulado,
  tieneCv,
}: {
  ofertaId: string;
  yaPostulado: boolean;
  tieneCv: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (yaPostulado) {
    return (
      <button className="btn" disabled>
        Ya te postulaste
      </button>
    );
  }
  if (!tieneCv) {
    return (
      <Link href="/panel/perfil" className="btn btn-sec">
        Cargá tu CV para postularte
      </Link>
    );
  }

  async function postular() {
    setError('');
    setCargando(true);
    try {
      const r = await fetch('/api/postulaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ofertaId }),
      });
      const data: { error?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos enviar tu postulación.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos enviar tu postulación.'
      );
      setCargando(false);
    }
  }

  return (
    <div>
      <button className="btn" onClick={postular} disabled={cargando}>
        {cargando ? 'Enviando…' : 'Postularme'}
      </button>
      {error && (
        <p className="campo-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
