import { NextResponse, type NextRequest } from 'next/server';
import { crearOferta, empresaActual, guardarFotoOferta, leerFormularioOferta } from '../../../../lib/empresa';

async function procesar(req: NextRequest) {
  const empresa = await empresaActual();
  if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });

  const { datos, errores, foto } = await leerFormularioOferta(form);
  if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

  const id = await crearOferta(empresa, datos);
  if (foto) {
    try {
      await guardarFotoOferta(empresa.id, id, foto);
    } catch (err) {
      // La oferta ya quedó publicada; la foto se puede agregar después editándola
      console.error('No se pudo guardar la foto de la oferta:', err);
    }
  }
  return NextResponse.json({ ok: true, id }, { status: 201 });
}

export async function POST(req: NextRequest) {
  try {
    return await procesar(req);
  } catch (err) {
    console.error('Error en /api/empresa/ofertas:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
