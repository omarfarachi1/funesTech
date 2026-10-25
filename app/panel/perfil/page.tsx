import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { perfilActual } from '../../../lib/postulante';
import { fechaLarga } from '../../../lib/formato';
import CvCard from './CvCard';
import FotoPerfil from './FotoPerfil';
import CambiarClave from '../CambiarClave';
import PerfilForm from './PerfilForm';

export const metadata: Metadata = { title: 'Mi perfil · Funestrabajo' };

export default async function Perfil() {
  const perfil = await perfilActual();
  if (!perfil) redirect('/panel');

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Mi perfil</h1>
      <p className="sub">Mantené tus datos y tu currículum al día. Las empresas a las que te postulás pueden ver tus datos, tu foto y tu CV.</p>
      {!perfil.email && (
        <p className="aviso">Agregá tu correo electrónico para poder recuperar tu contraseña si la olvidás.</p>
      )}

      <section className="bloque" aria-labelledby="t-foto">
        <h2 id="t-foto">Foto de perfil</h2>
        <FotoPerfil nombre={perfil.nombre} fotoVersion={perfil.fotoVersion} />
      </section>

      <section className="bloque" aria-labelledby="t-cv">
        <h2 id="t-cv">Currículum</h2>
        <CvCard
          cvNombre={perfil.cvNombre}
          actualizado={perfil.cvActualizado ? fechaLarga(perfil.cvActualizado) : null}
        />
      </section>

      <section className="bloque" aria-labelledby="t-datos">
        <h2 id="t-datos">Datos personales</h2>
        <PerfilForm
          dni={perfil.dni}
          usuario={perfil.usuario}
          inicial={{
            nombre: perfil.nombre,
            fechaNacimiento: perfil.fechaNacimiento,
            email: perfil.email,
            telefono: perfil.telefono,
            localidad: perfil.localidad,
            presentacion: perfil.presentacion,
            ocupacion: perfil.ocupacion,
            experiencia: perfil.experiencia,
            categorias: perfil.categorias,
          }}
        />
      </section>

      <section className="bloque" aria-labelledby="t-clave">
        <h2 id="t-clave">Contraseña</h2>
        <CambiarClave />
      </section>
    </main>
  );
}
