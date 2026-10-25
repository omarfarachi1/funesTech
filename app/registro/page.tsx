import type { Metadata } from 'next';
import PanelMarca from '../PanelMarca';
import RegistroForm from './RegistroForm';
import { esUuid } from '../../lib/validar';

export const metadata: Metadata = { title: 'Crear cuenta · Funestrabajo' };

export default async function Registro({
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
        <RegistroForm oferta={id} />
      </section>
    </main>
  );
}
