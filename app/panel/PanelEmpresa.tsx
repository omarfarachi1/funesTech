import Link from 'next/link';
import { empresaActual, listarOfertasEmpresa, type OfertaEmpresa } from '../../lib/empresa';
import TarjetaOferta from '../TarjetaOferta';
import AccionesOferta from './AccionesOferta';

const etiqueta = (o: OfertaEmpresa): [string, string] =>
  o.estadoRevision === 'pendiente'
    ? ['En revisión', 'badge badge-en_revision']
    : o.estadoRevision === 'rechazada'
      ? ['Rechazada', 'badge badge-no_seleccionada']
      : o.activa
        ? ['Publicada', 'badge badge-preseleccionada']
        : ['Cerrada', 'badge'];

export default async function PanelEmpresa() {
  const empresa = await empresaActual();
  if (!empresa) {
    return (
      <main className="contenedor contenedor-angosto">
        <p className="vacio">No encontramos tu cuenta. Cerrá sesión y volvé a ingresar.</p>
      </main>
    );
  }
  const ofertas = await listarOfertasEmpresa(empresa.id);

  return (
    <main className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1 className="titulo">Mis ofertas</h1>
          <p className="sub">
            {ofertas.length === 1 ? '1 oferta enviada' : `${ofertas.length} ofertas enviadas`} por {empresa.nombre}
          </p>
        </div>
        <Link className="btn" href="/panel/ofertas/nueva">
          Publicar oferta
        </Link>
      </div>

      {empresa.personeria === 'juridica' && empresa.verificacion !== 'verificada' && (
        <p className="aviso">
          {empresa.verificacion === 'sin_enviar' &&
            'Podés subir la documentación de tu empresa para que la Municipalidad la verifique. Es obligatorio. '}
          {empresa.verificacion === 'en_revision' && 'La Municipalidad está revisando la documentación de tu empresa. '}
          {empresa.verificacion === 'observada' &&
            `La Municipalidad dejó observaciones sobre tu documentación${empresa.verificacionNota ? `: ${empresa.verificacionNota}` : ''}. `}
          <Link href="/panel/empresa#documentacion">Ver documentación</Link>
        </p>
      )}

      {ofertas.length === 0 ? (
        <p className="vacio">
          Todavía no enviaste ninguna oferta. <Link href="/panel/ofertas/nueva">Enviá la primera</Link>. La Municipalidad la revisa antes de publicarla.
        </p>
      ) : (
        <ul className="lista">
          {ofertas.map((o) => {
            const [texto, clase] = etiqueta(o);
            return (
              <TarjetaOferta
                key={o.id}
                o={o}
                insignia={<span className={clase}>{texto}</span>}
                accion={
                  <div>
                    {o.estadoRevision === 'pendiente' && (
                      <p className="meta">La Municipalidad está revisando esta oferta. Todavía no se ve en la portada.</p>
                    )}
                    {o.estadoRevision === 'rechazada' && (
                      <p className="error">
                        Rechazada{o.motivoRechazo ? `: ${o.motivoRechazo}` : ''}. Editá la oferta para volver a enviarla a revisión.
                      </p>
                    )}
                    <div className="acciones acciones-oferta">
                      {o.estadoRevision === 'aprobada' && (
                        <Link className="btn" href={`/panel/ofertas/${o.id}/postulantes`}>
                          Ver postulantes ({o.postulantes})
                        </Link>
                      )}
                      <Link className="btn btn-sec" href={`/panel/ofertas/${o.id}/editar`}>
                        Editar
                      </Link>
                      {o.estadoRevision === 'aprobada' && <AccionesOferta id={o.id} activa={o.activa} />}
                    </div>
                  </div>
                }
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
