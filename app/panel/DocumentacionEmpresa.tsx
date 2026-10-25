'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  DOC_MAX,
  OBLIGATORIOS,
  TIPOS_DOCUMENTO,
  VERIFICACION,
  claseVerificacion,
  extensionDoc,
  type EstadoVerificacion,
  type TipoDocumento,
} from '../../lib/documentos';

type Doc = { id: string; tipo: TipoDocumento; nombre: string; subido: string };

const TEXTO: Record<EstadoVerificacion, string> = {
  sin_enviar: 'Todavía no subiste documentación. Es obligatorio para que la Municipalidad verifique que sos una persona jurídica.',
  en_revision: 'La Municipalidad está revisando tu documentación. Te vamos a mostrar el resultado acá.',
  verificada: 'La Municipalidad verificó tu empresa. ¡Gracias!',
  observada: 'La Municipalidad dejó observaciones. Podés subir documentos nuevos y la documentación vuelve a revisión.',
};

// Documentación de una empresa jurídica: subir, ver y eliminar archivos, y ver el estado de la verificación
export default function DocumentacionEmpresa({ estado, nota, documentos }: { estado: EstadoVerificacion; nota: string; documentos: Doc[] }) {
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const subidos = new Set(documentos.map((d) => d.tipo));

  async function subir(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk('');
    const f = archivo.current?.files?.[0];
    if (!tipo) return setError('Elegí qué tipo de documento vas a subir.');
    if (!f) return setError('Elegí un archivo para subir.');
    if (!extensionDoc(f.name)) return setError('El archivo debe ser PDF, JPG o PNG.');
    if (f.size > DOC_MAX) return setError('El archivo supera los 4 MB.');
    setCargando(true);
    try {
      const form = new FormData();
      form.append('tipo', tipo);
      form.append('archivo', f);
      const r = await fetch('/api/empresa/documentos', { method: 'POST', body: form });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? `El servidor no pudo procesar el pedido (código ${r.status}).`);
      setOk('El documento se subió correctamente.');
      setTipo('');
      if (archivo.current) archivo.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos subir el documento.');
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: string) {
    setError('');
    setOk('');
    setCargando(true);
    try {
      const r = await fetch(`/api/empresa/documentos/${id}`, { method: 'DELETE' });
      const data: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? 'No pudimos eliminar el documento.');
      setQuitando(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar el documento.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <p>
        Estado: <span className={claseVerificacion(estado)}>{VERIFICACION[estado]}</span>
      </p>
      <p className="meta">{TEXTO[estado]}</p>
      {estado === 'observada' && nota && (
        <p className="error">
          <strong>Observaciones de la Municipalidad:</strong> {nota}
        </p>
      )}

      <p className="meta">
        <strong>Documentación sugerida:</strong>
      </p>
      <ul className="checklist">
        {OBLIGATORIOS.map((t) => (
          <li key={t} className={subidos.has(t) ? 'hecho' : undefined}>
            {TIPOS_DOCUMENTO[t]}
          </li>
        ))}
      </ul>

      <form onSubmit={subir} noValidate className="confirmar">
        <label htmlFor="doc-tipo">Tipo de documento</label>
        <select id="doc-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Elegí un tipo</option>
          {(Object.keys(TIPOS_DOCUMENTO) as TipoDocumento[]).map((t) => (
            <option key={t} value={t}>
              {TIPOS_DOCUMENTO[t]}
            </option>
          ))}
        </select>
        <label htmlFor="doc-archivo">Archivo (PDF, JPG o PNG, hasta 4 MB)</label>
        <input id="doc-archivo" ref={archivo} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" />
        <div className="acciones">
          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Subiendo…' : 'Subir documento'}
          </button>
        </div>
      </form>

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

      {documentos.length > 0 && (
        <div className="tabla-wrap documentos-lista">
          <table className="tabla">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Archivo</th>
                <th>Subido</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id}>
                  <td>{TIPOS_DOCUMENTO[d.tipo]}</td>
                  <td>{d.nombre}</td>
                  <td>{d.subido}</td>
                  <td>
                    <div className="acciones acciones-oferta">
                      <a className="btn btn-sec" href={`/api/empresa/documentos/${d.id}`} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                      {estado !== 'verificada' &&
                        (quitando === d.id ? (
                          <>
                            <button className="btn btn-peligro" onClick={() => eliminar(d.id)} disabled={cargando}>
                              Sí, eliminar
                            </button>
                            <button className="btn btn-sec" onClick={() => setQuitando(null)} disabled={cargando}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-sec" onClick={() => setQuitando(d.id)} disabled={cargando}>
                            Eliminar
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
