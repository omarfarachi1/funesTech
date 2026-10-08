'use client';

import { useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  normalizarDni,
  validarRegistro,
  type Campo,
  type DatosRegistro,
  type Errores,
  type Personeria,
  type TipoCuenta,
} from '../../lib/validar';

const ORDEN: Campo[] = ['nombre', 'dni', 'fechaNacimiento', 'email', 'usuario', 'password'];
const VACIO = { nombre: '', dni: '', fechaNacimiento: '', email: '', usuario: '', password: '' };

function Entrada({
  id,
  etiqueta,
  error,
  ...props
}: { id: Campo; etiqueta: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="campo-msg">
          {error}
        </p>
      )}
    </>
  );
}

function Opcion({
  nombre,
  checked,
  onChange,
  titulo,
  detalle,
}: {
  nombre: string;
  checked: boolean;
  onChange: () => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <label className="opcion">
      <input type="radio" name={nombre} checked={checked} onChange={onChange} />
      <span>
        <strong>{titulo}</strong>
        <small>{detalle}</small>
      </span>
    </label>
  );
}

export default function RegistroForm() {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoCuenta>('persona');
  const [personeria, setPersoneria] = useState<Personeria>('fisica');
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [general, setGeneral] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  const juridica = tipo === 'empresa' && personeria === 'juridica';
  const etiqueta = juridica
    ? { nombre: 'Razón social', dni: 'CUIT', fecha: 'Fecha de constitución' }
    : { nombre: 'Nombre y apellido', dni: 'DNI', fecha: 'Fecha de nacimiento' };

  const cambiar = (campo: Campo) => (e: ChangeEvent<HTMLInputElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };

  function enfocar(errs: Errores) {
    const primero = ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(primero)?.focus();
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    const payload: DatosRegistro = {
      tipo,
      personeria: tipo === 'empresa' ? personeria : undefined,
      ...datos,
      dni: normalizarDni(datos.dni),
      usuario: datos.usuario.trim().toLowerCase(),
      email: datos.email.trim().toLowerCase(),
    };
    const errs = validarRegistro(payload);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }

    setErrores({});
    setCargando(true);
    try {
      const r = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: { errores?: Errores; error?: string } = await r.json();
      if (!r.ok) {
        if (data.errores) {
          setErrores(data.errores);
          enfocar(data.errores);
        } else {
          setGeneral(data.error ?? 'No pudimos crear la cuenta. Intentá de nuevo.');
        }
        setCargando(false);
        return;
      }
      router.push('/panel');
      router.refresh();
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Creá tu cuenta</h2>
      <p className="ayuda">Completá tus datos para usar Funestrabajo.</p>

      {general && (
        <div className="error" role="alert">
          {general}
        </div>
      )}

      <fieldset className="opciones">
        <legend>Tipo de cuenta</legend>
        <Opcion nombre="tipo" checked={tipo === 'persona'} onChange={() => setTipo('persona')} titulo="Postulante" detalle="Busco trabajo" />
        <Opcion nombre="tipo" checked={tipo === 'empresa'} onChange={() => setTipo('empresa')} titulo="Empresa" detalle="Ofrezco puestos" />
      </fieldset>

      {tipo === 'empresa' && (
        <fieldset className="opciones">
          <legend>Tipo de persona</legend>
          <Opcion nombre="personeria" checked={personeria === 'fisica'} onChange={() => setPersoneria('fisica')} titulo="Persona física" detalle="Titular individual" />
          <Opcion nombre="personeria" checked={personeria === 'juridica'} onChange={() => setPersoneria('juridica')} titulo="Persona jurídica" detalle="SA, SRL, cooperativa" />
        </fieldset>
      )}

      <Entrada id="nombre" etiqueta={etiqueta.nombre} value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} type="text" autoComplete={juridica ? 'organization' : 'name'} />
      <Entrada id="dni" etiqueta={etiqueta.dni} value={datos.dni} onChange={cambiar('dni')} error={errores.dni} type="text" inputMode="numeric" autoComplete="off" />
      <Entrada id="fechaNacimiento" etiqueta={etiqueta.fecha} value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} error={errores.fechaNacimiento} type="date" autoComplete={juridica ? 'off' : 'bday'} />
      <Entrada id="email" etiqueta="Correo electrónico (para recuperar tu contraseña)" value={datos.email} onChange={cambiar('email')} error={errores.email} type="email" autoComplete="email" />
      <Entrada id="usuario" etiqueta="Usuario" value={datos.usuario} onChange={cambiar('usuario')} error={errores.usuario} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} />

      <label htmlFor="password">Contraseña</label>
      <div className="campo-pass">
        <input
          id="password"
          type={verPass ? 'text' : 'password'}
          value={datos.password}
          onChange={cambiar('password')}
          autoComplete="new-password"
          aria-invalid={errores.password ? true : undefined}
          aria-describedby={errores.password ? 'password-error' : undefined}
        />
        <button type="button" className="ver" aria-pressed={verPass} onClick={() => setVerPass((v) => !v)}>
          {verPass ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {errores.password && (
        <p id="password-error" className="campo-msg">
          {errores.password}
        </p>
      )}

      <button type="submit" className="principal" disabled={cargando}>
        {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="alterna">
        ¿Ya tenés cuenta? <Link href="/">Ingresar</Link>
      </p>
    </form>
  );
}
