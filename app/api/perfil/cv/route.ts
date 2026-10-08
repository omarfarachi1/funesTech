import { NextResponse, type NextRequest } from 'next/server';
import { guardarCv, perfilActual, quitarCv, urlCv } from '../../../../lib/postulante';
import { CV_MAX, coincideContenido, extensionCv } from '../../../../lib/cv';

const sinSesion = () =>
  NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });

// Ver o descargar el CV propio (redirige a un enlace temporal)
export async function GET() {
  const perfil = await perfilActual();
  if (!perfil) return sinSesion();
  const url = await urlCv(perfil);
  if (!url) return NextResponse.json({ error: 'Todavía no cargaste un CV.' }, { status: 404 });
  return NextResponse.redirect(url);
}

// Cargar o reemplazar el CV
export async function POST(req: NextRequest) {
  const perfil = await perfilActual();
  if (!perfil) return sinSesion();

  const form = await req.formData().catch(() => null);
  const archivo = form?.get('cv');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: 'Elegí un archivo para cargar.' }, { status: 400 });
  }
  if (archivo.size > CV_MAX) {
    return NextResponse.json({ error: 'El archivo supera los 4 MB.' }, { status: 413 });
  }
  const ext = extensionCv(archivo.name);
  if (!ext) {
    return NextResponse.json({ error: 'El CV debe ser un archivo PDF, DOC o DOCX.' }, { status: 400 });
  }
  const contenido = Buffer.from(await archivo.arrayBuffer());
  if (!coincideContenido(ext, contenido)) {
    return NextResponse.json(
      { error: `El archivo no parece ser un ${ext.toUpperCase()} válido.` },
      { status: 400 }
    );
  }

  await guardarCv(perfil, ext, archivo.name.slice(0, 100), contenido);
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Quitar el CV
export async function DELETE() {
  const perfil = await perfilActual();
  if (!perfil) return sinSesion();
  await quitarCv(perfil);
  return NextResponse.json({ ok: true });
}
