import { autorizar, rutasCandidato } from '../../../../../../lib/admin';
import { leerFotoPostulante } from '../../../../../../lib/empresa';

// Foto de perfil de un candidato (solo para administradores)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await autorizar('candidatos');
  if ('respuesta' in a) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  const r = await rutasCandidato(id);
  if (!r?.fotoPath) return new Response(null, { status: 404 });
  const datos = await leerFotoPostulante(r.fotoPath);
  if (!datos) return new Response(null, { status: 404 });
  return new Response(datos, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
