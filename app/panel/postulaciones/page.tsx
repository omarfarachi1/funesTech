import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listarPostulaciones, perfilActual } from '../../../lib/postulante';
import { ESTADOS, fechaLarga } from '../../../lib/formato';

export const metadata: Metadata = { title: 'Mis postulaciones · Funestrabajo' };

export default async function MisPostulaciones() {
  const perfil = await perfilActual();
  if (!perfil) redirect('/panel');
  const lista = await listarPostulaciones(perfil.id);

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Mis postulaciones</h1>
      <p className="sub">
        {lista.length === 1 ? '1 postulación enviada' : `${lista.length} postulaciones enviadas`}
      </p>

      {lista.length === 0 ? (
        <p className="vacio">
          Todavía no te postulaste a ninguna oferta. <Link href="/panel">Ver ofertas</Link>
        </p>
      ) : (
        <ul className="lista">
          {lista.map((p) => (
            <li key={p.id} className="tarjeta">
              <div className="tarjeta-cab">
                <div>
                  <h2>{p.titulo}</h2>
                  <p className="empresa">
                    {p.empresa}
                    {p.localidad && ` · ${p.localidad}`}
                  </p>
                </div>
                <span className={`badge badge-${p.estado}`}>{ESTADOS[p.estado]}</span>
              </div>
              <p className="meta">Te postulaste el {fechaLarga(p.creada)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
