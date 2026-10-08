'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { errorPassword } from '../../lib/validar';

export default function RestablecerForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const msg = errorPassword(password);
    if (msg) {
      setError(msg);
      document.getElementById('password')?.focus();
      return;
    }
    setCargando(true);
    try {
      const r = await fetch('/api/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data: { error?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos cambiar la contraseña.');
      setListo(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos cambiar la contraseña.'
      );
    } finally {
      setCargando(false);
    }
  }

  if (listo) {
    return (
      <div className="formulario">
        <h2>Contraseña actualizada</h2>
        <p className="ok" role="status">
          Ya podés ingresar con tu nueva contraseña.
        </p>
        <p className="alterna">
          <Link href="/">Ir a ingresar</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Creá tu nueva contraseña</h2>
      <p className="ayuda">Usá al menos 8 caracteres.</p>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <label htmlFor="password">Nueva contraseña</label>
      <div className="campo-pass">
        <input
          id="password"
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <button type="button" className="ver" aria-pressed={ver} onClick={() => setVer((v) => !v)}>
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <button type="submit" className="principal" disabled={cargando}>
        {cargando ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
