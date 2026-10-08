import Link from 'next/link';
import type { Filtros } from '../../lib/filtro';

export default function FiltroOfertas({
  filtros,
  categorias,
}: {
  filtros: Filtros;
  categorias: { nombre: string; cantidad: number }[];
}) {
  const hayFiltros = Boolean(filtros.q || filtros.ubicacion || filtros.categoria);

  return (
    <form action="/panel" method="get" className="buscador" role="search" aria-label="Buscar ofertas">
      <div className="buscador-campos">
        <div>
          <label htmlFor="q">Palabra clave</label>
          <input id="q" name="q" type="search" defaultValue={filtros.q} placeholder="Ej: cajero, cocina, contable" />
        </div>
        <div>
          <label htmlFor="ubicacion">Ubicación</label>
          <input id="ubicacion" name="ubicacion" type="text" defaultValue={filtros.ubicacion} placeholder="Ej: Funes" />
        </div>
        <div>
          <label htmlFor="categoria">Área</label>
          <select id="categoria" name="categoria" defaultValue={filtros.categoria}>
            <option value="">Todas las áreas</option>
            {categorias.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.nombre} ({c.cantidad})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn buscador-btn">
          Buscar
        </button>
      </div>
      {hayFiltros && (
        <Link href="/panel" className="restablecer">
          Restablecer filtros
        </Link>
      )}
    </form>
  );
}
