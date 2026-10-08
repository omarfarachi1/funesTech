export type EstadoPostulacion = 'enviada' | 'en_revision' | 'preseleccionada' | 'no_seleccionada';

export const ESTADOS: Record<EstadoPostulacion, string> = {
  enviada: 'Enviada',
  en_revision: 'En revisión',
  preseleccionada: 'Preseleccionada',
  no_seleccionada: 'No seleccionada',
};

export function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}
