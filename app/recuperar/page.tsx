import type { Metadata } from 'next';
import PanelMarca from '../PanelMarca';
import RecuperarForm from './RecuperarForm';

export const metadata: Metadata = { title: 'Recuperar contraseña · Funestrabajo' };

export default function Recuperar() {
  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        <RecuperarForm />
      </section>
    </main>
  );
}
