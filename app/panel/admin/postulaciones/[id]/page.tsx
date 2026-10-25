import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { adminActual, obtenerPostulacionAdmin } from '../../../../../lib/admin';
import { puedeEscribir } from '../../../../../lib/roles';
import { edad } from '../../../../../lib/validar';
import { ESTADOS, RESULTADOS_PREENTREVISTA, fechaLarga, fechaSolo, type ResultadoPreentrevista } from '../../../../../lib/formato';
import Avatar from '../../../Avatar';
import GestionPostulacion from '../GestionPostulacion';

export const metadata: Metadata = { title: 'Postulación · Municipalidad' };

export default async function DetallePostulacion({ params }: { params: Promise<{ id: string }> }) {
  const admin = await adminActual();
  if (!admin) redirect('/panel');
  const { id } = await params;
  const r = await obtenerPostulacionAdmin(id);
  if (!r) notFound();
  const { postulacion: p, candidato: c, oferta, preentrevistas } = r;
  const escribir = puedeEscribir(admin.rol, 'candidatos');
  const abierta = p.estado === 'recibida' || p.estado === 'preentrevistada';

  return (
    <main className="contenedor contenedor-medio">
      <Link href="/panel/admin/postulaciones" className="volver">
        ‹ Volver a postulaciones
      </Link>

      <div className="tarjeta postulante">
        <div className="postulante-cab">
          <Avatar nombre={c.nombre} fotoVersion={c.fotoVersion} tam={64} ruta={`/api/admin/candidatos/${c.id}/foto`} />
          <div className="postulante-nombre">
            <h1 className="titulo">{c.nombre}</h1>
            <p className="meta">
              Postulación del {fechaLarga(p.creada)} ·{' '}
              <Link href={`/panel/admin/candidatos/${c.id}`}>Ver seguimiento del candidato</Link>
            </p>
          </div>
          <span className={`badge badge-${p.estado}`}>{ESTADOS[p.estado]}</span>
        </div>

        <p className="empresa">
          Oferta: <strong>{oferta.titulo}</strong> · {oferta.empresa}
          {!oferta.empresaId && ' (sin empresa registrada)'}
        </p>

        <dl className="postulante-datos">
          <div>
            <dt>DNI</dt>
            <dd>{c.dni}</dd>
          </div>
          <div>
            <dt>Nacimiento</dt>
            <dd>{`${fechaSolo(c.fechaNacimiento)} (${edad(c.fechaNacimiento)} años)`}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : '—'}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{c.telefono ? <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`}>{c.telefono}</a> : '—'}</dd>
          </div>
          <div>
            <dt>Localidad</dt>
            <dd>{c.localidad || '—'}</dd>
          </div>
          <div>
            <dt>Ocupación</dt>
            <dd>{c.ocupacion || '—'}</dd>
          </div>
        </dl>
        {c.categorias.length > 0 && (
          <p className="meta">
            {c.categorias.map((x) => (
              <span key={x} className="etiqueta">
                {x}
              </span>
            ))}
          </p>
        )}
        {c.experiencia && <p className="postulante-presentacion">{c.experiencia}</p>}
        {c.presentacion && <p className="postulante-presentacion">{c.presentacion}</p>}

        <div className="acciones">
          {c.tieneCv ? (
            <a className="btn" href={`/api/admin/candidatos/${c.id}/cv`} target="_blank" rel="noopener noreferrer">
              Ver CV{c.cvNombre ? ` (${c.cvNombre})` : ''}
            </a>
          ) : (
            <span className="meta">Sin CV cargado</span>
          )}
        </div>
      </div>

      <section className="bloque" aria-labelledby="t-hist">
        <h2 id="t-hist">Preentrevistas registradas</h2>
        {preentrevistas.length === 0 ? (
          <p className="meta">Todavía no se registró ninguna preentrevista para esta postulación.</p>
        ) : (
          <ul className="lista">
            {preentrevistas.map((x) => (
              <li key={x.id} className="tarjeta">
                <p className="meta">
                  {fechaLarga(x.fecha)} · Resultado: <strong>{RESULTADOS_PREENTREVISTA[x.resultado as ResultadoPreentrevista] ?? x.resultado}</strong>
                </p>
                <p>{x.observaciones}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!abierta && (
        <section className="bloque" aria-labelledby="t-res">
          <h2 id="t-res">Resultado</h2>
          {p.derivada && <p>Derivada a la empresa el {fechaLarga(p.derivada)}.</p>}
          {p.notaMunicipal && <p>Nota de la Municipalidad: {p.notaMunicipal}</p>}
          {p.estado === 'contratado' && <p className="ok">La empresa contrató al candidato{p.resultadoEn ? ` el ${fechaLarga(p.resultadoEn)}` : ''}.</p>}
          {p.estado === 'no_contratado' && (
            <p className="error">
              La empresa no contrató al candidato{p.resultadoEn ? ` el ${fechaLarga(p.resultadoEn)}` : ''}. Motivo: {p.motivo}
            </p>
          )}
          {p.estado === 'derivada' && <p className="meta">Esperando la decisión de la empresa.</p>}
          {p.estado === 'descartada' && <p className="meta">La Municipalidad descartó esta postulación.</p>}
        </section>
      )}

      {abierta && escribir && <GestionPostulacion id={p.id} puedeDerivar={Boolean(oferta.empresaId)} />}
    </main>
  );
}
