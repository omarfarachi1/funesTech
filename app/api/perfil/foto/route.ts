import { NextResponse, type NextRequest } from 'next/server';
import { guardarFoto, leerFoto, perfilActual, quitarFoto } from '../../../../lib/postulante';
import { FOTO_MAX, esJpeg } from '../../../../lib/foto';

const sinSesion = () =>
  NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });

// Devuelve la foto propia (solo para quien tiene la sesión iniciada)
export async function GET() {
  const perfil = await perfilActual();
  if (!perfil) return new Response(null, { status: 401 });
  const datos = await leerFoto(perfil);
  if (!datos) return new Response(null, { status: 404 });
  return new Response(datos, {
    headers: {
      'Content-Type': 'image/jpeg',
      // La dirección incluye ?v=..., que cambia con cada foto nueva
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Cargar o reemplazar la foto
export async function POST(req: NextRequest) {
  const perfil = await perfilActual();
  if (!perfil) return sinSesion();

  const form = await req.formData().catch(() => null);
  const archivo = form?.get('foto');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: 'Elegí una imagen para cargar.' }, { status: 400 });
  }
  if (archivo.size > FOTO_MAX) {
    return NextResponse.json({ error: 'La imagen es demasiado pesada.' }, { status: 413 });
  }
  const contenido = Buffer.from(await archivo.arrayBuffer());
  if (!esJpeg(contenido)) {
    return NextResponse.json({ error: 'La imagen no es válida. Probá con otra foto.' }, { status: 400 });
  }

  await guardarFoto(perfil, contenido);
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Quitar la foto
export async function DELETE() {
  const perfil = await perfilActual();
  if (!perfil) return sinSesion();
  await quitarFoto(perfil);
  return NextResponse.json({ ok: true });
}
