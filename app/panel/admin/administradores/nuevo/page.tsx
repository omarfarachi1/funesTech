import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminActual } from '../../../../../lib/admin';
import { puede } from '../../../../../lib/roles';
import AdminForm from '../AdminForm';

export const metadata: Metadata = { title: 'Nuevo administrador · Administración' };

export default async function NuevoAdmin() {
  const yo = await adminActual();
  if (!yo || !puede(yo.rol, 'administradores')) redirect('/panel');
  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Nuevo administrador</h1>
      <p className="sub">La persona ingresa con el usuario y la contraseña que definas acá, y puede cambiarla desde “¿Olvidaste tu contraseña?”.</p>
      <AdminForm
        modo="crear"
        inicial={{ nombre: '', dni: '', fechaNacimiento: '', email: '', usuario: '', password: '', rol: '' }}
      />
    </main>
  );
}
