import { NextResponse, type NextRequest } from 'next/server';
import {
  actualizarOfertaAdmin,
  autorizar,
  cambiarActivaAdmin,
  eliminarOferta,
  guardarFotoOfertaAdmin,
  quitarFotoOfertaAdmin,
  resolverEmpresaAdmin,
  revisarOferta,
} from '../../../../../lib/admin';
import { leerFormularioOferta } from '../../../../../lib/empresa';
import { esUuid } from '../../../../../lib/validar';

type Contexto = { params: Promise<{ id: string }> };
const noEncontrada = () => NextResponse.json({ error: 'No encontramos esa oferta.' }, { status: 404 });
const servidor = (err: unknown) => {
  console.error('Error en /api/admin/ofertas/[id]:', err);
  return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
};

// Modificar la oferta
export async function PUT(req: NextRequest, ctx: Contexto) {
  try {
    const a = await autorizar('ofertas', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    if (!esUuid(id)) return noEncontrada();

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    const { datos, errores, foto, quitarFoto } = await leerFormularioOferta(form);
    const emp = await resolverEmpresaAdmin(String(form.get('empresaId') ?? ''), String(form.get('empresa') ?? ''));
    if (emp.nombre.length < 2 || emp.nombre.length > 100) errores.empresa = 'Ingresá el nombre de la empresa.';
    if (Object.keys(errores).length > 0) return NextResponse.json({ errores }, { status: 400 });

    if (!(await actualizarOfertaAdmin(id, datos, emp.nombre, emp.id))) return noEncontrada();
    if (foto) await guardarFotoOfertaAdmin(id, foto);
    else if (quitarFoto) await quitarFotoOfertaAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return servidor(err);
  }
}

// Aprobar, rechazar, pausar o reactivar
export async function PATCH(req: NextRequest, ctx: Contexto) {
  try {
    const a = await autorizar('ofertas', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { accion?: unknown; motivo?: unknown } = await req.json().catch(() => ({}));
    if (!esUuid(id) || typeof c.accion !== 'string') {
      return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    }

    let ok = false;
    if (c.accion === 'aprobar') ok = await revisarOferta(a.admin, id, 'aprobar', '');
    else if (c.accion === 'rechazar') {
      const motivo = String(c.motivo ?? '').trim();
      if (motivo.length < 5 || motivo.length > 300) {
        return NextResponse.json({ error: 'Indicá el motivo del rechazo (entre 5 y 300 caracteres).' }, { status: 400 });
      }
      ok = await revisarOferta(a.admin, id, 'rechazar', motivo);
    } else if (c.accion === 'pausar' || c.accion === 'reactivar') ok = await cambiarActivaAdmin(id, c.accion === 'reactivar');
    else return NextResponse.json({ error: 'Acción no válida.' }, { status: 400 });

    return ok ? NextResponse.json({ ok: true }) : noEncontrada();
  } catch (err) {
    return servidor(err);
  }
}

// Eliminar (también se borran sus postulaciones)
export async function DELETE(_req: NextRequest, ctx: Contexto) {
  try {
    const a = await autorizar('ofertas', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    if (!esUuid(id)) return noEncontrada();
    return (await eliminarOferta(id)) ? NextResponse.json({ ok: true }) : noEncontrada();
  } catch (err) {
    return servidor(err);
  }
}
