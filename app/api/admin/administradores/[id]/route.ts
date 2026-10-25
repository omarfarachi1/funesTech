import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { actualizarAdmin, autorizar, cambiarHabilitadaAdmin, type ResultadoAdmin } from '../../../../../lib/admin';
import { esRol, validarAdmin, type DatosAdmin } from '../../../../../lib/roles';

type Contexto = { params: Promise<{ id: string }> };
const fallo = (r: Extract<ResultadoAdmin, { error: string }>) =>
  NextResponse.json(r.campo ? { errores: { [r.campo]: r.error } } : { error: r.error }, { status: r.status ?? 409 });
const servidor = (err: unknown) => {
  console.error('Error en /api/admin/administradores/[id]:', err);
  return NextResponse.json({ error: 'Error del servidor. Intentá de nuevo más tarde.' }, { status: 500 });
};

// Modificar datos y rol (la contraseña es opcional)
export async function PUT(req: NextRequest, ctx: Contexto) {
  try {
    const a = await autorizar('administradores', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c = await req.json().catch(() => null);
    if (!c) return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    const d: DatosAdmin = {
      nombre: String(c.nombre ?? '').trim(),
      dni: '',
      fechaNacimiento: '',
      email: String(c.email ?? '').trim().toLowerCase(),
      usuario: '',
      password: String(c.password ?? ''),
      rol: String(c.rol ?? ''),
    };
    const errores = validarAdmin(d, 'editar');
    if (Object.keys(errores).length > 0 || !esRol(d.rol)) return NextResponse.json({ errores }, { status: 400 });

    const r = await actualizarAdmin(id, {
      nombre: d.nombre,
      email: d.email,
      rol: d.rol,
      hash: d.password ? await bcrypt.hash(d.password, 10) : undefined,
    }, a.admin.id);
    return 'error' in r ? fallo(r) : NextResponse.json({ ok: true });
  } catch (err) {
    return servidor(err);
  }
}

// Dar de baja (deshabilitar) o reactivar
export async function PATCH(req: NextRequest, ctx: Contexto) {
  try {
    const a = await autorizar('administradores', true);
    if ('respuesta' in a) return a.respuesta;
    const { id } = await ctx.params;
    const c: { habilitada?: unknown } = await req.json().catch(() => ({}));
    if (typeof c.habilitada !== 'boolean') return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
    const r = await cambiarHabilitadaAdmin(id, c.habilitada, a.admin.id);
    return 'error' in r ? fallo(r) : NextResponse.json({ ok: true });
  } catch (err) {
    return servidor(err);
  }
}
