'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// Alta de un curso de capacitación
export default function CursoForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk('');
    if (nombre.trim().length < 3) return setError('El nombre del curso debe tener al menos 3 caracteres.');
    setCargando(true);
    try {
      const r = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos crear el curso.');
      setOk('El curso se creó correctamente.');
      setNombre('');
      setDescripcion('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear el curso.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="nombre-curso">Nombre del curso</label>
      <input id="nombre-curso" type="text" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <label htmlFor="desc-curso">Descripción (opcional)</label>
      <input id="desc-curso" type="text" maxLength={300} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : 'Crear curso'}
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
