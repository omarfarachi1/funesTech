'use client';

import { useState, type FormEvent } from 'react';
import { errorPassword } from '../../lib/validar';

// Cambio de contraseña para cualquier tipo de cuenta
export default function CambiarClave() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState<{ actual?: string; nueva?: string }>({});
  const [general, setGeneral] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    setListo(false);
    const errs: { actual?: string; nueva?: string } = {};
    if (!actual) errs.actual = 'Ingresá tu contraseña actual.';
    const m = errorPassword(nueva);
    if (m) errs.nueva = m;
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      document.getElementById(errs.actual ? 'clave-actual' : 'clave-nueva')?.focus();
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const r = await fetch('/api/perfil/clave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual, nueva }),
      });
      const data: { errores?: { actual?: string; nueva?: string }; error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (data.errores) setErrores(data.errores);
        else setGeneral(data.error ?? `El servidor no pudo procesar el pedido (código ${r.status}). Intentá de nuevo más tarde.`);
        return;
      }
      setListo(true);
      setActual('');
      setNueva('');
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="clave-actual">Contraseña actual</label>
      <input
        id="clave-actual"
        type={ver ? 'text' : 'password'}
        autoComplete="current-password"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
        aria-invalid={errores.actual ? true : undefined}
      />
      {errores.actual && <p className="campo-msg">{errores.actual}</p>}

      <label htmlFor="clave-nueva">Contraseña nueva (mínimo 8 caracteres)</label>
      <input
        id="clave-nueva"
        type={ver ? 'text' : 'password'}
        autoComplete="new-password"
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        aria-invalid={errores.nueva ? true : undefined}
      />
      {errores.nueva && <p className="campo-msg">{errores.nueva}</p>}

      <label className="check" htmlFor="clave-ver">
        <input id="clave-ver" type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} />
        Mostrar las contraseñas
      </label>

      {general && (
        <p className="error" role="alert">
          {general}
        </p>
      )}
      {listo && (
        <p className="ok" role="status">
          Tu contraseña se cambió correctamente.
        </p>
      )}
      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  );
}
