import { empresaActual, leerFotoPostulante, postulacionDeEmpresa } from '../../../../../../lib/empresa';

// Foto de perfil de un postulante (solo para la empresa a la que se postuló)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const empresa = await empresaActual();
  if (!empresa) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  const p = await postulacionDeEmpresa(empresa.id, id);
  if (!p?.fotoPath) return new Response(null, { status: 404 });
  const datos = await leerFotoPostulante(p.fotoPath);
  if (!datos) return new Response(null, { status: 404 });
  return new Response(datos, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
