import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { adminActual } from '../../../../../lib/admin';
import { puedeEscribir } from '../../../../../lib/roles';
import { obtenerEmpresaJuridica } from '../../../../../lib/verificacion';
import { OBLIGATORIOS, TIPOS_DOCUMENTO, VERIFICACION, claseVerificacion } from '../../../../../lib/documentos';
import { fechaLarga } from '../../../../../lib/formato';
import EvaluarEmpresa from '../EvaluarEmpresa';

export const metadata: Metadata = { title: 'Evaluar empresa · Municipalidad' };

export default async function EvaluarEmpresaPagina({ params }: { params: Promise<{ id: string }> }) {
  const admin = await adminActual();
  if (!admin) redirect('/panel');
  const { id } = await params;
  const r = await obtenerEmpresaJuridica(id);
  if (!r) notFound();
  const { empresa: e, documentos } = r;
  const escribir = puedeEscribir(admin.rol, 'empresas');
  const subidos = new Set(documentos.map((d) => d.tipo));

  return (
    <main className="contenedor contenedor-medio">
      <Link href="/panel/admin/empresas" className="volver">
        ‹ Volver a empresas
      </Link>

      <div className="tarjeta postulante">
        <div className="postulante-cab">
          <div className="postulante-nombre">
            <h1 className="titulo">{e.nombre}</h1>
            <p className="meta">Registrada el {fechaLarga(e.creada)} · usuario {e.usuario}</p>
          </div>
          <span className={claseVerificacion(e.verificacion)}>{VERIFICACION[e.verificacion]}</span>
        </div>
        <dl className="postulante-datos">
          <div>
            <dt>CUIT</dt>
            <dd>{e.dni}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{e.email ? <a href={`mailto:${e.email}`}>{e.email}</a> : '—'}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{e.telefono || '—'}</dd>
          </div>
          <div>
            <dt>Localidad</dt>
            <dd>{e.localidad || '—'}</dd>
          </div>
        </dl>
        {e.verificacion === 'observada' && e.nota && (
          <p className="error">
            <strong>Observaciones enviadas a la empresa:</strong> {e.nota}
          </p>
        )}
      </div>

      <section className="bloque" aria-labelledby="t-docs">
        <h2 id="t-docs">Documentación ({documentos.length})</h2>
        <ul className="checklist">
          {OBLIGATORIOS.map((t) => (
            <li key={t} className={subidos.has(t) ? 'hecho' : undefined}>
              {TIPOS_DOCUMENTO[t]}
            </li>
          ))}
        </ul>
        {documentos.length === 0 ? (
          <p className="meta">La empresa todavía no subió documentos.</p>
        ) : (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Archivo</th>
                  <th>Subido</th>
                  <th>
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id}>
                    <td>{TIPOS_DOCUMENTO[d.tipo]}</td>
                    <td>{d.nombre}</td>
                    <td>{fechaLarga(d.subido)}</td>
                    <td>
                      <a className="btn btn-sec" href={`/api/admin/empresas/${e.id}/documentos/${d.id}`} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {escribir && (
        <section className="bloque" aria-labelledby="t-eval">
          <h2 id="t-eval">Evaluación</h2>
          <EvaluarEmpresa id={e.id} tieneDocumentos={documentos.length > 0} />
        </section>
      )}
    </main>
  );
}
