import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { empresaActual, obtenerOfertaEmpresa } from '../../../../../lib/empresa';
import OfertaForm from '../../OfertaForm';

export const metadata: Metadata = { title: 'Editar oferta · Funestrabajo' };

export default async function EditarOferta({ params }: { params: Promise<{ id: string }> }) {
  const empresa = await empresaActual();
  if (!empresa) redirect('/panel');
  const { id } = await params;
  const o = await obtenerOfertaEmpresa(empresa.id, id);
  if (!o) notFound();

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Editar oferta</h1>
      <p className="sub">{o.titulo}</p>
      <OfertaForm
        modo="editar"
        ofertaId={o.id}
        fotoActual={o.fotoVersion ? `/api/ofertas/${o.id}/foto?v=${encodeURIComponent(o.fotoVersion)}` : null}
        inicial={{
          titulo: o.titulo,
          categoria: o.categoria,
          descripcion: o.descripcion,
          requisitos: o.requisitos.join('\n'),
          localidad: o.localidad,
          horario: o.horario,
        }}
      />
    </main>
  );
}
