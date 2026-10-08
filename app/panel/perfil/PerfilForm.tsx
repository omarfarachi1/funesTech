'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validarPerfil, type CampoPerfil, type DatosPerfil, type ErroresPerfil } from '../../../lib/validar';

const ORDEN: CampoPerfil[] = ['nombre', 'fechaNacimiento', 'email', 'telefono', 'localidad', 'presentacion'];

export default function PerfilForm({
  inicial,
  dni,
  usuario,
}: {
  inicial: DatosPerfil;
  dni: string;
  usuario: string;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosPerfil>(inicial);
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [general, setGeneral] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: CampoPerfil) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setGuardado(false);
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };

  const props = (campo: CampoPerfil) => ({
    id: campo,
    value: datos[campo],
    onChange: cambiar(campo),
    'aria-invalid': errores[campo] ? (true as const) : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  });

  const mensaje = (campo: CampoPerfil) =>
    errores[campo] && (
      <p id={`${campo}-error`} className="campo-msg">
        {errores[campo]}
      </p>
    );

  function enfocar(errs: ErroresPerfil) {
    const primero = ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(primero)?.focus();
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    setGuardado(false);
    const errs = validarPerfil(datos);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const r = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data: { errores?: ErroresPerfil; error?: string } = await r.json();
      if (!r.ok) {
        if (data.errores) {
          setErrores(data.errores);
          enfocar(data.errores);
        } else {
          setGeneral(data.error ?? 'No pudimos guardar los cambios.');
        }
        return;
      }
      setGuardado(true);
      router.refresh();
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="rejilla">
        <div className="ancho">
          <label htmlFor="nombre">Nombre y apellido</label>
          <input type="text" autoComplete="name" {...props('nombre')} />
          {mensaje('nombre')}
        </div>

        <div>
          <label htmlFor="dni">DNI</label>
          <input id="dni" type="text" value={dni} disabled />
        </div>
        <div>
          <label htmlFor="usuario">Usuario</label>
          <input id="usuario" type="text" value={usuario} disabled />
        </div>
        <p className="meta ancho">El DNI y el usuario no se pueden modificar desde acá.</p>

        <div>
          <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
          <input type="date" autoComplete="bday" {...props('fechaNacimiento')} />
          {mensaje('fechaNacimiento')}
        </div>
        <div>
          <label htmlFor="localidad">Localidad</label>
          <input type="text" autoComplete="address-level2" {...props('localidad')} />
          {mensaje('localidad')}
        </div>

        <div>
          <label htmlFor="email">Correo electrónico (para recuperar tu contraseña)</label>
          <input type="email" autoComplete="email" {...props('email')} />
          {mensaje('email')}
        </div>
        <div>
          <label htmlFor="telefono">Teléfono</label>
          <input type="tel" autoComplete="tel" {...props('telefono')} />
          {mensaje('telefono')}
        </div>

        <div className="ancho">
          <label htmlFor="presentacion">Sobre mí</label>
          <textarea rows={4} {...props('presentacion')} />
          <p className="contador">{datos.presentacion.length}/600</p>
          {mensaje('presentacion')}
        </div>
      </div>

      {general && (
        <p className="error" role="alert">
          {general}
        </p>
      )}
      {guardado && (
        <p className="ok" role="status">
          Los cambios se guardaron.
        </p>
      )}

      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
