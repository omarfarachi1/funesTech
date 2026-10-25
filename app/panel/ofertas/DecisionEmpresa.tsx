'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// La empresa informa si contrata o no al candidato derivado. Si no contrata, el motivo es obligatorio.
export default function DecisionEmpresa({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<null | 'contratar' | 'no_contratar'>(null);
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function enviar() {
    if (modo === 'no_contratar' && motivo.trim().length < 5) {
      setError('Indicá el motivo por el que no contratás (al menos 5 caracteres).');
      return;
    }
    setError('');
    setCargando(true);
    try {
      const r = await fetch(`/api/empresa/postulaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: modo, motivo }),
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos registrar la decisión.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar la decisión.');
      setCargando(false);
    }
  }

  return (
    <div className="confirmar">
      {!modo ? (
        <>
          <p>
            <strong>¿Qué decidís sobre {nombre}?</strong>
          </p>
          <div className="acciones">
            <button className="btn" onClick={() => setModo('contratar')}>
              Contratar
            </button>
            <button className="btn btn-sec" onClick={() => setModo('no_contratar')}>
              No contratar
            </button>
          </div>
        </>
      ) : modo === 'contratar' ? (
        <>
          <p>¿Confirmás que contratás a {nombre}?</p>
          <div className="acciones">
            <button className="btn" onClick={enviar} disabled={cargando}>
              {cargando ? 'Guardando…' : 'Sí, contratar'}
            </button>
            <button className="btn btn-sec" onClick={() => setModo(null)} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <label htmlFor={`motivo-${id}`}>Motivo por el que no contratás (obligatorio)</label>
          <textarea id={`motivo-${id}`} rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="acciones">
            <button className="btn btn-peligro" onClick={enviar} disabled={cargando}>
              {cargando ? 'Guardando…' : 'Confirmar: no contratar'}
            </button>
            <button className="btn btn-sec" onClick={() => setModo(null)} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="campo-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
