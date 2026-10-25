'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { validarAdmin, type CampoAdmin } from '../../lib/roles';

type Campo = Exclude<CampoAdmin, 'rol'> | 'codigo';
type Errores = Partial<Record<Campo, string>>;
const ORDEN: Campo[] = ['codigo', 'nombre', 'dni', 'fechaNacimiento', 'email', 'usuario', 'password'];
const VACIO: Record<Campo, string> = { codigo: '', nombre: '', dni: '', fechaNacimiento: '', email: '', usuario: '', password: '' };

function Entrada({
  id,
  etiqueta,
  error,
  ...props
}: { id: Campo; etiqueta: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} className="campo-msg">
          {error}
        </p>
      )}
    </>
  );
}

export default function ConfigurarForm() {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [general, setGeneral] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  const cambiar = (campo: Campo) => (e: ChangeEvent<HTMLInputElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };
  const enfocar = (errs: Errores) => {
    const primero = ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(primero)?.focus();
  };

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    const { codigo, ...resto } = datos;
    const errs: Errores = validarAdmin({ ...resto, rol: 'superadmin' }, 'crear');
    if (!codigo.trim()) errs.codigo = 'Ingresá el código de instalación.';
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const r = await fetch('/api/configurar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data: { errores?: Errores; error?: string } = await r.json().catch(() => ({}));
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
      setListo(true);
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
      setCargando(false);
    }
  }

  if (listo) {
    return (
      <div className="formulario">
        <h2>Administrador creado</h2>
        <p className="ok" role="status">
          Ya podés ingresar con tu usuario y contraseña. Esta pantalla queda cerrada.
        </p>
        <p className="alterna">
          <Link href="/ingresar">Ir a ingresar</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Configuración inicial</h2>
      <p className="ayuda">Creá el primer superadministrador. Esta pantalla se usa una sola vez.</p>

      {general && (
        <div className="error" role="alert">
          {general}
        </div>
      )}

      <Entrada id="codigo" etiqueta="Código de instalación" type="password" autoComplete="off" value={datos.codigo} onChange={cambiar('codigo')} error={errores.codigo} />
      <Entrada id="nombre" etiqueta="Nombre y apellido" type="text" autoComplete="name" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} />
      <Entrada id="dni" etiqueta="DNI" type="text" inputMode="numeric" autoComplete="off" value={datos.dni} onChange={cambiar('dni')} error={errores.dni} />
      <Entrada id="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} error={errores.fechaNacimiento} />
      <Entrada id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" value={datos.email} onChange={cambiar('email')} error={errores.email} />
      <Entrada id="usuario" etiqueta="Usuario" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={datos.usuario} onChange={cambiar('usuario')} error={errores.usuario} />
      <Entrada id="password" etiqueta="Contraseña" type="password" autoComplete="new-password" value={datos.password} onChange={cambiar('password')} error={errores.password} />

      <button type="submit" className="principal" disabled={cargando}>
        {cargando ? 'Creando…' : 'Crear administrador'}
      </button>
    </form>
  );
}
