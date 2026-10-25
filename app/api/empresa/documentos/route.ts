import { NextResponse, type NextRequest } from 'next/server';
import { empresaActual } from '../../../../lib/empresa';
import { subirDocumento } from '../../../../lib/verificacion';
import { DOC_MAX, coincideDoc, esTipoDocumento, extensionDoc } from '../../../../lib/documentos';

// La empresa jurídica sube un documento de respaldo
async function procesar(req: NextRequest) {
  const empresa = await empresaActual();
  if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
  if (empresa.personeria !== 'juridica') {
    return NextResponse.json({ error: 'La documentación es solo para empresas que son personas jurídicas.' }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const tipo = String(form?.get('tipo') ?? '');
  if (!esTipoDocumento(tipo)) return NextResponse.json({ error: 'Elegí qué tipo de documento vas a subir.' }, { status: 400 });

  const archivo = form?.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) return NextResponse.json({ error: 'Elegí un archivo para subir.' }, { status: 400 });
  if (archivo.size > DOC_MAX) return NextResponse.json({ error: 'El archivo supera los 4 MB.' }, { status: 413 });
  const ext = extensionDoc(archivo.name);
  if (!ext) return NextResponse.json({ error: 'El archivo debe ser PDF, JPG o PNG.' }, { status: 400 });
  const contenido = Buffer.from(await archivo.arrayBuffer());
  if (!coincideDoc(ext, contenido)) {
    return NextResponse.json({ error: `El archivo no parece ser un ${ext.toUpperCase()} válido.` }, { status: 400 });
  }

  const r = await subirDocumento(empresa, tipo, archivo.name, ext, contenido);
  return 'error' in r ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true }, { status: 201 });
}

export async function POST(req: NextRequest) {
  try {
    return await procesar(req);
  } catch (err) {
    console.error('Error en /api/empresa/documentos:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
