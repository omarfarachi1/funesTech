import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminActual } from '../../../../lib/admin';
import { cuentaPropia } from '../../../../lib/cuenta';
import { cuentaFotoActual } from '../../../../lib/postulante';
import { ROLES } from '../../../../lib/roles';
import FotoPerfil from '../../perfil/FotoPerfil';
import PerfilCuentaForm from '../../PerfilCuentaForm';
import CambiarClave from '../../CambiarClave';

export const metadata: Metadata = { title: 'Mi perfil · Municipalidad' };

export default async function PerfilAdmin() {
  const admin = await adminActual();
  const cuenta = await cuentaPropia();
  const foto = await cuentaFotoActual();
  if (!admin || !cuenta || !foto) redirect('/panel');

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Mi perfil</h1>
      <p className="sub">Cambiá tu foto, tus datos de contacto y tu contraseña.</p>

      <section className="bloque" aria-labelledby="t-foto-admin">
        <h2 id="t-foto-admin">Foto de perfil</h2>
        <FotoPerfil nombre={admin.nombre} fotoVersion={foto.fotoVersion} />
      </section>

      <section className="bloque" aria-labelledby="t-datos-admin">
        <h2 id="t-datos-admin">Mis datos</h2>
        <dl className="postulante-datos">
          <div>
            <dt>Rol</dt>
            <dd>{ROLES[admin.rol].nombre}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{admin.usuario}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{admin.dni}</dd>
          </div>
        </dl>
        <p className="meta">El rol, el DNI y el usuario los modifica un superadministrador desde la sección Administradores.</p>
        <PerfilCuentaForm
          inicial={{ nombre: cuenta.nombre, email: cuenta.email, telefono: cuenta.telefono, localidad: cuenta.localidad, presentacion: '' }}
          etiquetaNombre="Nombre y apellido"
          conDescripcion={false}
        />
      </section>

      <section className="bloque" aria-labelledby="t-clave-admin">
        <h2 id="t-clave-admin">Contraseña</h2>
        <CambiarClave />
      </section>
    </main>
  );
}
