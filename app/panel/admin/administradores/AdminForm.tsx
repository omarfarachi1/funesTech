'use client';

import { useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, esRol, validarAdmin, type CampoAdmin, type DatosAdmin, type ErroresAdmin } from '../../../../lib/roles';

const ORDEN: CampoAdmin[] = ['nombre', 'dni', 'fechaNacimiento', 'email', 'usuario', 'password', 'rol'];

function Entrada({
  id,
  etiqueta,
  error,
  ...props
}: { id: CampoAdmin; etiqueta: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} className="campo-msg">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AdminForm({
  modo,
  id,
  inicial,
  rolBloqueado = false,
}: {
  modo: 'crear' | 'editar';
  id?: string;
  inicial: DatosAdmin;
  rolBloqueado?: boolean;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosAdmin>(inicial);
  const [errores, setErrores] = useState<ErroresAdmin>({});
  const [general, setGeneral] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const editar = modo === 'editar';

  const cambiar = (campo: CampoAdmin) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };

  function enfocar(errs: ErroresAdmin) {
    const primero = ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(primero)?.focus();
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    const errs = validarAdmin(datos, modo);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const cuerpo = editar ? { nombre: datos.nombre, email: datos.email, rol: datos.rol, password: datos.password } : datos;
      const r = await fetch(editar ? `/api/admin/administradores/${id}` : '/api/admin/administradores', {
        method: editar ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const data: { errores?: ErroresAdmin; error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.errores) {
          setErrores(data.errores);
          enfocar(data.errores);
        } else {
          setGeneral(data.error ?? `El servidor no pudo procesar el pedido (código ${r.status}). Intentá de nuevo más tarde.`);
        }
        setCargando(false);
        return;
      }
      router.push('/panel/admin/administradores');
      router.refresh();
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="bloque">
      {general && (
        <p className="error" role="alert">
          {general}
        </p>
      )}
      <div className="rejilla">
        <div className="ancho">
          <Entrada id="nombre" etiqueta="Nombre y apellido" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} type="text" autoComplete="off" />
        </div>
        <Entrada id="dni" etiqueta="DNI" value={datos.dni} onChange={cambiar('dni')} error={errores.dni} type="text" inputMode="numeric" disabled={editar} />
        <Entrada id="fechaNacimiento" etiqueta="Fecha de nacimiento" value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} error={errores.fechaNacimiento} type="date" disabled={editar} />
        <Entrada id="email" etiqueta="Correo electrónico" value={datos.email} onChange={cambiar('email')} error={errores.email} type="email" autoComplete="off" />
        <Entrada id="usuario" etiqueta="Usuario" value={datos.usuario} onChange={cambiar('usuario')} error={errores.usuario} type="text" autoCapitalize="none" spellCheck={false} disabled={editar} />

        <div className="ancho">
          <label htmlFor="rol">Rol</label>
          <select id="rol" value={datos.rol} onChange={cambiar('rol')} disabled={rolBloqueado} aria-invalid={errores.rol ? true : undefined} aria-describedby="rol-ayuda">
            <option value="">Elegí un rol</option>
            {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((k) => (
              <option key={k} value={k}>
                {ROLES[k].nombre}
              </option>
            ))}
          </select>
          <p id="rol-ayuda" className="meta">
            {rolBloqueado
              ? 'No podés cambiar tu propio rol. Pedile a otro superadministrador que lo haga.'
              : esRol(datos.rol)
                ? ROLES[datos.rol].descripcion
                : 'Cada rol define qué puede ver y modificar.'}
          </p>
          {errores.rol && <p className="campo-msg">{errores.rol}</p>}
        </div>

        <div className="ancho">
          <label htmlFor="password">{editar ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
          <div className="campo-pass">
            <input
              id="password"
              type={verPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={datos.password}
              onChange={cambiar('password')}
              aria-invalid={errores.password ? true : undefined}
              aria-describedby={errores.password ? 'password-error' : undefined}
            />
            <button type="button" className="ver" aria-pressed={verPass} onClick={() => setVerPass((v) => !v)}>
              {verPass ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {editar && <p className="meta">Dejala vacía para no cambiar la contraseña actual.</p>}
          {errores.password && (
            <p id="password-error" className="campo-msg">
              {errores.password}
            </p>
          )}
        </div>
      </div>

      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear administrador'}
        </button>
        <button type="button" className="btn btn-sec" onClick={() => router.push('/panel/admin/administradores')} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
