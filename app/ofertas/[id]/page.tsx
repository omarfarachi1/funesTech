import type { Metadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obtenerSesion } from '../../../lib/session';
import { estadoDe, obtenerOferta, perfilActual } from '../../../lib/postulante';
import { ESTADOS, fechaLarga } from '../../../lib/formato';
import BotonPostular from '../../panel/BotonPostular';

const cargar = cache(obtenerOferta);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = await cargar(id);
  return { title: o ? `${o.titulo} · Funestrabajo` : 'Oferta · Funestrabajo' };
}

export default async function DetalleOferta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await cargar(id);
  if (!o) notFound();

  const sesion = await obtenerSesion();
  const foto = o.fotoVersion ? `/api/ofertas/${o.id}/foto?v=${encodeURIComponent(o.fotoVersion)}` : null;

  let accion;
  if (sesion?.tipo === 'persona') {
    const perfil = await perfilActual();
    const estado = perfil ? await estadoDe(perfil.id, o.id) : null;
    accion = (
      <div>
        {estado && <p className="meta">Tu postulación: {ESTADOS[estado]}</p>}
        <BotonPostular ofertaId={o.id} yaPostulado={Boolean(estado)} tieneCv={Boolean(perfil?.cvNombre)} />
      </div>
    );
  } else if (!sesion) {
    accion = (
      <div>
        <Link className="btn" href={`/ingresar?oferta=${o.id}`}>
          Postularme
        </Link>
        <p className="meta nota-login">Para postularte vas a ingresar o crear una cuenta.</p>
      </div>
    );
  } else {
    accion = <p className="meta">Para postularte tenés que ingresar con una cuenta de postulante.</p>;
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="topbar-marca">
            <Image src="/logo-funes.png" alt="" width={44} height={44} />
            <span>Funestrabajo</span>
          </Link>
          <div className="topbar-user">
            {sesion ? (
              <Link href="/panel" className="btn-lima">
                Ir a mi panel
              </Link>
            ) : (
              <>
                <Link href="/ingresar" className="salir">
                  Ingresar
                </Link>
                <Link href="/registro" className="btn-lima">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="contenedor contenedor-medio">
        <Link href="/" className="volver">
          ‹ Volver a las ofertas
        </Link>
        <article className="tarjeta detalle">
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="detalle-foto" src={foto} alt="" width={640} height={480} />
          )}
          <h1 className="titulo">{o.titulo}</h1>
          <p className="empresa">
            {o.empresa} · {o.localidad}
          </p>
          <p className="meta">
            <span className="etiqueta">{o.categoria}</span>
            {o.horario && <>{o.horario} · </>}Publicada el {fechaLarga(o.creada)}
          </p>

          <h2>Descripción</h2>
          <p className="detalle-texto">{o.descripcion}</p>

          {o.requisitos.length > 0 && (
            <>
              <h2>Requisitos</h2>
              <ul className="requisitos">
                {o.requisitos.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
          <div className="detalle-accion">{accion}</div>
        </article>
      </main>
    </>
  );
}
