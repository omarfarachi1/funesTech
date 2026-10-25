import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PanelMarca from '../PanelMarca';
import ConfigurarForm from './ConfigurarForm';
import { contarAdmins } from '../../lib/admin';

export const metadata: Metadata = { title: 'Configuración inicial · Funestrabajo' };

// Pantalla de un solo uso: crea el primer superadministrador. Cuando ya hay administradores, deja de estar disponible.
export default async function Configurar() {
  if ((await contarAdmins()) > 0) redirect('/ingresar');
  const faltaCodigo = (process.env.CODIGO_INSTALACION ?? '').length < 8;

  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        {faltaCodigo ? (
          <div className="formulario">
            <h2>Falta un paso</h2>
            <p className="ayuda">
              Para crear el primer administrador hay que definir la variable <strong>CODIGO_INSTALACION</strong> (de 8
              caracteres o más) en el archivo <strong>.env</strong> y en Vercel. Después reiniciá el servidor y recargá esta página.
            </p>
          </div>
        ) : (
          <ConfigurarForm />
        )}
      </section>
    </main>
  );
}
