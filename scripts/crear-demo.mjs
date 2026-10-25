// Crea tres usuarios de demostración (postulante, empresa y Municipalidad).
//
//   node --env-file=.env scripts/crear-demo.mjs            (usa la contraseña por defecto)
//   node --env-file=.env scripts/crear-demo.mjs MiClave123  (usa la que indiques)
//
// Son cuentas de prueba con datos ficticios: no usar contraseñas personales.
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SECRET_KEY;
if (!url || !clave) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en el archivo de variables.');
  process.exit(1);
}
const db = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const password = process.argv[2] ?? process.env.DEMO_PASSWORD ?? 'Demo2026!';
if (password.length < 8) {
  console.error('La contraseña tiene que tener al menos 8 caracteres.');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 10);

const cuentas = [
  {
    usuario: 'demo.postulante', tipo: 'persona', nombre: 'Postulante de Demostración', dni: '90000001',
    fecha_nacimiento: '1995-03-15', email: 'demo.postulante@example.com', localidad: 'Funes',
    categorias: ['Comercio', 'Servicios'], ocupacion: 'Atención al público', experiencia: 'Dos años de experiencia en comercio.',
  },
  {
    usuario: 'demo.empresa', tipo: 'empresa', personeria: 'juridica', nombre: 'Empresa de Demostración SRL', dni: '30900000001',
    fecha_nacimiento: '2015-06-01', email: 'demo.empresa@example.com',
  },
  {
    usuario: 'demo.municipalidad', tipo: 'admin', rol_admin: 'superadmin', nombre: 'Municipalidad de Demostración', dni: '90000002',
    fecha_nacimiento: '1985-09-20', email: 'demo.municipalidad@example.com',
  },
];

for (const c of cuentas) {
  const { data: existe } = await db.from('cuentas').select('id').eq('usuario', c.usuario).maybeSingle();
  if (existe) {
    console.log(`= ${c.usuario}: ya existe`);
    continue;
  }
  const { error } = await db.from('cuentas').insert({ ...c, password_hash: hash });
  console.log(error ? `✗ ${c.usuario}: ${error.message}` : `✓ ${c.usuario}: creada`);
}
console.log(`\nUsuarios de demostración (contraseña: ${password})\n  Postulante:     demo.postulante\n  Empresa:        demo.empresa\n  Municipalidad:  demo.municipalidad`);
