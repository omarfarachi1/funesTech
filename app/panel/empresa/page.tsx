import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cuentaPropia } from '../../../lib/cuenta';
import { empresaActual } from '../../../lib/empresa';
import { cuentaFotoActual } from '../../../lib/postulante';
import { listarDocumentos } from '../../../lib/verificacion';
import { fechaLarga } from '../../../lib/formato';
import FotoPerfil from '../perfil/FotoPerfil';
import PerfilCuentaForm from '../PerfilCuentaForm';
import CambiarClave from '../CambiarClave';
import DocumentacionEmpresa from '../DocumentacionEmpresa';

export const metadata: Metadata = { title: 'Mi perfil · Funestrabajo' };

export default async function PerfilEmpresa() {
  const cuenta = await cuentaPropia();
  const empresa = await empresaActual();
  const foto = await cuentaFotoActual();
  if (!cuenta || cuenta.tipo !== 'empresa' || !empresa || !foto) redirect('/panel');
  const juridica = cuenta.personeria === 'juridica';
  const documentos = juridica ? await listarDocumentos(cuenta.id) : [];

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Mi perfil</h1>
      <p className="sub">Cambiá la foto, los datos de contacto y la contraseña de tu empresa.</p>

      <section className="bloque" aria-labelledby="t-foto-empresa">
        <h2 id="t-foto-empresa">Foto de perfil</h2>
        <FotoPerfil nombre={cuenta.nombre} fotoVersion={foto.fotoVersion} />
      </section>

      <section className="bloque" aria-labelledby="t-datos-empresa">
        <h2 id="t-datos-empresa">Datos de la empresa</h2>
        <dl className="postulante-datos">
          <div>
            <dt>Tipo de persona</dt>
            <dd>{juridica ? 'Persona jurídica' : 'Persona física'}</dd>
          </div>
          <div>
            <dt>{juridica ? 'CUIT' : 'DNI'}</dt>
            <dd>{cuenta.dni}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{cuenta.usuario}</dd>
          </div>
        </dl>
        <p className="meta">El CUIT o DNI y el usuario no se pueden modificar desde acá.</p>
        <PerfilCuentaForm
          inicial={{ nombre: cuenta.nombre, email: cuenta.email, telefono: cuenta.telefono, localidad: cuenta.localidad, presentacion: cuenta.presentacion }}
          etiquetaNombre={juridica ? 'Razón social' : 'Nombre'}
          conDescripcion
        />
      </section>

      {juridica && (
        <section className="bloque" id="documentacion" aria-labelledby="t-doc-empresa">
          <h2 id="t-doc-empresa">Documentación de la empresa</h2>
          <DocumentacionEmpresa
            estado={empresa.verificacion}
            nota={empresa.verificacionNota}
            documentos={documentos.map((d) => ({ id: d.id, tipo: d.tipo, nombre: d.nombre, subido: fechaLarga(d.subido) }))}
          />
        </section>
      )}

      <section className="bloque" aria-labelledby="t-clave-empresa">
        <h2 id="t-clave-empresa">Contraseña</h2>
        <CambiarClave />
      </section>
    </main>
  );
}
