'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SEGUNDOS = 3; // duración de la cuenta regresiva

// Cierra la sesión (de cualquier tipo de cuenta) y muestra un aviso con cuenta regresiva
// antes de volver a la pantalla principal.
export default function BotonSalir({ className = 'principal' }: { className?: string }) {
  const [cerrando, setCerrando] = useState(false);
  const [restan, setRestan] = useState(SEGUNDOS);
  const [error, setError] = useState('');
  const botonIr = useRef<HTMLButtonElement>(null);

  // Recarga completa: así no queda ningún dato del panel en la memoria del navegador
  const irAlInicio = () => {
    window.location.href = '/';
  };

  async function salir() {
    setError('');
    try {
      // La sesión se cierra en el servidor enseguida; la cuenta regresiva es solo para volver al inicio
      const r = await fetch('/api/logout', { method: 'POST' });
      if (!r.ok) throw new Error();
      setRestan(SEGUNDOS);
      setCerrando(true);
    } catch {
      setError('No pudimos cerrar la sesión. Intentá de nuevo.');
    }
  }

  // Cuenta regresiva: 3, 2, 1 y vuelve al inicio
  useEffect(() => {
    if (!cerrando) return;
    const t = setTimeout(() => {
      if (restan <= 1) window.location.href = '/';
      else setRestan(restan - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [cerrando, restan]);

  useEffect(() => {
    if (cerrando) botonIr.current?.focus();
  }, [cerrando]);

  // El aviso de error se quita solo a los 5 segundos
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <>
      <button className={className} onClick={salir} disabled={cerrando}>
        Cerrar sesión
      </button>

      {/* Se dibuja en el <body> para que cubra toda la pantalla, aunque el botón esté dentro de un menú */}
      {cerrando &&
        createPortal(
          <div className="cierre" role="alertdialog" aria-modal="true" aria-labelledby="cierre-titulo" aria-describedby="cierre-desc">
            <div className="cierre-contenido">
              <div className="cierre-reloj" aria-hidden="true">
                <span className="cierre-anillo" />
                <span className="cierre-numero">{restan}</span>
              </div>
              <h2 id="cierre-titulo">Cerrando sesión</h2>
              <p id="cierre-desc">Volvés a la pantalla principal en {restan} {restan === 1 ? 'segundo' : 'segundos'}…</p>
              <button ref={botonIr} type="button" className="cierre-ir" onClick={irAlInicio}>
                Ir ahora
              </button>
            </div>
          </div>,
          document.body
        )}

      {error &&
        createPortal(
          <div className="aviso-flotante" role="alert">
            {error}
          </div>,
          document.body
        )}
    </>
  );
}
