'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from './Avatar';
import BotonSalir from './BotonSalir';
import NavPanel, { enlacesDe, esActivo, type TipoPanel } from './NavPanel';
import type { RolAdmin } from '../../lib/roles';

// Encabezado del panel. Arriba de todo se ve completo; al bajar, aparece una barra compacta fija
// con un menú desplegable. En pantallas angostas se usa siempre la barra compacta.
export default function Cabecera({
  tipo,
  rol,
  nombre,
  fotoVersion,
}: {
  tipo?: TipoPanel;
  rol?: RolAdmin;
  nombre: string;
  fotoVersion: string | null;
}) {
  const ruta = usePathname();
  const completa = useRef<HTMLElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const [bajada, setBajada] = useState(false);
  const [estrecha, setEstrecha] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const visible = bajada || estrecha;
  const menuAbierto = abierto && visible;
  const perfilHref = tipo === 'empresa' ? '/panel/empresa' : tipo === 'admin' ? '/panel/admin/perfil' : '/panel/perfil';
  const enlaces = tipo ? enlacesDe(tipo, rol) : [];

  // La barra compacta aparece cuando el encabezado completo ya salió de la pantalla
  useEffect(() => {
    const alScroll = () => {
      const pasada = window.scrollY > (completa.current?.offsetHeight ?? 100);
      setBajada(pasada);
      if (!pasada) setAbierto(false);
    };
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const alCambiar = () => setEstrecha(mq.matches);
    alCambiar();
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  // El menú se cierra con Escape o al hacer clic afuera
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const alClic = (e: MouseEvent) => {
      if (barra.current && !barra.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclado);
    document.addEventListener('mousedown', alClic);
    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.removeEventListener('mousedown', alClic);
    };
  }, [menuAbierto]);

  return (
    <>
      <header className="topbar topbar-completa" ref={completa}>
        <div className="topbar-in">
          <Link href="/panel" className="topbar-marca">
            <Image src="/logo-funes.png" alt="" width={44} height={44} />
            <span>Funestrabajo</span>
          </Link>
          {tipo && <NavPanel tipo={tipo} rol={rol} />}
          <div className="topbar-user">
            <Link href={perfilHref} className="topbar-perfil" title="Ir a mi perfil" aria-label={`Ir a mi perfil (${nombre})`}>
              <Avatar nombre={nombre || '?'} fotoVersion={fotoVersion} tam={36} />
              <span>{nombre}</span>
            </Link>
            <BotonSalir className="salir" />
          </div>
        </div>
      </header>

      <div className="compacta-ancla">
        <div className={visible ? 'compacta compacta-visible' : 'compacta'} ref={barra}>
          <div className="compacta-in">
            <Link href="/panel" className="topbar-marca">
              <Image src="/logo-funes.png" alt="" width={32} height={32} />
              <span>Funestrabajo</span>
            </Link>
            <div className="compacta-der">
              <Link href={perfilHref} className="topbar-perfil" title="Ir a mi perfil" aria-label={`Ir a mi perfil (${nombre})`}>
                <Avatar nombre={nombre || '?'} fotoVersion={fotoVersion} tam={32} />
                <span className="compacta-nombre">{nombre}</span>
              </Link>
              {tipo && (
                <button type="button" className="menu-boton" aria-expanded={menuAbierto} aria-controls="menu-desplegable" onClick={() => setAbierto((v) => !v)}>
                  <span className="menu-icono" aria-hidden="true" />
                  Menú
                </button>
              )}
            </div>
          </div>
          {menuAbierto && (
            <nav id="menu-desplegable" className="menu-lista" aria-label="Secciones">
              {enlaces.map((e) => (
                <Link key={e.href} href={e.href} className="menu-enlace" aria-current={esActivo(ruta, e.href) ? 'page' : undefined} onClick={() => setAbierto(false)}>
                  {e.texto}
                </Link>
              ))}
              <BotonSalir className="menu-salir" />
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
