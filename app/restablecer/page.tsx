import type { Metadata } from 'next';
import Link from 'next/link';
import PanelMarca from '../PanelMarca';
import RestablecerForm from './RestablecerForm';
import { tokenValido } from '../../lib/recuperar';

// "no-referrer" evita que el enlace con la clave se filtre a otros sitios
export const metadata: Metadata = { title: 'Nueva contraseña · Funestrabajo', referrer: 'no-referrer' };

export default async function Restablecer({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const t = typeof token === 'string' ? token : '';
  const valido = await tokenValido(t);

  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        {valido ? (
          <RestablecerForm token={t} />
        ) : (
          <div className="formulario">
            <h2>Enlace no válido</h2>
            <p className="ayuda">El enlace venció o ya se usó. Pedí uno nuevo para continuar.</p>
            <p className="alterna">
              <Link href="/recuperar">Pedir un enlace nuevo</Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
