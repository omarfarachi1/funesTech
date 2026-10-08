import type { Metadata } from 'next';
import Link from 'next/link';
import { obtenerSesion } from '../../lib/session';
import { listarOfertas, perfilActual } from '../../lib/postulante';
import { ESTADOS, fechaLarga } from '../../lib/formato';
import { contarCategorias, filtrarOfertas, leerFiltros } from '../../lib/filtro';
import BotonPostular from './BotonPostular';
import FiltroOfertas from './FiltroOfertas';
import Paginacion from './Paginacion';

export const metadata: Metadata = { title: 'Ofertas · Funestrabajo' };

export default async function Ofertas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await obtenerSesion();

  if (sesion?.tipo === 'empresa') {
    return (
      <main className="contenedor contenedor-angosto">
        <h1 className="titulo">Hola, {sesion.nombre}</h1>
        <p className="sub">
          Cuenta de empresa · persona {sesion.personeria === 'juridica' ? 'jurídica' : 'física'}
        </p>
        <p className="vacio">Pronto vas a poder publicar ofertas y ver a los postulantes desde acá.</p>
      </main>
    );
  }

  const perfil = await perfilActual();
  if (!perfil) {
    return (
      <main className="contenedor contenedor-angosto">
        <p className="vacio">No encontramos tu cuenta. Cerrá sesión y volvé a ingresar.</p>
      </main>
    );
  }

  const filtros = leerFiltros(await searchParams);
  const { ofertas, estados } = await listarOfertas(perfil.id);
  const categorias = contarCategorias(ofertas);
  const r = filtrarOfertas(ofertas, filtros);

  return (
    <main className="contenedor">
      <h1 className="titulo">Ofertas laborales</h1>
      <p className="sub">
        {ofertas.length === 1 ? '1 oferta abierta' : `${ofertas.length} ofertas abiertas`} en la ciudad
      </p>

      <FiltroOfertas filtros={filtros} categorias={categorias} />

      {!perfil.cvNombre && (
        <p className="aviso">
          Para postularte primero tenés que cargar tu currículum. <Link href="/panel/perfil">Ir a Mi perfil</Link>
        </p>
      )}

      {r.total > 0 && (
        <p className="resultados">
          Resultados {r.desde}–{r.hasta} de {r.total}
        </p>
      )}

      {ofertas.length === 0 ? (
        <p className="vacio">Por ahora no hay ofertas abiertas. Volvé a revisar pronto.</p>
      ) : r.total === 0 ? (
        <p className="vacio">
          No encontramos ofertas con esos filtros. Probá con otras palabras o{' '}
          <Link href="/panel">restablecé la búsqueda</Link>.
        </p>
      ) : (
        <ul className="lista">
          {r.items.map((o) => {
            const estado = estados[o.id];
            return (
              <li key={o.id} className="tarjeta">
                <div className="tarjeta-cab">
                  <div>
                    <h2>{o.titulo}</h2>
                    <p className="empresa">
                      {o.empresa} · {o.localidad}
                    </p>
                  </div>
                  {estado && <span className={`badge badge-${estado}`}>{ESTADOS[estado]}</span>}
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
                <BotonPostular ofertaId={o.id} yaPostulado={Boolean(estado)} tieneCv={Boolean(perfil.cvNombre)} />
              </li>
            );
          })}
        </ul>
      )}

      <Paginacion filtros={filtros} pagina={r.pagina} paginas={r.paginas} />
    </main>
  );
}
