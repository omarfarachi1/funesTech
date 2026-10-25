import { leerFotoOferta } from '../../../../../lib/empresa';

// Miniatura de una oferta (pública si la oferta está abierta)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const foto = await leerFotoOferta(id);
  if (!foto) return new Response(null, { status: 404 });
  return new Response(foto.datos, {
    headers: {
      'Content-Type': 'image/jpeg',
      // La dirección incluye ?v=..., que cambia cuando se sube una foto nueva
      'Cache-Control': foto.publica ? 'public, max-age=31536000, immutable' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
