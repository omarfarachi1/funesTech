'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validarCuenta, type DatosCuenta, type ErroresCuenta } from '../../lib/perfilCuenta';

const ORDEN: (keyof DatosCuenta)[] = ['nombre', 'email', 'telefono', 'localidad', 'presentacion'];

// Datos editables del perfil de una empresa o un administrador
export default function PerfilCuentaForm({
  inicial,
  etiquetaNombre,
  conDescripcion,
}: {
  inicial: DatosCuenta;
  etiquetaNombre: string;
  conDescripcion: boolean;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosCuenta>(inicial);
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [general, setGeneral] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: keyof DatosCuenta) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setGuardado(false);
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };
  const props = (campo: keyof DatosCuenta) => ({
    id: `cuenta-${campo}`,
    value: datos[campo],
    onChange: cambiar(campo),
    'aria-invalid': errores[campo] ? (true as const) : undefined,
    'aria-describedby': errores[campo] ? `cuenta-${campo}-error` : undefined,
  });
  const mensaje = (campo: keyof DatosCuenta) =>
    errores[campo] && (
      <p id={`cuenta-${campo}-error`} className="campo-msg">
        {errores[campo]}
      </p>
    );
  const enfocar = (errs: ErroresCuenta) => {
    const primero = ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(`cuenta-${primero}`)?.focus();
  };

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    setGuardado(false);
    const errs = validarCuenta(datos);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const r = await fetch('/api/perfil/cuenta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data: { errores?: ErroresCuenta; error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.errores) {
          setErrores(data.errores);
          enfocar(data.errores);
        } else {
          setGeneral(data.error ?? `El servidor no pudo procesar el pedido (código ${r.status}). Intentá de nuevo más tarde.`);
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
          <label htmlFor="cuenta-nombre">{etiquetaNombre}</label>
          <input type="text" maxLength={100} {...props('nombre')} />
          {mensaje('nombre')}
        </div>
        <div>
          <label htmlFor="cuenta-email">Correo electrónico</label>
          <input type="email" autoComplete="email" {...props('email')} />
          {mensaje('email')}
        </div>
        <div>
          <label htmlFor="cuenta-telefono">Teléfono</label>
          <input type="tel" autoComplete="tel" {...props('telefono')} />
          {mensaje('telefono')}
        </div>
        <div className="ancho">
          <label htmlFor="cuenta-localidad">Localidad</label>
          <input type="text" maxLength={80} {...props('localidad')} />
          {mensaje('localidad')}
        </div>
        {conDescripcion && (
          <div className="ancho">
            <label htmlFor="cuenta-presentacion">Descripción de la empresa</label>
            <textarea rows={3} maxLength={600} {...props('presentacion')} />
            <p className="contador">{datos.presentacion.length}/600</p>
            {mensaje('presentacion')}
          </div>
        )}
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
