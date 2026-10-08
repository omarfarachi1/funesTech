'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { EMAIL_RE } from '../../lib/validar';

export default function RecuperarForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const valor = email.trim().toLowerCase();
    if (!EMAIL_RE.test(valor)) {
      setError('Ingresá un correo válido.');
      document.getElementById('email')?.focus();
      return;
    }
    setCargando(true);
    try {
      const r = await fetch('/api/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: valor }),
      });
      const data: { error?: string; mensaje?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos procesar el pedido.');
      setEnviado(data.mensaje ?? 'Revisá tu correo.');
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos procesar el pedido.'
      );
    } finally {
      setCargando(false);
    }
  }

  if (enviado) {
    return (
      <div className="formulario">
        <h2>Revisá tu correo</h2>
        <p className="ayuda">{enviado}</p>
        <p className="ok" role="status">
          El enlace vale por 30 minutos.
        </p>
        <p className="alterna">
          <Link href="/">Volver a ingresar</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Recuperá tu contraseña</h2>
      <p className="ayuda">
        Ingresá el correo con el que te registraste y te enviamos un enlace para crear una nueva contraseña.
      </p>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <label htmlFor="email">Correo electrónico</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={error ? true : undefined}
      />

      <button type="submit" className="principal" disabled={cargando}>
        {cargando ? 'Enviando…' : 'Enviar enlace'}
      </button>
      <p className="alterna">
        <Link href="/">Volver a ingresar</Link>
      </p>
    </form>
  );
}
