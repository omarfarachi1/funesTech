// Estados de una postulación:
// recibida > preentrevistada (opcional) > derivada a la empresa > contratado / no contratado   (o descartada)
export type EstadoPostulacion = 'recibida' | 'preentrevistada' | 'derivada' | 'contratado' | 'no_contratado' | 'descartada';

export const ESTADOS: Record<EstadoPostulacion, string> = {
  recibida: 'Recibida',
  preentrevistada: 'Preentrevistada',
  derivada: 'Derivada a la empresa',
  contratado: 'Contratado',
  no_contratado: 'No contratado',
  descartada: 'Descartada',
};

// Estados en los que la empresa puede ver al candidato
export const DERIVADOS: EstadoPostulacion[] = ['derivada', 'contratado', 'no_contratado'];

export const RESULTADOS_PREENTREVISTA = {
  favorable: 'Favorable',
  con_reservas: 'Con reservas',
  desfavorable: 'Desfavorable',
} as const;
export type ResultadoPreentrevista = keyof typeof RESULTADOS_PREENTREVISTA;

export function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

// Para fechas sin hora (por ejemplo, nacimiento): evita el corrimiento de un día por zona horaria.
export function fechaSolo(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
