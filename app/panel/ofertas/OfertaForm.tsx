'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIAS, FOTO_OFERTA, validarOferta, type CampoOferta, type DatosOferta, type ErroresOferta } from '../../../lib/oferta';
import { FOTO_CALIDAD, FOTO_ENTRADA_MAX, TIPOS_FOTO } from '../../../lib/foto';
import { recortarJpeg } from '../imagen';

const ORDEN: CampoOferta[] = ['titulo', 'categoria', 'descripcion', 'requisitos', 'localidad', 'horario'];

export default function OfertaForm({
  modo,
  ofertaId,
  inicial,
  fotoActual,
  api = '/api/empresa/ofertas',
  volver = '/panel',
  conEmpresa = false,
  empresaInicial = '',
  empresas = [],
  empresaIdInicial = '',
}: {
  modo: 'crear' | 'editar';
  ofertaId?: string;
  inicial: DatosOferta;
  fotoActual: string | null;
  api?: string;
  volver?: string;
  conEmpresa?: boolean;
  empresaInicial?: string;
  empresas?: { id: string; nombre: string }[];
  empresaIdInicial?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [datos, setDatos] = useState<DatosOferta>(inicial);
  const [errores, setErrores] = useState<ErroresOferta>({});
  const [general, setGeneral] = useState('');
  const [cargando, setCargando] = useState(false);
  const [nueva, setNueva] = useState<{ blob: Blob; url: string } | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [empresa, setEmpresa] = useState(empresaInicial);
  const [empresaId, setEmpresaId] = useState(empresaIdInicial);

  useEffect(() => () => { if (nueva) URL.revokeObjectURL(nueva.url); }, [nueva]);

  const vista = nueva?.url ?? (quitar ? null : fotoActual);
  const opciones: string[] = [...CATEGORIAS];
  if (inicial.categoria && !opciones.includes(inicial.categoria)) opciones.unshift(inicial.categoria);

  const cambiar = (campo: CampoOferta) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDatos({ ...datos, [campo]: e.target.value });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };
  const props = (campo: CampoOferta) => ({
    id: campo,
    value: datos[campo],
    onChange: cambiar(campo),
    'aria-invalid': errores[campo] ? (true as const) : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  });
  const mensaje = (campo: CampoOferta | 'foto' | 'empresa') =>
    errores[campo] && (
      <p id={`${campo}-error`} className="campo-msg">
        {errores[campo]}
      </p>
    );

  function enfocar(errs: ErroresOferta) {
    const primero = errs.empresa ? 'empresa' : ORDEN.find((c) => errs[c]);
    if (primero) document.getElementById(primero)?.focus();
  }

  async function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type)) return setErrores({ ...errores, foto: 'Elegí una imagen JPG, PNG o WebP.' });
    if (archivo.size > FOTO_ENTRADA_MAX) return setErrores({ ...errores, foto: 'La imagen supera los 10 MB.' });
    try {
      const blob = await recortarJpeg(archivo, FOTO_OFERTA.ancho, FOTO_OFERTA.alto, FOTO_CALIDAD);
      setNueva({ blob, url: URL.createObjectURL(blob) });
      setQuitar(false);
      setErrores({ ...errores, foto: undefined });
    } catch {
      setErrores({ ...errores, foto: 'No pudimos leer esa imagen. Probá con otra.' });
    }
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral('');
    const errs = validarOferta(datos);
    if (conEmpresa && !empresaId && empresa.trim().length < 2) errs.empresa = 'Ingresá el nombre de la empresa.';
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      enfocar(errs);
      return;
    }
    setErrores({});
    setCargando(true);
    try {
      const form = new FormData();
      ORDEN.forEach((k) => form.append(k, datos[k]));
      if (conEmpresa) {
        form.append('empresa', empresa);
        form.append('empresaId', empresaId);
      }
      if (nueva) form.append('foto', nueva.blob, 'foto.jpg');
      else if (quitar) form.append('quitarFoto', '1');
      const r = await fetch(modo === 'crear' ? api : `${api}/${ofertaId}`, {
        method: modo === 'crear' ? 'POST' : 'PUT',
        body: form,
      });
      const data: { errores?: ErroresOferta; error?: string } = await r.json().catch(() => ({}));
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
      router.push(volver);
      router.refresh();
    } catch {
      setGeneral('No hay conexión con el servidor. Intentá de nuevo.');
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {general && (
        <p className="error" role="alert">
          {general}
        </p>
      )}

      <section className="bloque" aria-labelledby="t-foto-oferta">
        <h2 id="t-foto-oferta">Foto en miniatura (opcional)</h2>
        <div className="foto-bloque">
          <div className="foto-oferta">
            {vista ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vista} alt="Vista previa de la miniatura" />
            ) : (
              <span>Sin foto</span>
            )}
          </div>
          <div>
            <input ref={input} type="file" hidden accept={TIPOS_FOTO.join(',')} onChange={elegirFoto} />
            <div className="acciones">
              <button type="button" className="btn btn-sec" onClick={() => input.current?.click()} disabled={cargando}>
                {vista ? 'Cambiar foto' : 'Elegir foto'}
              </button>
              {vista && (
                <button
                  type="button"
                  className="btn btn-sec"
                  onClick={() => { setNueva(null); setQuitar(true); }}
                  disabled={cargando}
                >
                  Quitar foto
                </button>
              )}
            </div>
            <p className="meta">JPG, PNG o WebP. Se recorta en formato 4:3 automáticamente.</p>
            {mensaje('foto')}
          </div>
        </div>
      </section>

      <section className="bloque" aria-labelledby="t-datos-oferta">
        <h2 id="t-datos-oferta">Datos de la oferta</h2>
        <div className="rejilla">
          {conEmpresa && (
            <div className="ancho">
              <label htmlFor="empresa">Empresa que ofrece el puesto</label>
              <input
                id="empresa"
                type="text"
                maxLength={100}
                value={empresa}
                onChange={(e) => {
                  setEmpresa(e.target.value);
                  if (errores.empresa) setErrores({ ...errores, empresa: undefined });
                }}
                aria-invalid={errores.empresa ? true : undefined}
                aria-describedby={errores.empresa ? 'empresa-error' : undefined}
              />
              {mensaje('empresa')}
            </div>
          )}
          {conEmpresa && empresas.length > 0 && (
            <div className="ancho">
              <label htmlFor="empresaId">Empresa registrada (opcional)</label>
              <select id="empresaId" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} aria-describedby="empresaId-ayuda">
                <option value="">Sin empresa registrada</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
              <p id="empresaId-ayuda" className="meta">
                Si la oferta es de una empresa registrada, ella verá a los candidatos que la Municipalidad le derive. En ese caso se usa su nombre.
              </p>
            </div>
          )}
          <div className="ancho">
            <label htmlFor="titulo">Título del puesto</label>
            <input type="text" maxLength={120} {...props('titulo')} />
            {mensaje('titulo')}
          </div>
          <div>
            <label htmlFor="categoria">Área</label>
            <select {...props('categoria')}>
              <option value="">Elegí un área</option>
              {opciones.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {mensaje('categoria')}
          </div>
          <div>
            <label htmlFor="localidad">Localidad</label>
            <input type="text" maxLength={80} {...props('localidad')} />
            {mensaje('localidad')}
          </div>
          <div className="ancho">
            <label htmlFor="descripcion">Descripción</label>
            <textarea rows={5} maxLength={1500} {...props('descripcion')} />
            <p className="contador">{datos.descripcion.length}/1500</p>
            {mensaje('descripcion')}
          </div>
          <div className="ancho">
            <label htmlFor="requisitos">Requisitos (uno por línea)</label>
            <textarea rows={4} placeholder={'Experiencia comprobable\nCarnet de conducir B1'} {...props('requisitos')} />
            {mensaje('requisitos')}
          </div>
          <div className="ancho">
            <label htmlFor="horario">Horario (opcional)</label>
            <input type="text" maxLength={120} placeholder="Ej: De 8 a 17 hs, de lunes a viernes" {...props('horario')} />
            {mensaje('horario')}
          </div>
        </div>
      </section>

      <div className="acciones">
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Guardando…' : modo === 'crear' ? 'Publicar oferta' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn btn-sec" onClick={() => router.push(volver)} disabled={cargando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
