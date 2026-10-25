'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EstadoRevision } from '../../../lib/oferta';

// Acciones del administrador sobre una oferta: aprobar, rechazar, pausar, editar y eliminar
export default function AccionesAdminOferta({
  id,
  estadoRevision,
  activa,
  escribir,
}: {
  id: string;
  estadoRevision: EstadoRevision;
  activa: boolean;
  escribir: boolean;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<null | 'rechazar' | 'eliminar'>(null);
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!escribir) return null;

  async function llamar(metodo: 'PATCH' | 'DELETE', cuerpo?: object) {
    setError('');
    setCargando(true);
    try {
      const r = await fetch(`/api/admin/ofertas/${id}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos hacer el cambio.');
      setModo(null);
      setMotivo('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos hacer el cambio.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <div className="acciones acciones-oferta">
        {estadoRevision !== 'aprobada' && (
          <button className="btn" onClick={() => llamar('PATCH', { accion: 'aprobar' })} disabled={cargando}>
            Aprobar y publicar
          </button>
        )}
        {estadoRevision === 'pendiente' && (
          <button className="btn btn-sec" onClick={() => setModo('rechazar')} disabled={cargando}>
            Rechazar
          </button>
        )}
        {estadoRevision === 'aprobada' && (
          <button className="btn btn-sec" onClick={() => llamar('PATCH', { accion: activa ? 'pausar' : 'reactivar' })} disabled={cargando}>
            {activa ? 'Cerrar' : 'Reabrir'}
          </button>
        )}
        <Link className="btn btn-sec" href={`/panel/admin/ofertas/${id}/editar`}>
          Editar
        </Link>
        <button className="btn btn-peligro" onClick={() => setModo('eliminar')} disabled={cargando}>
          Eliminar
        </button>
      </div>

      {modo === 'rechazar' && (
        <div className="confirmar">
          <label htmlFor={`motivo-${id}`}>Motivo del rechazo (se lo mostramos a la empresa)</label>
          <textarea id={`motivo-${id}`} rows={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="acciones">
            <button className="btn btn-peligro" onClick={() => llamar('PATCH', { accion: 'rechazar', motivo })} disabled={cargando}>
              Confirmar rechazo
            </button>
            <button className="btn btn-sec" onClick={() => setModo(null)} disabled={cargando}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'eliminar' && (
        <div className="confirmar">
          <p>Se borra la oferta y todas sus postulaciones. No se puede deshacer.</p>
          <div className="acciones">
            <button className="btn btn-peligro" onClick={() => llamar('DELETE')} disabled={cargando}>
              Sí, eliminar
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
