// Reglas de las ofertas. Se usan en el formulario (navegador) y en el servidor.
export const CATEGORIAS = [
  'Administración', 'Comercio', 'Construcción', 'Educación', 'Gastronomía', 'Industria',
  'Oficios', 'Salud', 'Servicios', 'Tecnología', 'Transporte y logística', 'Otros',
] as const;

export const FOTO_OFERTA = { ancho: 640, alto: 480 }; // miniatura 4:3

export type CampoOferta = 'titulo' | 'categoria' | 'descripcion' | 'requisitos' | 'localidad' | 'horario';
export type DatosOferta = Record<CampoOferta, string>;
export type ErroresOferta = Partial<Record<CampoOferta | 'foto' | 'empresa', string>>;

export type EstadoRevision = 'pendiente' | 'aprobada' | 'rechazada';
export const REVISION: Record<EstadoRevision, string> = {
  pendiente: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

// Un requisito por línea; se ignoran viñetas y líneas vacías
export function listaRequisitos(texto: string): string[] {
  return texto.split('\n').map((l) => l.replace(/^[-•*\s]+/, '').trim()).filter(Boolean);
}

export function validarOferta(d: DatosOferta): ErroresOferta {
  const e: ErroresOferta = {};
  const titulo = d.titulo.trim();
  if (titulo.length < 3 || titulo.length > 120) e.titulo = 'El título debe tener entre 3 y 120 caracteres.';

  const categoria = d.categoria.trim();
  if (categoria.length < 2 || categoria.length > 40) e.categoria = 'Elegí un área.';

  const desc = d.descripcion.trim();
  if (desc.length < 20) e.descripcion = 'Describí el puesto con al menos 20 caracteres.';
  else if (desc.length > 1500) e.descripcion = 'La descripción puede tener hasta 1500 caracteres.';

  const req = listaRequisitos(d.requisitos);
  if (req.length > 10) e.requisitos = 'Podés indicar hasta 10 requisitos.';
  else if (req.some((r) => r.length > 120)) e.requisitos = 'Cada requisito puede tener hasta 120 caracteres.';

  const localidad = d.localidad.trim();
  if (!localidad) e.localidad = 'Ingresá la localidad.';
  else if (localidad.length > 80) e.localidad = 'Máximo 80 caracteres.';

  if (d.horario.trim().length > 120) e.horario = 'Máximo 120 caracteres.';
  return e;
}
