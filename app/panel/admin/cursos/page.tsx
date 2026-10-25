import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminActual, historialCursos, listarCursos } from '../../../../lib/admin';
import { puedeEscribir } from '../../../../lib/roles';
import { fechaLarga } from '../../../../lib/formato';
import CursoForm from './CursoForm';

export const metadata: Metadata = { title: 'Cursos · Municipalidad' };

export default async function Cursos() {
  const admin = await adminActual();
  if (!admin) redirect('/panel');
  const escribir = puedeEscribir(admin.rol, 'candidatos');
  const [cursos, historial] = await Promise.all([listarCursos(), historialCursos(50)]);

  return (
    <main className="contenedor contenedor-medio">
      <h1 className="titulo">Cursos de capacitación</h1>
      <p className="sub">Registro de los cursos y de las derivaciones de postulantes. Para derivar a alguien, abrí su seguimiento desde Candidatos.</p>

      {escribir && (
        <section className="bloque" aria-labelledby="t-nuevo">
          <h2 id="t-nuevo">Nuevo curso</h2>
          <CursoForm />
        </section>
      )}

      <section className="bloque" aria-labelledby="t-lista">
        <h2 id="t-lista">Cursos cargados ({cursos.length})</h2>
        {cursos.length === 0 ? (
          <p className="meta">Todavía no hay cursos.</p>
        ) : (
          <ul className="requisitos">
            {cursos.map((c) => (
              <li key={c.id}>
                <strong>{c.nombre}</strong>
                {c.descripcion && ` · ${c.descripcion}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="titulo titulo-pasos">Historial de derivaciones</h2>
      {historial.length === 0 ? (
        <p className="vacio">Todavía no se derivó a nadie a un curso.</p>
      ) : (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Postulante</th>
                <th>Curso</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td>{fechaLarga(h.fecha)}</td>
                  <td>
                    <Link href={`/panel/admin/candidatos/${h.candidatoId}`}>{h.candidato}</Link>
                  </td>
                  <td>{h.curso}</td>
                  <td>{h.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
