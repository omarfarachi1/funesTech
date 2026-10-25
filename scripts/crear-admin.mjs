// Crea el PRIMER superadministrador (los demás se crean desde el panel).
//
//   node --env-file=.env.local scripts/crear-admin.mjs
//
// Pide los datos por pantalla. La contraseña se ve mientras la escribís: ejecutalo en tu
// computadora y limpiá la terminal al terminar (comando: clear).
import { createInterface } from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SECRET_KEY;
if (!url || !clave) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.');
  process.exit(1);
}
const db = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });

const { count } = await db.from('cuentas').select('id', { count: 'exact', head: true }).eq('tipo', 'admin');
if (count && count > 0) {
  console.error(`Ya hay ${count} administrador(es). Los nuevos se crean desde el panel, con un superadministrador.`);
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const nombre = (await rl.question('Nombre y apellido: ')).trim();
const dni = (await rl.question('DNI (solo números): ')).replace(/\D/g, '');
const fecha = (await rl.question('Fecha de nacimiento (AAAA-MM-DD): ')).trim();
const email = (await rl.question('Correo electrónico: ')).trim().toLowerCase();
const usuario = (await rl.question('Usuario (4 a 30 letras, números, . _ -): ')).trim().toLowerCase();
const password = await rl.question('Contraseña (mínimo 8 caracteres): ');
rl.close();

const errores = [];
if (nombre.length < 2) errores.push('El nombre es muy corto.');
if (!/^\d{7,8}$/.test(dni)) errores.push('El DNI tiene que tener 7 u 8 números.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) errores.push('La fecha tiene que ser AAAA-MM-DD.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('El correo no es válido.');
if (!/^[a-z0-9._-]{4,30}$/.test(usuario)) errores.push('El usuario no es válido.');
if (password.length < 8 || password.length > 72) errores.push('La contraseña tiene que tener entre 8 y 72 caracteres.');
if (errores.length) {
  console.error('\n' + errores.join('\n'));
  process.exit(1);
}

const { error } = await db.from('cuentas').insert({
  tipo: 'admin',
  rol_admin: 'superadmin',
  nombre,
  dni,
  fecha_nacimiento: fecha,
  email,
  usuario,
  password_hash: await bcrypt.hash(password, 10),
});
if (error) {
  console.error('\nNo se pudo crear la cuenta:', error.message);
  if (error.message.includes('invalid input value for enum')) {
    console.error('Falta ejecutar supabase-admin-1.sql y supabase-admin-2.sql en Supabase.');
  }
  process.exit(1);
}
console.log(`\nListo. Ya podés ingresar con el usuario "${usuario}".`);
