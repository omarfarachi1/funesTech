import type { Oferta } from './postulante';

export const POR_PAGINA = 10;

export type Filtros = { q: string; ubicacion: string; categoria: string; pagina: number };

// Sin tildes y en minúsculas, para que "panolero" encuentre "Pañolero".
const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function leerFiltros(sp: Record<string, string | string[] | undefined>): Filtros {
  const uno = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return (s ?? '').trim().slice(0, 80);
  };
  return {
    q: uno('q'),
    ubicacion: uno('ubicacion'),
    categoria: uno('categoria'),
    pagina: Math.max(1, parseInt(uno('pagina'), 10) || 1),
  };
}

export function filtrarOfertas(ofertas: Oferta[], f: Filtros) {
  const palabras = normalizar(f.q).split(/\s+/).filter(Boolean).slice(0, 6);
  const ubicacion = normalizar(f.ubicacion);

  const filtradas = ofertas.filter((o) => {
    if (f.categoria && o.categoria !== f.categoria) return false;
    if (ubicacion && !normalizar(o.localidad).includes(ubicacion)) return false;
    // Todas las palabras tienen que aparecer en algún campo de la oferta
    const texto = normalizar([o.titulo, o.empresa, o.descripcion, o.categoria, ...o.requisitos].join(' '));
    return palabras.every((p) => texto.includes(p));
  });

  const total = filtradas.length;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(f.pagina, paginas);
  const inicio = (pagina - 1) * POR_PAGINA;
  return {
    items: filtradas.slice(inicio, inicio + POR_PAGINA),
    total,
    pagina,
    paginas,
    desde: total ? inicio + 1 : 0,
    hasta: Math.min(inicio + POR_PAGINA, total),
  };
}

export function contarCategorias(ofertas: Oferta[]) {
  const m = new Map<string, number>();
  for (const o of ofertas) m.set(o.categoria, (m.get(o.categoria) ?? 0) + 1);
  return [...m]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
