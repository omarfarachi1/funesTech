import Link from 'next/link';

// Paginación simple para los listados del administrador
export default function Paginas({
  base,
  params,
  pagina,
  paginas,
}: {
  base: string;
  params: Record<string, string>;
  pagina: number;
  paginas: number;
}) {
  if (paginas <= 1) return null;
  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    if (n > 1) p.set('pagina', String(n));
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };
  return (
    <nav className="paginas" aria-label="Paginación">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className="pag">
          ‹ Anterior
        </Link>
      ) : (
        <span className="pag pag-off">‹ Anterior</span>
      )}
      <span className="pag-off">
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas ? (
        <Link href={href(pagina + 1)} className="pag">
          Siguiente ›
        </Link>
      ) : (
        <span className="pag pag-off">Siguiente ›</span>
      )}
    </nav>
  );
}
