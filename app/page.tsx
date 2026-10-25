import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { listarOfertasActivas, type Oferta } from '../lib/postulante';
import { contarCategorias, filtrarOfertas, leerFiltros } from '../lib/filtro';
import FiltroOfertas from './panel/FiltroOfertas';
import Paginacion from './panel/Paginacion';
import TarjetaOferta from './TarjetaOferta';

export const metadata: Metadata = {
  title: 'Funestrabajo · Bolsa de empleo de la ciudad de Funes',
  description: 'Mirá las ofertas de trabajo abiertas en Funes y postulate en pocos pasos.',
};

const PASOS = [
  ['Buscá', 'Mirá las ofertas abiertas y filtralas por palabra clave, ubicación o área.'],
  ['Creá tu cuenta', 'Registrate y cargá tu currículum una sola vez.'],
  ['Postulate', 'Elegí la oferta, postulate con un clic y seguí el estado.'],
];

export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = leerFiltros(await searchParams);

  let ofertas: Oferta[] = [];
  let fallo = false;
  try {
    ofertas = await listarOfertasActivas();
  } catch (err) {
    console.error('Error al cargar las ofertas de la portada:', err);
    fallo = true;
  }
  const categorias = contarCategorias(ofertas);
  const r = filtrarOfertas(ofertas, filtros);

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="topbar-marca">
            <Image src="/logo-funes.png" alt="" width={44} height={44} />
            <span>Funestrabajo</span>
          </Link>
          <div className="topbar-user">
            <Link href="/ingresar" className="salir">
              Ingresar
            </Link>
            <Link href="/registro" className="btn-lima">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-in">
          <h1>Encontrá trabajo en Funes</h1>
          <p>La bolsa de empleo del Gobierno de la Ciudad de Funes. Mirá las ofertas abiertas y postulate en pocos pasos.</p>
          <FiltroOfertas filtros={filtros} categorias={categorias} base="/" />
        </div>
      </section>

      <main className="contenedor" id="ofertas">
        <h2 className="titulo">Ofertas abiertas</h2>
        <p className="sub">
          {fallo
            ? 'No pudimos cargar las ofertas en este momento.'
            : ofertas.length === 1
              ? '1 oferta abierta en la ciudad'
              : `${ofertas.length} ofertas abiertas en la ciudad`}
        </p>

        {r.total > 0 && (
          <p className="resultados">
            Resultados {r.desde}–{r.hasta} de {r.total}
          </p>
        )}

        {fallo ? (
          <p className="vacio">Intentá de nuevo en unos minutos.</p>
        ) : ofertas.length === 0 ? (
          <p className="vacio">Por ahora no hay ofertas abiertas. Volvé a revisar pronto.</p>
        ) : r.total === 0 ? (
          <p className="vacio">
            No encontramos ofertas con esos filtros. Probá con otras palabras o <Link href="/">restablecé la búsqueda</Link>.
          </p>
        ) : (
          <ul className="lista">
            {r.items.map((o) => (
              <TarjetaOferta
                key={o.id}
                o={o}
                href={`/ofertas/${o.id}`}
                accion={
                  <div>
                    <Link className="btn" href={`/ingresar?oferta=${o.id}`}>
                      Postularme
                    </Link>
                    <p className="meta nota-login">Para postularte vas a ingresar o crear una cuenta.</p>
                  </div>
                }
              />
            ))}
          </ul>
        )}

        <Paginacion filtros={filtros} pagina={r.pagina} paginas={r.paginas} base="/" />

        <h2 className="titulo titulo-pasos">¿Cómo funciona?</h2>
        <ol className="pasos">
          {PASOS.map(([t, d], i) => (
            <li key={t} className="paso">
              <span className="paso-num">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="pie">Gobierno de la Ciudad de Funes · Desde 1875</footer>
    </>
  );
}
