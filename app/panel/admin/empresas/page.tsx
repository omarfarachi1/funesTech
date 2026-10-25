import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual } from '../../../../lib/admin';
import { listarEmpresasJuridicas } from '../../../../lib/verificacion';
import { VERIFICACION, claseVerificacion, type EstadoVerificacion } from '../../../../lib/documentos';
import { fechaLarga } from '../../../../lib/formato';
import Paginas from '../Paginas';

export const metadata: Metadata = { title: 'Empresas · Municipalidad' };

const POR_PAGINA = 15;
const TABS = [
  ['en_revision', 'En revisión'],
  ['observada', 'Con observaciones'],
  ['verificada', 'Verificadas'],
  ['sin_enviar', 'Sin documentación'],
  ['todas', 'Todas'],
] as const;
const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function Empresas({
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
  const estado = TABS.some(([k]) => k === pedido) ? pedido : 'en_revision';
  const q = uno('q').slice(0, 80);
  const pagina = Math.max(1, parseInt(uno('pagina'), 10) || 1);

  const todas = await listarEmpresasJuridicas();
  const buscadas = q ? todas.filter((e) => norm(`${e.nombre} ${e.dni} ${e.email}`).includes(norm(q))) : todas;
  const cuenta = (k: string) => (k === 'todas' ? buscadas.length : buscadas.filter((e) => e.verificacion === k).length);
  const lista = estado === 'todas' ? buscadas : buscadas.filter((e) => e.verificacion === estado);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const items = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const href = (k: string) => `/panel/admin/empresas?estado=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <main className="contenedor">
      <h1 className="titulo">Empresas jurídicas</h1>
      <p className="sub">Revisá la documentación que suben las empresas que son personas jurídicas. La verificación es opcional para ellas y no bloquea el sistema.</p>

      <nav className="pestanas" aria-label="Filtrar por estado">
        {TABS.map(([k, texto]) => (
          <Link key={k} href={href(k)} className="pestana" aria-current={estado === k ? 'page' : undefined}>
            {texto} ({cuenta(k)})
          </Link>
        ))}
      </nav>

      <form action="/panel/admin/empresas" method="get" className="buscador-simple" role="search">
        <input type="hidden" name="estado" value={estado} />
        <label htmlFor="q" className="sr-only">
          Buscar por razón social, CUIT o correo
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por razón social, CUIT o correo" />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="vacio">No hay empresas en esta lista.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Razón social</th>
                <th>CUIT</th>
                <th>Contacto</th>
                <th>Documentos</th>
                <th>Alta</th>
                <th>Verificación</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.nombre}</strong>
                    <br />
                    <span className="meta">{e.usuario}</span>
                  </td>
                  <td>{e.dni}</td>
                  <td>
                    {e.email || '—'}
                    <br />
                    <span className="meta">{e.telefono || '—'}</span>
                  </td>
                  <td>{e.documentos}</td>
                  <td>{fechaLarga(e.creada)}</td>
                  <td>
                    <span className={claseVerificacion(e.verificacion as EstadoVerificacion)}>{VERIFICACION[e.verificacion]}</span>
                  </td>
                  <td>
                    <Link className="btn btn-sec" href={`/panel/admin/empresas/${e.id}`}>
                      Evaluar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginas base="/panel/admin/empresas" params={{ estado, q }} pagina={actual} paginas={paginas} />
    </main>
  );
}
