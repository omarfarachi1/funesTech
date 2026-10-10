'use client';

import { useRef, useState, type FormEvent, type RefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Campo = 'usuario' | 'password';

export default function LoginForm() {
  const router = useRouter();
  const usuarioRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState('');
  const [campoError, setCampoError] = useState<Campo | null>(null);
  const [cargando, setCargando] = useState(false);

  function fallar(mensaje: string, campo: Campo, ref: RefObject<HTMLInputElement | null>) {
    setError(mensaje);
    setCampoError(campo);
    ref.current?.focus();
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setCampoError(null);
    const usuario = usuarioRef.current?.value.trim() ?? '';
    const password = passRef.current?.value ?? '';

    if (!usuario) return fallar('Ingresá tu usuario.', 'usuario', usuarioRef);
    if (!password) return fallar('Ingresá tu contraseña.', 'password', passRef);

    setCargando(true);
    try {
      const r = await fetch('.../api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });
      const data: { error?: string } = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'No pudimos iniciar sesión.');
      router.push('/panel');
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? 'No hay conexión con el servidor. Intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'No pudimos iniciar sesión.';
      fallar(msg, 'password', passRef);
      passRef.current?.select();
      setCargando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Ingresá a tu cuenta</h2>
      <p className="ayuda">Usá el usuario que te asignó la Municipalidad.</p>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <label htmlFor="usuario">Usuario</label>
      <input
        id="usuario"
        ref={usuarioRef}
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
        aria-invalid={campoError === 'usuario' || undefined}
      />

      <label htmlFor="password">Contraseña</label>
      <div className="campo-pass">
        <input
          id="password"
          ref={passRef}
          type={verPass ? 'text' : 'password'}
          autoComplete="current-password"
          aria-invalid={campoError === 'password' || undefined}
        />
        <button
          type="button"
          className="ver"
          aria-pressed={verPass}
          onClick={() => setVerPass((v) => !v)}
        >
          {verPass ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <button type="submit" className="principal" disabled={cargando}>
        {cargando ? 'Ingresando…' : 'Ingresar'}
      </button>
      <Link className="olvido" href="/recuperar">
        ¿Olvidaste tu contraseña?
      </Link>
      <p className="alterna">
        ¿Todavía no tenés cuenta? <Link href="/registro">Crear cuenta</Link>
      </p>
    </form>
  );
}
