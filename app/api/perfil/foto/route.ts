import { NextResponse, type NextRequest } from 'next/server';
import { cuentaFotoActual, guardarFoto, leerFoto, quitarFoto } from '../../../../lib/postulante';
import { FOTO_MAX, esJpeg } from '../../../../lib/foto';

const sinSesion = () =>
  NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });

// Devuelve la foto propia (solo para quien tiene la sesión iniciada; sirve para postulantes y empresas)
export async function GET() {
  const cuenta = await cuentaFotoActual();
  if (!cuenta) return new Response(null, { status: 401 });
  const datos = await leerFoto(cuenta);
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
  const cuenta = await cuentaFotoActual();
  if (!cuenta) return sinSesion();

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

  await guardarFoto(cuenta, contenido);
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Quitar la foto
export async function DELETE() {
  const cuenta = await cuentaFotoActual();
  if (!cuenta) return sinSesion();
  await quitarFoto(cuenta);
  return NextResponse.json({ ok: true });
}
