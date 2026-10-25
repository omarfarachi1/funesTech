import type { Metadata } from 'next';
import PanelMarca from '../PanelMarca';
import LoginForm from '../login/LoginForm';
import { esUuid } from '../../lib/validar';

export const metadata: Metadata = { title: 'Ingresar · Funestrabajo' };

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ oferta?: string | string[] }>;
}) {
  const { oferta } = await searchParams;
  const id = typeof oferta === 'string' && esUuid(oferta) ? oferta : undefined;
  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        <LoginForm oferta={id} />
      </section>
    </main>
  );
}
