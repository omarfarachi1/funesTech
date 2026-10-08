// Foto de perfil, o las iniciales si todavía no cargó una.
export default function Avatar({
  nombre,
  fotoVersion,
  tam = 40,
}: {
  nombre: string;
  fotoVersion: string | null;
  tam?: number;
}) {
  const iniciales =
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || '?';
  const estilo = { width: tam, height: tam, fontSize: tam * 0.4 };

  if (fotoVersion) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="avatar" src={`/api/perfil/foto?v=${encodeURIComponent(fotoVersion)}`} alt="" width={tam} height={tam} style={estilo} />;
  }
  return (
    <span className="avatar" style={estilo} aria-hidden="true">
      {iniciales}
    </span>
  );
}
