import { obtenerSesion } from '../../lib/session';
import { cuentaFotoActual } from '../../lib/postulante';
import { adminActual } from '../../lib/admin';
import Cabecera from './Cabecera';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  const cuenta = sesion ? await cuentaFotoActual() : null;
  const admin = sesion?.tipo === 'admin' ? await adminActual() : null;
  const nombre = cuenta?.nombre ?? sesion?.nombre ?? '';

  return (
    <>
      <Cabecera tipo={sesion?.tipo} rol={admin?.rol} nombre={nombre} fotoVersion={cuenta?.fotoVersion ?? null} />
      {children}
    </>
  );
}
