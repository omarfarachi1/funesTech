'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// Registra la derivación de un postulante a un curso de capacitación
export default function DerivarCurso({ cuentaId, cursos }: { cuentaId: string; cursos: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [cursoId, setCursoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk('');
    if (!cursoId) return setError('Elegí un curso.');
    setCargando(true);
    try {
      const r = await fetch(`/api/admin/candidatos/${cuentaId}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId, observaciones }),
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos registrar la derivación.');
      setOk('La derivación al curso quedó registrada.');
      setCursoId('');
      setObservaciones('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar la derivación.');
    } finally {
      setCargando(false);
    }
  }

  if (cursos.length === 0) {
    return <p className="meta">Todavía no hay cursos cargados. Podés crearlos en la sección Cursos.</p>;
  }

  return (
    <form onSubmit={enviar} noValidate className="confirmar">
      <label htmlFor="curso">Derivar a un curso</label>
      <select id="curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
        <option value="">Elegí un curso</option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <label htmlFor="obs-curso">Observaciones (opcional)</label>
      <input id="obs-curso" type="text" maxLength={300} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : 'Registrar derivación'}
        </button>
      </div>
      {error && (
        <p className="campo-msg" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="ok" role="status">
          {ok}
        </p>
      )}
    </form>
  );
}
