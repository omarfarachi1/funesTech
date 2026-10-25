'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// La Municipalidad evalúa la documentación: verifica la empresa o deja observaciones
export default function EvaluarEmpresa({ id, tieneDocumentos }: { id: string; tieneDocumentos: boolean }) {
  const router = useRouter();
  const [modo, setModo] = useState<null | 'verificar' | 'observar'>(null);
  const [nota, setNota] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function enviar() {
    if (modo === 'observar' && nota.trim().length < 5) return setError('Escribí las observaciones para la empresa (al menos 5 caracteres).');
    setError('');
    setCargando(true);
    try {
      const r = await fetch(`/api/admin/empresas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: modo, nota }),
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos guardar la evaluación.');
      setModo(null);
      setNota('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar la evaluación.');
    } finally {
      setCargando(false);
    }
  }

  if (!tieneDocumentos) return <p className="meta">La empresa todavía no subió documentación para evaluar.</p>;

  return (
    <div>
      {!modo ? (
        <div className="acciones">
          <button className="btn" onClick={() => setModo('verificar')}>
            Verificar empresa
          </button>
          <button className="btn btn-sec" onClick={() => setModo('observar')}>
            Dejar observaciones
          </button>
        </div>
      ) : modo === 'verificar' ? (
        <div className="confirmar">
          <p>¿Confirmás que la documentación es correcta y que la empresa queda verificada?</p>
          <div className="acciones">
            <button className="btn" onClick={enviar} disabled={cargando}>
              {cargando ? 'Guardando…' : 'Sí, verificar'}
            </button>
            <button className="btn btn-sec" onClick={() => setModo(null)} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="confirmar">
          <label htmlFor="obs-empresa">Observaciones para la empresa (qué falta o qué corregir)</label>
          <textarea id="obs-empresa" rows={3} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} />
          <div className="acciones">
            <button className="btn btn-peligro" onClick={enviar} disabled={cargando}>
              {cargando ? 'Guardando…' : 'Enviar observaciones'}
            </button>
            <button className="btn btn-sec" onClick={() => setModo(null)} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="campo-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
