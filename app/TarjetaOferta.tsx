import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Oferta } from '../lib/postulante';
import { ESTADOS, fechaLarga, type EstadoPostulacion } from '../lib/formato';

// La usan la portada pública, el panel del postulante y el de la empresa; cambia solo la acción.
export default function TarjetaOferta({
  o,
  estado,
  insignia,
  href,
  accion,
}: {
  o: Oferta;
  estado?: EstadoPostulacion;
  insignia?: ReactNode;
  href?: string; // detalle público de la oferta
  accion: ReactNode;
}) {
  const foto = o.fotoVersion ? `/api/ofertas/${o.id}/foto?v=${encodeURIComponent(o.fotoVersion)}` : null;
  return (
    <li className="tarjeta tarjeta-oferta">
      <div className="tarjeta-miniatura">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" loading="lazy" width={640} height={480} />
        ) : (
          <span aria-hidden="true">{o.titulo.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="tarjeta-cuerpo">
        <div className="tarjeta-cab">
          <div>
            <h3>{href ? <Link href={href}>{o.titulo}</Link> : o.titulo}</h3>
            <p className="empresa">
              {o.empresa} · {o.localidad}
            </p>
          </div>
          {insignia ?? (estado && <span className={`badge badge-${estado}`}>{ESTADOS[estado]}</span>)}
        </div>
        <p>{o.descripcion}</p>
        <p className="meta">
          <span className="etiqueta">{o.categoria}</span>
          {o.horario && <>{o.horario} · </>}Publicada el {fechaLarga(o.creada)}
        </p>
        {o.requisitos.length > 0 && (
          <details>
            <summary>Ver requisitos</summary>
            <ul className="requisitos">
              {o.requisitos.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </details>
        )}
        {accion}
      </div>
    </li>
  );
}
