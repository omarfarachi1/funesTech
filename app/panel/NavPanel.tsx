'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ENLACES = [
  { href: '/panel', texto: 'Ofertas' },
  { href: '/panel/postulaciones', texto: 'Mis postulaciones' },
  { href: '/panel/perfil', texto: 'Mi perfil' },
];

export default function NavPanel() {
  const ruta = usePathname();
  return (
    <nav className="nav" aria-label="Secciones">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} className="nav-enlace" aria-current={ruta === e.href ? 'page' : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
