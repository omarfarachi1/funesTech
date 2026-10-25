'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { RESULTADOS_PREENTREVISTA } from '../../../../lib/formato';

// Gestión de la Municipalidad: preentrevista (opcional) y decisión de derivar o descartar
export default function GestionPostulacion({ id, puedeDerivar }: { id: string; puedeDerivar: boolean }) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [resultado, setResultado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [nota, setNota] = useState('');
  const [confirmando, setConfirmando] = useState<null | 'derivar' | 'descartar'>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function llamar(url: string, metodo: 'POST' | 'PATCH', cuerpo: object, exito: string) {
    setError('');
    setOk('');
    setCargando(true);
    try {
      const r = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos hacer el cambio.');
      setOk(exito);
      setConfirmando(null);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos hacer el cambio.');
      return false;
    } finally {
      setCargando(false);
    }
  }

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resultado) return setError('Elegí el resultado de la preentrevista.');
    if (observaciones.trim().length < 5) return setError('Escribí las observaciones de la preentrevista (al menos 5 caracteres).');
    const listo = await llamar(`/api/admin/postulaciones/${id}/preentrevistas`, 'POST', { fecha, resultado, observaciones }, 'La preentrevista quedó registrada.');
    if (listo) {
      setResultado('');
      setObservaciones('');
    }
  }

  return (
    <div>
      <section className="bloque" aria-labelledby="t-pre">
        <h2 id="t-pre">Registrar preentrevista (opcional)</h2>
        <p className="meta">No es un requisito: podés derivar al candidato sin realizar ni registrar una preentrevista.</p>
        <form onSubmit={registrar} noValidate>
          <div className="rejilla">
            <div>
              <label htmlFor="fecha">Fecha</label>
              <input id="fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label htmlFor="resultado">Resultado</label>
              <select id="resultado" value={resultado} onChange={(e) => setResultado(e.target.value)}>
                <option value="">Elegí un resultado</option>
                {Object.entries(RESULTADOS_PREENTREVISTA).map(([k, texto]) => (
                  <option key={k} value={k}>
                    {texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="ancho">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea id="observaciones" rows={3} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
          <div className="acciones">
            <button type="submit" className="btn btn-sec" disabled={cargando}>
              {cargando ? 'Guardando…' : 'Registrar preentrevista'}
            </button>
          </div>
        </form>
      </section>

      <section className="bloque" aria-labelledby="t-dec">
        <h2 id="t-dec">Decisión de la Municipalidad</h2>
        <label htmlFor="nota">Nota para la empresa (opcional)</label>
        <textarea id="nota" rows={3} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} />

        {!puedeDerivar && (
          <p className="aviso">Esta oferta no está asociada a una empresa registrada, por eso no se puede derivar. Asignale una empresa al editar la oferta.</p>
        )}

        {confirmando ? (
          <div className="confirmar">
            <p>{confirmando === 'derivar' ? '¿Confirmás que derivás el candidato a la empresa?' : '¿Confirmás que descartás esta postulación?'}</p>
            <div className="acciones">
              <button
                className={confirmando === 'derivar' ? 'btn' : 'btn btn-peligro'}
                disabled={cargando}
                onClick={() =>
                  llamar(`/api/admin/postulaciones/${id}`, 'PATCH', { accion: confirmando, nota }, confirmando === 'derivar' ? 'El candidato fue derivado a la empresa.' : 'La postulación fue descartada.')
                }
              >
                {cargando ? 'Guardando…' : 'Confirmar'}
              </button>
              <button className="btn btn-sec" onClick={() => setConfirmando(null)} disabled={cargando}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="acciones">
            <button className="btn" onClick={() => setConfirmando('derivar')} disabled={cargando || !puedeDerivar}>
              Derivar a la empresa
            </button>
            <button className="btn btn-peligro" onClick={() => setConfirmando('descartar')} disabled={cargando}>
              Descartar
            </button>
          </div>
        )}
      </section>

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
