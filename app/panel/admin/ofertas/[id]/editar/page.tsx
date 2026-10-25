import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { adminActual, listarEmpresas, obtenerOfertaAdmin } from '../../../../../../lib/admin';
import { puedeEscribir } from '../../../../../../lib/roles';
import OfertaForm from '../../../../ofertas/OfertaForm';

export const metadata: Metadata = { title: 'Editar oferta · Administración' };

export default async function EditarOfertaAdmin({ params }: { params: Promise<{ id: string }> }) {
  const admin = await adminActual();
  if (!admin || !puedeEscribir(admin.rol, 'ofertas')) redirect('/panel/admin/ofertas');
  const { id } = await params;
  const o = await obtenerOfertaAdmin(id);
  if (!o) notFound();
  const empresas = await listarEmpresas();

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Editar oferta</h1>
      <p className="sub">{o.titulo}</p>
      <OfertaForm
        modo="editar"
        ofertaId={o.id}
        api="/api/admin/ofertas"
        volver="/panel/admin/ofertas"
        conEmpresa
        empresaInicial={o.empresa}
        empresas={empresas}
        empresaIdInicial={o.empresaId ?? ''}
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
