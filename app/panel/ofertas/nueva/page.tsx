import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { empresaActual } from '../../../../lib/empresa';
import OfertaForm from '../OfertaForm';

export const metadata: Metadata = { title: 'Publicar oferta · Funestrabajo' };

export default async function NuevaOferta() {
  const empresa = await empresaActual();
  if (!empresa) redirect('/panel');
  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Publicar oferta</h1>
      <p className="sub">Completá los datos del puesto. La Municipalidad la revisa y, una vez aprobada, se publica en la portada.</p>
      <OfertaForm
        modo="crear"
        fotoActual={null}
        inicial={{ titulo: '', categoria: '', descripcion: '', requisitos: '', localidad: 'Funes, Santa Fe', horario: '' }}
      />
    </main>
  );
}
