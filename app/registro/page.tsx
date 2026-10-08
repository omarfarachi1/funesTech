import type { Metadata } from 'next';
import PanelMarca from '../PanelMarca';
import RegistroForm from './RegistroForm';

export const metadata: Metadata = { title: 'Crear cuenta · Funestrabajo' };

export default function Registro() {
  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        <RegistroForm />
      </section>
    </main>
  );
}
