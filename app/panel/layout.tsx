import Image from 'next/image';
import Link from 'next/link';
import { obtenerSesion } from '../../lib/session';
import { perfilActual } from '../../lib/postulante';
import Avatar from './Avatar';
import BotonSalir from './BotonSalir';
import NavPanel from './NavPanel';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  const esPersona = sesion?.tipo === 'persona';
  const perfil = esPersona ? await perfilActual() : null;
  const nombre = perfil?.nombre ?? sesion?.nombre;

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/panel" className="topbar-marca">
            <Image src="/logo-funes.png" alt="" width={44} height={44} />
            <span>Funestrabajo</span>
          </Link>
          {esPersona && <NavPanel />}
          <div className="topbar-user">
            {perfil && <Avatar nombre={perfil.nombre} fotoVersion={perfil.fotoVersion} tam={36} />}
            <span>{nombre}</span>
            <BotonSalir className="salir" />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
