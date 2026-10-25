import Link from 'next/link';
import { adminActual, indicadores } from '../../lib/admin';
import { ROLES } from '../../lib/roles';

type Dato = { n: number; texto: string; href?: string; alerta?: boolean };

function Tarjetas({ datos }: { datos: Dato[] }) {
  return (
    <ul className="resumen">
      {datos.map((d) => (
        <li key={d.texto} className={d.alerta ? 'dato dato-alerta' : 'dato'}>
          {d.href ? (
            <Link href={d.href}>
              <strong>{d.n}</strong>
              <span>{d.texto}</span>
            </Link>
          ) : (
            <div>
              <strong>{d.n}</strong>
              <span>{d.texto}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function PanelAdmin() {
  const admin = await adminActual();
  if (!admin) {
    return (
      <main className="contenedor contenedor-angosto">
        <p className="vacio">Tu cuenta de la Municipalidad no está habilitada. Cerrá sesión y volvé a ingresar.</p>
      </main>
    );
  }
  const r = await indicadores();

  const atender: Dato[] = [
    { n: r.sinRevisar, texto: 'Postulaciones nuevas para revisar', href: '/panel/admin/postulaciones?estado=recibida', alerta: r.sinRevisar > 0 },
    { n: r.pendientes, texto: 'Ofertas de empresas pendientes de revisión', href: '/panel/admin/ofertas?estado=pendiente', alerta: r.pendientes > 0 },
    { n: r.empresasEnRevision, texto: 'Empresas jurídicas con documentación para revisar', href: '/panel/admin/empresas?estado=en_revision', alerta: r.empresasEnRevision > 0 },
  ];
  const indic: Dato[] = [
    { n: r.postulantes, texto: 'Postulantes registrados', href: '/panel/admin/candidatos' },
    { n: r.empresas, texto: 'Empresas registradas' },
    { n: r.ofertasActivas, texto: 'Ofertas activas', href: '/panel/admin/ofertas?estado=aprobada' },
    { n: r.postulaciones, texto: 'Postulaciones', href: '/panel/admin/postulaciones?estado=todas' },
    { n: r.derivaciones, texto: 'Derivaciones a empresas', href: '/panel/admin/postulaciones?estado=derivada' },
    { n: r.contrataciones, texto: 'Contrataciones', href: '/panel/admin/postulaciones?estado=contratado' },
    { n: r.rechazos, texto: 'Rechazos de empresas', href: '/panel/admin/postulaciones?estado=no_contratado' },
    { n: r.derivacionesCurso, texto: 'Derivaciones a cursos', href: '/panel/admin/cursos' },
  ];
  if (admin.rol === 'superadmin') {
    indic.push({ n: r.admins, texto: 'Administradores activos', href: '/panel/admin/administradores' });
  }

  return (
    <main className="contenedor">
      <h1 className="titulo">Panel de la Municipalidad</h1>
      <p className="sub">
        {admin.nombre} · Rol: {ROLES[admin.rol].nombre}
      </p>

      <h2 className="titulo titulo-seccion">Para atender</h2>
      <Tarjetas datos={atender} />

      <h2 className="titulo titulo-seccion">Indicadores del portal</h2>
      <Tarjetas datos={indic} />
    </main>
  );
}
