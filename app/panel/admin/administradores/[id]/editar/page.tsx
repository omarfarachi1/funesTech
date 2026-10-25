import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { adminActual, obtenerAdmin } from '../../../../../../lib/admin';
import { puede } from '../../../../../../lib/roles';
import AdminForm from '../../AdminForm';

export const metadata: Metadata = { title: 'Editar administrador · Administración' };

export default async function EditarAdmin({ params }: { params: Promise<{ id: string }> }) {
  const yo = await adminActual();
  if (!yo || !puede(yo.rol, 'administradores')) redirect('/panel');
  const { id } = await params;
  const a = await obtenerAdmin(id);
  if (!a) notFound();
  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Editar administrador</h1>
      <p className="sub">{a.nombre}</p>
      <AdminForm
        modo="editar"
        id={a.id}
        rolBloqueado={a.id === yo.id}
        inicial={{ nombre: a.nombre, dni: a.dni, fechaNacimiento: '', email: a.email, usuario: a.usuario, password: '', rol: a.rol }}
      />
    </main>
  );
}
