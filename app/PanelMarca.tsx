import Image from 'next/image';

export default function PanelMarca() {
  return (
    <aside className="marca">
      <Image
        src="/logo-funes.png"
        alt="Escudo del Gobierno de la Ciudad de Funes, desde 1875"
        width={637}
        height={638}
        priority
        className="marca-logo"
      />
      <div className="marca-texto">
        <h1>Funestrabajo</h1>
        <p>La bolsa de empleo de la ciudad.</p>
      </div>
    </aside>
  );
}
