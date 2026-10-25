import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { empresaActual, listarPostulantes } from '../../../../../lib/empresa';
import { edad } from '../../../../../lib/validar';
import { ESTADOS, fechaLarga, fechaSolo } from '../../../../../lib/formato';
import Avatar from '../../../Avatar';
import DecisionEmpresa from '../../DecisionEmpresa';

export const metadata: Metadata = { title: 'Candidatos derivados · Funestrabajo' };

export default async function Postulantes({ params }: { params: Promise<{ id: string }> }) {
  const empresa = await empresaActual();
  if (!empresa) redirect('/panel');
  const { id } = await params;
  const r = await listarPostulantes(empresa.id, id);
  if (!r) notFound();
  const { oferta, postulantes } = r;

  return (
    <main className="contenedor contenedor-medio">
      <Link href="/panel" className="volver">
        ‹ Volver a mis ofertas
      </Link>
      <h1 className="titulo">Candidatos derivados</h1>
      <p className="sub">
        {oferta.titulo} · {postulantes.length === 1 ? '1 candidato' : `${postulantes.length} candidatos`}. Acá ves solo a quienes la Municipalidad derivó a esta oferta.
      </p>

      {postulantes.length === 0 ? (
        <p className="vacio">La Municipalidad todavía no derivó candidatos a esta oferta.</p>
      ) : (
        <ul className="lista">
          {postulantes.map((p) => (
            <li key={p.id} className="tarjeta postulante">
              <div className="postulante-cab">
                <Avatar nombre={p.nombre} fotoVersion={p.fotoVersion} tam={56} ruta={`/api/empresa/postulaciones/${p.id}/foto`} />
                <div className="postulante-nombre">
                  <h2>{p.nombre}</h2>
                  <p className="meta">{p.derivada ? `Derivado el ${fechaLarga(p.derivada)}` : 'Derivado'}</p>
                </div>
                <span className={`badge badge-${p.estado}`}>{ESTADOS[p.estado]}</span>
              </div>

              <dl className="postulante-datos">
                <div>
                  <dt>DNI</dt>
                  <dd>{p.dni || '—'}</dd>
                </div>
                <div>
                  <dt>Nacimiento</dt>
                  <dd>{p.fechaNacimiento ? `${fechaSolo(p.fechaNacimiento)} (${edad(p.fechaNacimiento)} años)` : '—'}</dd>
                </div>
                <div>
                  <dt>Correo</dt>
                  <dd>{p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '—'}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{p.telefono ? <a href={`tel:${p.telefono.replace(/[^\d+]/g, '')}`}>{p.telefono}</a> : '—'}</dd>
                </div>
                <div>
                  <dt>Localidad</dt>
                  <dd>{p.localidad || '—'}</dd>
                </div>
                <div>
                  <dt>Ocupación</dt>
                  <dd>{p.ocupacion || '—'}</dd>
                </div>
              </dl>

              {p.categorias.length > 0 && (
                <p className="meta">
                  {p.categorias.map((c) => (
                    <span key={c} className="etiqueta">
                      {c}
                    </span>
                  ))}
                </p>
              )}
              {p.experiencia && <p className="postulante-presentacion">{p.experiencia}</p>}
              {p.presentacion && <p className="postulante-presentacion">{p.presentacion}</p>}
              {p.notaMunicipal && (
                <p className="aviso">
                  <strong>Nota de la Municipalidad:</strong> {p.notaMunicipal}
                </p>
              )}

              <div className="acciones">
                {p.tieneCv ? (
                  <a className="btn" href={`/api/empresa/postulaciones/${p.id}/cv`} target="_blank" rel="noopener noreferrer">
                    Ver CV{p.cvNombre ? ` (${p.cvNombre})` : ''}
                  </a>
                ) : (
                  <span className="meta">Sin CV cargado</span>
                )}
              </div>

              {p.estado === 'derivada' ? (
                <DecisionEmpresa id={p.id} nombre={p.nombre} />
              ) : (
                <p className={p.estado === 'contratado' ? 'ok' : 'error'}>
                  {p.estado === 'contratado'
                    ? `Contrataste a este candidato${p.resultadoEn ? ` el ${fechaLarga(p.resultadoEn)}` : ''}.`
                    : `No contrataste a este candidato${p.resultadoEn ? ` el ${fechaLarga(p.resultadoEn)}` : ''}. Motivo: ${p.motivo}`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
