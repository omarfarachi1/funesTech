import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual, listarOfertasAdmin, type OfertaAdmin } from '../../../../lib/admin';
import { puedeEscribir } from '../../../../lib/roles';
import TarjetaOferta from '../../../TarjetaOferta';
import AccionesAdminOferta from '../AccionesAdminOferta';
import Paginas from '../Paginas';

export const metadata: Metadata = { title: 'Ofertas · Administración' };

const POR_PAGINA = 10;
const FILTROS = [
  ['pendiente', 'Pendientes'],
  ['aprobada', 'Aprobadas'],
  ['rechazada', 'Rechazadas'],
  ['todas', 'Todas'],
] as const;

const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const insignia = (o: OfertaAdmin): [string, string] =>
  o.estadoRevision === 'pendiente'
    ? ['Pendiente de revisión', 'badge badge-en_revision']
    : o.estadoRevision === 'rechazada'
      ? ['Rechazada', 'badge badge-no_seleccionada']
      : o.activa
        ? ['Publicada', 'badge badge-preseleccionada']
        : ['Cerrada', 'badge'];

export default async function OfertasAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await adminActual();
  if (!admin) redirect('/panel');
  const escribir = puedeEscribir(admin.rol, 'ofertas');

  const sp = await searchParams;
  const uno = (k: string) => {
    const v = sp[k];
    return ((Array.isArray(v) ? v[0] : v) ?? '').trim();
  };
  const pedido = uno('estado');
  const estado = FILTROS.some(([k]) => k === pedido) ? pedido : 'pendiente';
  const q = uno('q').slice(0, 80);
  const pagina = Math.max(1, parseInt(uno('pagina'), 10) || 1);

  const todas = await listarOfertasAdmin();
  const buscadas = q ? todas.filter((o) => norm(`${o.titulo} ${o.empresa} ${o.categoria}`).includes(norm(q))) : todas;
  const cuenta = (k: string) => (k === 'todas' ? buscadas.length : buscadas.filter((o) => o.estadoRevision === k).length);
  const lista = estado === 'todas' ? buscadas : buscadas.filter((o) => o.estadoRevision === estado);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const items = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const href = (k: string) => `/panel/admin/ofertas?estado=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <main className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1 className="titulo">Ofertas</h1>
          <p className="sub">Las ofertas las envían las empresas: revisalas, aprobalas para publicarlas y administrá las publicadas.</p>
        </div>
      </div>

      <nav className="pestanas" aria-label="Filtrar por estado">
        {FILTROS.map(([k, texto]) => (
          <Link key={k} href={href(k)} className="pestana" aria-current={estado === k ? 'page' : undefined}>
            {texto} ({cuenta(k)})
          </Link>
        ))}
      </nav>

      <form action="/panel/admin/ofertas" method="get" className="buscador-simple" role="search">
        <input type="hidden" name="estado" value={estado} />
        <label htmlFor="q" className="sr-only">
          Buscar por título, empresa o área
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por título, empresa o área" />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="vacio">No hay ofertas en esta lista.</p>
      ) : (
        <ul className="lista">
          {items.map((o) => {
            const [texto, clase] = insignia(o);
            return (
              <TarjetaOferta
                key={o.id}
                o={o}
                insignia={<span className={clase}>{texto}</span>}
                accion={
                  <div>
                    <p className="meta">
                      {o.deEmpresa ? 'Enviada por la empresa' : 'Sin empresa registrada'} ·{' '}
                      {o.postulantes === 1 ? '1 postulación' : `${o.postulantes} postulaciones`}
                    </p>
                    {o.estadoRevision === 'rechazada' && o.motivoRechazo && (
                      <p className="error">Motivo del rechazo: {o.motivoRechazo}</p>
                    )}
                    <AccionesAdminOferta id={o.id} estadoRevision={o.estadoRevision} activa={o.activa} escribir={escribir} />
                  </div>
                }
              />
            );
          })}
        </ul>
      )}

      <Paginas base="/panel/admin/ofertas" params={{ estado, q }} pagina={actual} paginas={paginas} />
    </main>
  );
}
