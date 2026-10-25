import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual, listarPostulacionesAdmin } from '../../../../lib/admin';
import { CATEGORIAS } from '../../../../lib/oferta';
import { ESTADOS, fechaLarga } from '../../../../lib/formato';
import Paginas from '../Paginas';

export const metadata: Metadata = { title: 'Postulaciones · Municipalidad' };

const POR_PAGINA = 12;
const TABS = [
  ['recibida', 'Nuevas'],
  ['preentrevistada', 'Preentrevistadas'],
  ['derivada', 'Derivadas'],
  ['contratado', 'Contratados'],
  ['no_contratado', 'No contratados'],
  ['descartada', 'Descartadas'],
  ['todas', 'Todas'],
] as const;

const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function Postulaciones({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await adminActual();
  if (!admin) redirect('/panel');

  const sp = await searchParams;
  const uno = (k: string) => {
    const v = sp[k];
    return ((Array.isArray(v) ? v[0] : v) ?? '').trim();
  };
  const pedido = uno('estado');
  const estado = TABS.some(([k]) => k === pedido) ? pedido : 'recibida';
  const q = uno('q').slice(0, 80);
  const pedida = uno('categoria');
  const categoria = (CATEGORIAS as readonly string[]).includes(pedida) ? pedida : '';
  const pagina = Math.max(1, parseInt(uno('pagina'), 10) || 1);

  const todas = await listarPostulacionesAdmin();
  const filtradas = todas.filter(
    (p) =>
      (!categoria || p.categorias.includes(categoria)) &&
      (!q || norm(`${p.candidato} ${p.oferta} ${p.empresa}`).includes(norm(q)))
  );
  const cuenta = (k: string) => (k === 'todas' ? filtradas.length : filtradas.filter((p) => p.estado === k).length);
  const lista = estado === 'todas' ? filtradas : filtradas.filter((p) => p.estado === estado);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const items = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const href = (k: string) =>
    `/panel/admin/postulaciones?estado=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}${categoria ? `&categoria=${encodeURIComponent(categoria)}` : ''}`;

  return (
    <main className="contenedor">
      <h1 className="titulo">Postulaciones</h1>
      <p className="sub">Revisá las postulaciones, registrá preentrevistas (opcional) y derivá los candidatos a cada empresa.</p>

      <nav className="pestanas" aria-label="Filtrar por estado">
        {TABS.map(([k, texto]) => (
          <Link key={k} href={href(k)} className="pestana" aria-current={estado === k ? 'page' : undefined}>
            {texto} ({cuenta(k)})
          </Link>
        ))}
      </nav>

      <form action="/panel/admin/postulaciones" method="get" className="buscador-simple" role="search">
        <input type="hidden" name="estado" value={estado} />
        <label htmlFor="q" className="sr-only">
          Buscar por candidato, oferta o empresa
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por candidato, oferta o empresa" />
        <label htmlFor="categoria" className="sr-only">
          Categoría laboral del candidato
        </label>
        <select id="categoria" name="categoria" defaultValue={categoria} className="estado-select">
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          Buscar
        </button>
        {(q || categoria) && (
          <Link href={`/panel/admin/postulaciones?estado=${estado}`} className="restablecer">
            Restablecer
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <p className="vacio">No hay postulaciones en esta lista.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Oferta</th>
                <th>Categorías</th>
                <th>Postulación</th>
                <th>Preentrevistas</th>
                <th>Estado</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/panel/admin/candidatos/${p.candidatoId}`}>
                      <strong>{p.candidato}</strong>
                    </Link>
                  </td>
                  <td>
                    {p.oferta}
                    <br />
                    <span className="meta">{p.empresa}</span>
                  </td>
                  <td>{p.categorias.length ? p.categorias.join(', ') : '—'}</td>
                  <td>{fechaLarga(p.creada)}</td>
                  <td>{p.preentrevistas}</td>
                  <td>
                    <span className={`badge badge-${p.estado}`}>{ESTADOS[p.estado]}</span>
                  </td>
                  <td>
                    <Link className="btn btn-sec" href={`/panel/admin/postulaciones/${p.id}`}>
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginas base="/panel/admin/postulaciones" params={{ estado, q, categoria }} pagina={actual} paginas={paginas} />
    </main>
  );
}
