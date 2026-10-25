'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { RolAdmin } from '../../lib/roles';

export type TipoPanel = 'persona' | 'empresa' | 'admin';

const ENLACES = {
  persona: [
    { href: '/panel', texto: 'Ofertas' },
    { href: '/panel/postulaciones', texto: 'Mis postulaciones' },
    { href: '/panel/perfil', texto: 'Mi perfil' },
  ],
  empresa: [
    { href: '/panel', texto: 'Mis ofertas' },
    { href: '/panel/ofertas/nueva', texto: 'Publicar oferta' },
    { href: '/panel/empresa', texto: 'Mi perfil' },
  ],
  admin: [
    { href: '/panel', texto: 'Resumen' },
    { href: '/panel/admin/ofertas', texto: 'Ofertas' },
    { href: '/panel/admin/postulaciones', texto: 'Postulaciones' },
    { href: '/panel/admin/candidatos', texto: 'Candidatos' },
    { href: '/panel/admin/empresas', texto: 'Empresas' },
    { href: '/panel/admin/cursos', texto: 'Cursos' },
    { href: '/panel/admin/perfil', texto: 'Mi perfil' },
  ],
};

// Enlaces del menú según el tipo de cuenta. Para el superadministrador, "Administradores" va antes de "Mi perfil".
export function enlacesDe(tipo: TipoPanel, rol?: RolAdmin) {
  const base = ENLACES[tipo];
  return tipo === 'admin' && rol === 'superadmin'
    ? [...base.slice(0, -1), { href: '/panel/admin/administradores', texto: 'Administradores' }, base[base.length - 1]]
    : base;
}

export const esActivo = (ruta: string, href: string) => ruta === href || (href !== '/panel' && ruta.startsWith(href));

export default function NavPanel({ tipo, rol }: { tipo: TipoPanel; rol?: RolAdmin }) {
  const ruta = usePathname();
  return (
    <nav className="nav" aria-label="Secciones">
      {enlacesDe(tipo, rol).map((e) => (
        <Link key={e.href} href={e.href} className="nav-enlace" aria-current={esActivo(ruta, e.href) ? 'page' : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
