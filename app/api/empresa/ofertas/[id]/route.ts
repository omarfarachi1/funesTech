import { NextResponse, type NextRequest } from 'next/server';
import {
  actualizarOferta,
  cambiarActiva,
  empresaActual,
  guardarFotoOferta,
  leerFormularioOferta,
  quitarFotoOferta,
} from '../../../../../lib/empresa';
import { esUuid } from '../../../../../lib/validar';

type Contexto = { params: Promise<{ id: string }> };
const noEncontrada = () => NextResponse.json({ error: 'No encontramos esa oferta.' }, { status: 404 });

// Editar la oferta
export async function PUT(req: NextRequest, ctx: Contexto) {
  try {
    const empresa = await empresaActual();
    if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    const { id } = await ctx.params;
    if (!esUuid(id)) return noEncontrada();

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    const { datos, errores, foto, quitarFoto } = await leerFormularioOferta(form);
    if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

    if (!(await actualizarOferta(empresa.id, id, datos))) return noEncontrada();
    if (foto) await guardarFotoOferta(empresa.id, id, foto);
    else if (quitarFoto) await quitarFotoOferta(empresa.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error al editar la oferta:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}

// Pausar o reactivar la oferta
export async function PATCH(req: NextRequest, ctx: Contexto) {
  try {
    const empresa = await empresaActual();
    if (!empresa) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 });
    const { id } = await ctx.params;
    const cuerpo: { activa?: unknown } = await req.json().catch(() => ({}));
    if (!esUuid(id) || typeof cuerpo.activa !== 'boolean') {
      return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    }
    if (!(await cambiarActiva(empresa.id, id, cuerpo.activa))) return noEncontrada();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error al cambiar el estado de la oferta:', err);
    return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
  }
}
