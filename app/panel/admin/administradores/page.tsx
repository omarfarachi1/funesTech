import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual, listarAdmins } from '../../../../lib/admin';
import { ROLES, puede } from '../../../../lib/roles';
import BotonHabilitar from '../BotonHabilitar';

export const metadata: Metadata = { title: 'Administradores · Administración' };

export default async function Administradores() {
  const yo = await adminActual();
  if (!yo || !puede(yo.rol, 'administradores')) redirect('/panel');
  const admins = await listarAdmins();

  return (
    <main className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1 className="titulo">Administradores</h1>
          <p className="sub">Altas, bajas y roles de quienes administran el sistema.</p>
        </div>
        <Link className="btn" href="/panel/admin/administradores/nuevo">
          Nuevo administrador
        </Link>
      </div>

      <section className="bloque" aria-labelledby="t-roles">
        <h2 id="t-roles">Roles</h2>
        <dl className="roles-leyenda">
          {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((k) => (
            <div key={k}>
              <dt>{ROLES[k].nombre}</dt>
              <dd>{ROLES[k].descripcion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>Administrador</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.nombre}</strong>
                  {a.id === yo.id && <span className="meta"> (vos)</span>}
                  <br />
                  <span className="meta">
                    {a.usuario} · DNI {a.dni}
                  </span>
                </td>
                <td>{a.email || '—'}</td>
                <td>{ROLES[a.rol].nombre}</td>
                <td>
                  <span className={a.habilitada ? 'badge badge-preseleccionada' : 'badge badge-no_seleccionada'}>
                    {a.habilitada ? 'Activo' : 'De baja'}
                  </span>
                </td>
                <td>
                  <div className="acciones acciones-oferta">
                    <Link className="btn btn-sec" href={`/panel/admin/administradores/${a.id}/editar`}>
                      Editar
                    </Link>
                    {a.id !== yo.id && <BotonHabilitar api={`/api/admin/administradores/${a.id}`} habilitada={a.habilitada} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
