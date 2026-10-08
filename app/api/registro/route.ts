import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { crearCuenta } from '../../../lib/cuentas';
import { crearSesion } from '../../../lib/session';
import { normalizarDni, validarRegistro, type DatosRegistro } from '../../../lib/validar';

export async function POST(req: NextRequest) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || (cuerpo.tipo !== 'persona' && cuerpo.tipo !== 'empresa')) {
    return NextResponse.json({ error: 'Los datos enviados no son válidos.' }, { status: 400 });
  }
  if (cuerpo.tipo === 'empresa' && cuerpo.personeria !== 'fisica' && cuerpo.personeria !== 'juridica') {
    return NextResponse.json({ error: 'Elegí si la empresa es persona física o jurídica.' }, { status: 400 });
  }

  const datos: DatosRegistro = {
    tipo: cuerpo.tipo,
    personeria: cuerpo.tipo === 'empresa' ? cuerpo.personeria : undefined,
    nombre: String(cuerpo.nombre ?? '').trim(),
    dni: normalizarDni(String(cuerpo.dni ?? '')),
    fechaNacimiento: String(cuerpo.fechaNacimiento ?? ''),
    email: String(cuerpo.email ?? '').trim().toLowerCase(),
    usuario: String(cuerpo.usuario ?? '').trim().toLowerCase(),
    password: String(cuerpo.password ?? ''),
  };

  const errores = validarRegistro(datos);
  if (Object.keys(errores).length > 0) {
    return NextResponse.json({ errores }, { status: 400 });
  }

  const resultado = await crearCuenta({
    tipo: datos.tipo,
    personeria: datos.personeria,
    nombre: datos.nombre,
    dni: datos.dni,
    fechaNacimiento: datos.fechaNacimiento,
    email: datos.email,
    usuario: datos.usuario,
    hash: await bcrypt.hash(datos.password, 10),
  });
  if ('error' in resultado) {
    return NextResponse.json({ errores: { [resultado.campo]: resultado.error } }, { status: 409 });
  }

  await crearSesion({
    usuario: datos.usuario,
    nombre: datos.nombre,
    tipo: datos.tipo,
    personeria: datos.personeria,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
