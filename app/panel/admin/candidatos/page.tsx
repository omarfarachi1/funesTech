import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual, listarCandidatos, POR_PAGINA_ADMIN } from '../../../../lib/admin';
import { fechaLarga } from '../../../../lib/formato';
import { CATEGORIAS } from '../../../../lib/oferta';
import Paginas from '../Paginas';

export const metadata: Metadata = { title: 'Candidatos · Administración' };

export default async function Candidatos({
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
  const q = uno('q').slice(0, 60);
  const pedida = uno('categoria');
  const categoria = (CATEGORIAS as readonly string[]).includes(pedida) ? pedida : '';
  const pagina = Math.max(1, parseInt(uno('pagina'), 10) || 1);

  const { items, total } = await listarCandidatos(q, pagina, categoria);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA_ADMIN));
  const desde = total ? (pagina - 1) * POR_PAGINA_ADMIN + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA_ADMIN, total);

  return (
    <main className="contenedor">
      <h1 className="titulo">Candidatos</h1>
      <p className="sub">{total === 1 ? '1 candidato registrado' : `${total} candidatos registrados`}</p>

      <form action="/panel/admin/candidatos" method="get" className="buscador-simple" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar por nombre, DNI, usuario o correo
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre, DNI, usuario o correo" />
        <label htmlFor="categoria" className="sr-only">
          Categoría laboral
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
          <Link href="/panel/admin/candidatos" className="restablecer">
            Restablecer
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <p className="vacio">No encontramos candidatos con esa búsqueda.</p>
      ) : (
        <>
          <p className="resultados">
            Resultados {desde}–{hasta} de {total}
          </p>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Contacto</th>
                  <th>Localidad</th>
                  <th>Categorías</th>
                  <th>CV</th>
                  <th>Postulaciones</th>
                  <th>Alta</th>
                  <th>Estado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.nombre}</strong>
                      <br />
                      <span className="meta">
                        DNI {c.dni} · {c.usuario}
                      </span>
                    </td>
                    <td>
                      {c.email || '—'}
                      <br />
                      <span className="meta">{c.telefono || '—'}</span>
                    </td>
                    <td>{c.localidad || '—'}</td>
                    <td>{c.categorias.length ? c.categorias.join(', ') : '—'}</td>
                    <td>{c.tieneCv ? 'Sí' : 'No'}</td>
                    <td>{c.postulaciones}</td>
                    <td>{fechaLarga(c.creada)}</td>
                    <td>
                      <span className={c.habilitada ? 'badge badge-preseleccionada' : 'badge badge-no_seleccionada'}>
                        {c.habilitada ? 'Habilitado' : 'Deshabilitado'}
                      </span>
                    </td>
                    <td>
                      <Link className="btn btn-sec" href={`/panel/admin/candidatos/${c.id}`}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Paginas base="/panel/admin/candidatos" params={{ q, categoria }} pagina={pagina} paginas={paginas} />
    </main>
  );
}
