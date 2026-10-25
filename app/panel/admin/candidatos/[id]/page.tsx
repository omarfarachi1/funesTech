import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { adminActual, listarCursos, obtenerSeguimiento } from '../../../../../lib/admin';
import { puedeEscribir } from '../../../../../lib/roles';
import { edad } from '../../../../../lib/validar';
import { ESTADOS, RESULTADOS_PREENTREVISTA, fechaLarga, fechaSolo, type ResultadoPreentrevista } from '../../../../../lib/formato';
import Avatar from '../../../Avatar';
import BotonHabilitar from '../../BotonHabilitar';
import DerivarCurso from '../DerivarCurso';

export const metadata: Metadata = { title: 'Seguimiento del candidato · Municipalidad' };

export default async function SeguimientoCandidato({ params }: { params: Promise<{ id: string }> }) {
  const admin = await adminActual();
  if (!admin) redirect('/panel');
  const { id } = await params;
  const r = await obtenerSeguimiento(id);
  if (!r) notFound();
  const { candidato: c, postulaciones, preentrevistas, cursos, resumen } = r;
  const escribir = puedeEscribir(admin.rol, 'candidatos');
  const catalogo = escribir ? await listarCursos() : [];

  return (
    <main className="contenedor contenedor-medio">
      <Link href="/panel/admin/candidatos" className="volver">
        ‹ Volver a candidatos
      </Link>

      <div className="tarjeta postulante">
        <div className="postulante-cab">
          <Avatar nombre={c.nombre} fotoVersion={c.fotoVersion} tam={64} ruta={`/api/admin/candidatos/${c.id}/foto`} />
          <div className="postulante-nombre">
            <h1 className="titulo">{c.nombre}</h1>
            <p className="meta">Registrado el {fechaLarga(c.creada)} · usuario {c.usuario}</p>
          </div>
          <span className={c.habilitada ? 'badge badge-contratado' : 'badge badge-no_contratado'}>{c.habilitada ? 'Habilitado' : 'Deshabilitado'}</span>
        </div>

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
        {escribir && (
          <div className="separador">
            <BotonHabilitar api={`/api/admin/cuentas/${c.id}`} habilitada={c.habilitada} />
          </div>
        )}
      </div>

      <h2 className="titulo titulo-pasos">Seguimiento</h2>
      <ul className="resumen">
        <li className="dato">
          <div>
            <strong>{resumen.postulaciones}</strong>
            <span>Postulaciones</span>
          </div>
        </li>
        <li className="dato">
          <div>
            <strong>{resumen.derivaciones}</strong>
            <span>Derivaciones a empresas</span>
          </div>
        </li>
        <li className="dato">
          <div>
            <strong>{resumen.contrataciones}</strong>
            <span>Contrataciones</span>
          </div>
        </li>
        <li className={resumen.rechazos > 0 ? 'dato dato-alerta' : 'dato'}>
          <div>
            <strong>{resumen.rechazos}</strong>
            <span>Rechazos</span>
          </div>
        </li>
      </ul>

      <h2 className="titulo titulo-pasos">Postulaciones</h2>
      {postulaciones.length === 0 ? (
        <p className="vacio">Todavía no se postuló a ninguna oferta.</p>
      ) : (
        <ul className="lista">
          {postulaciones.map((p) => (
            <li key={p.id} className="tarjeta">
              <div className="tarjeta-cab">
                <div>
                  <h3>
                    <Link href={`/panel/admin/postulaciones/${p.id}`}>{p.titulo}</Link>
                  </h3>
                  <p className="empresa">{p.empresa}</p>
                </div>
                <span className={`badge badge-${p.estado}`}>{ESTADOS[p.estado]}</span>
              </div>
              <p className="meta">
                Se postuló el {fechaLarga(p.creada)}
                {p.derivada && ` · Derivada el ${fechaLarga(p.derivada)}`}
                {p.resultadoEn && ` · Resultado el ${fechaLarga(p.resultadoEn)}`} · {p.preentrevistas === 1 ? '1 preentrevista' : `${p.preentrevistas} preentrevistas`}
              </p>
              {p.estado === 'no_contratado' && <p className="error">Motivo del rechazo: {p.motivo}</p>}
            </li>
          ))}
        </ul>
      )}

      <h2 className="titulo titulo-pasos">Preentrevistas</h2>
      {preentrevistas.length === 0 ? (
        <p className="vacio">No hay preentrevistas registradas.</p>
      ) : (
        <ul className="lista">
          {preentrevistas.map((x) => (
            <li key={x.id} className="tarjeta">
              <p className="meta">
                {fechaLarga(x.fecha)} · {x.titulo} · Resultado: <strong>{RESULTADOS_PREENTREVISTA[x.resultado as ResultadoPreentrevista] ?? x.resultado}</strong>
              </p>
              <p>{x.observaciones}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="titulo titulo-pasos">Cursos de capacitación</h2>
      {cursos.length === 0 ? (
        <p className="vacio">No fue derivado a ningún curso.</p>
      ) : (
        <ul className="lista">
          {cursos.map((k) => (
            <li key={k.id} className="tarjeta">
              <p>
                <strong>{k.curso}</strong>
              </p>
              <p className="meta">
                Derivado el {fechaLarga(k.fecha)}
                {k.observaciones && ` · ${k.observaciones}`}
              </p>
            </li>
          ))}
        </ul>
      )}
      {escribir && <DerivarCurso cuentaId={c.id} cursos={catalogo} />}
    </main>
  );
}
