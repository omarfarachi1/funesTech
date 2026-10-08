import PanelMarca from './PanelMarca';
import LoginForm from './login/LoginForm';

export default function Inicio() {
  return (
    <main className="pantalla">
      <PanelMarca />
      <section className="acceso">
        <LoginForm />
      </section>
    </main>
  );
}
