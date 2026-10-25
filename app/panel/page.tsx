import type { Metadata } from 'next';
import Link from 'next/link';
import { obtenerSesion } from '../../lib/session';
import { listarOfertas, obtenerOferta, perfilActual } from '../../lib/postulante';
import { contarCategorias, filtrarOfertas, leerFiltros } from '../../lib/filtro';
import BotonPostular from './BotonPostular';
import FiltroOfertas from './FiltroOfertas';
import Paginacion from './Paginacion';
import TarjetaOferta from '../TarjetaOferta';
import PanelEmpresa from './PanelEmpresa';
import PanelAdmin from './PanelAdmin';

export const metadata: Metadata = { title: 'Ofertas · Funestrabajo' };

export default async function Ofertas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await obtenerSesion();

  if (sesion?.tipo === 'admin') return <PanelAdmin />;
  if (sesion?.tipo === 'empresa') return <PanelEmpresa />;

  const perfil = await perfilActual();
  if (!perfil) {
    return (
      <main className="contenedor contenedor-angosto">
        <p className="vacio">No encontramos tu cuenta. Cerrá sesión y volvé a ingresar.</p>
      </main>
    );
  }

  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const idElegida = typeof sp.oferta === 'string' ? sp.oferta : '';
  const [{ ofertas, estados }, elegida] = await Promise.all([
    listarOfertas(perfil.id),
    idElegida ? obtenerOferta(idElegida) : Promise.resolve(null),
  ]);
  const categorias = contarCategorias(ofertas);
  const r = filtrarOfertas(ofertas, filtros);
  const tieneCv = Boolean(perfil.cvNombre);

  return (
    <main className="contenedor">
      <h1 className="titulo">Ofertas laborales</h1>
      <p className="sub">
        {ofertas.length === 1 ? '1 oferta abierta' : `${ofertas.length} ofertas abiertas`} en la ciudad
      </p>

      {elegida && (
        <section className="destacada" aria-labelledby="t-elegida">
          <h2 id="t-elegida" className="destacada-titulo">
            La oferta que elegiste
          </h2>
          <ul className="lista">
            <TarjetaOferta
              o={elegida}
              href={`/ofertas/${elegida.id}`}
              estado={estados[elegida.id]}
              accion={<BotonPostular ofertaId={elegida.id} yaPostulado={Boolean(estados[elegida.id])} tieneCv={tieneCv} />}
            />
          </ul>
        </section>
      )}

      <FiltroOfertas filtros={filtros} categorias={categorias} />

      {!tieneCv && (
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
          {r.items.map((o) => (
            <TarjetaOferta
              key={o.id}
              o={o}
              href={`/ofertas/${o.id}`}
              estado={estados[o.id]}
              accion={<BotonPostular ofertaId={o.id} yaPostulado={Boolean(estados[o.id])} tieneCv={tieneCv} />}
            />
          ))}
        </ul>
      )}

      <Paginacion filtros={filtros} pagina={r.pagina} paginas={r.paginas} />
    </main>
  );
}
