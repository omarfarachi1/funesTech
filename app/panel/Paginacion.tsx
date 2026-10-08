import Link from 'next/link';
import type { Filtros } from '../../lib/filtro';

function enlace(f: Filtros, pagina: number) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.ubicacion) p.set('ubicacion', f.ubicacion);
  if (f.categoria) p.set('categoria', f.categoria);
  if (pagina > 1) p.set('pagina', String(pagina));
  const s = p.toString();
  return s ? `/panel?${s}` : '/panel';
}

// Primera, última y vecinas de la actual; null = "…"
function numeros(actual: number, total: number) {
  const set = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
  const orden = [...set].sort((a, b) => a - b);
  const res: (number | null)[] = [];
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) res.push(null);
    res.push(n);
  });
  return res;
}

export default function Paginacion({
  filtros,
  pagina,
  paginas,
}: {
  filtros: Filtros;
  pagina: number;
  paginas: number;
}) {
  if (paginas <= 1) return null;
  return (
    <nav className="paginas" aria-label="Paginación">
      {pagina > 1 ? (
        <Link href={enlace(filtros, pagina - 1)} className="pag">
          ‹ Anterior
        </Link>
      ) : (
        <span className="pag pag-off">‹ Anterior</span>
      )}
      {numeros(pagina, paginas).map((n, i) =>
        n === null ? (
          <span key={`e${i}`} className="pag-off">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={enlace(filtros, n)}
            className="pag"
            aria-current={n === pagina ? 'page' : undefined}
            aria-label={`Página ${n}`}
          >
            {n}
          </Link>
        )
      )}
      {pagina < paginas ? (
        <Link href={enlace(filtros, pagina + 1)} className="pag">
          Siguiente ›
        </Link>
      ) : (
        <span className="pag pag-off">Siguiente ›</span>
      )}
    </nav>
  );
}
