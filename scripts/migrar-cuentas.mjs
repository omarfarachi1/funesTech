// Pasa las cuentas de data/cuentas.json a la tabla "cuentas" de Supabase.
//
//   Probar sin guardar nada:  node --env-file=.env.local scripts/migrar-cuentas.mjs --simular
//   Migrar de verdad:         node --env-file=.env.local scripts/migrar-cuentas.mjs
//
// Se puede ejecutar más de una vez: las cuentas que ya están en Supabase se omiten.
// Las contraseñas ya están cifradas, así que cada persona sigue usando la suya.
import { existsSync, readFileSync } from 'node:fs';

const simular = process.argv.includes('--simular');
const ARCHIVO = 'data/cuentas.json';

if (!existsSync(ARCHIVO)) {
  console.error(`No encuentro ${ARCHIVO}. Ejecutá el comando desde la carpeta del proyecto.`);
  process.exit(1);
}
let cuentas;
try {
  cuentas = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
} catch {
  console.error(`${ARCHIVO} no tiene un JSON válido.`);
  process.exit(1);
}
if (!Array.isArray(cuentas)) {
  console.error(`${ARCHIVO} tiene que contener una lista de cuentas.`);
  process.exit(1);
}

let db = null;
if (!simular) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  db = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

const r = { migradas: 0, existentes: 0, omitidas: 0, errores: 0 };

for (const c of cuentas) {
  const nombre = String(c.usuario ?? '(sin usuario)');
  const fila = {
    id: c.id,
    tipo: c.tipo,
    personeria: c.tipo === 'empresa' ? (c.personeria ?? null) : null,
    nombre: c.nombre,
    dni: c.dni,
    fecha_nacimiento: c.fechaNacimiento,
    usuario: String(c.usuario ?? '').trim().toLowerCase(),
    password_hash: c.hash,
    creada_en: c.creada,
  };

  if (!fila.usuario || !['persona', 'empresa'].includes(fila.tipo) || !fila.nombre || !fila.dni || !fila.fecha_nacimiento || !fila.password_hash) {
    console.log(`✗ ${nombre}: faltan datos, se omite`);
    r.omitidas++;
    continue;
  }
  if (simular) {
    console.log(`• ${nombre} (${fila.tipo}): se migraría`);
    r.migradas++;
    continue;
  }

  const { error } = await db.from('cuentas').insert(fila);
  if (!error) {
    console.log(`✓ ${nombre}: migrada`);
    r.migradas++;
  } else if (error.code === '23505') {
    console.log(`= ${nombre}: ya existe en Supabase, se omite`);
    r.existentes++;
  } else {
    console.log(`✗ ${nombre}: ${error.message}`);
    r.errores++;
  }
}

console.log(
  `\n${simular ? 'SIMULACIÓN (no se guardó nada). ' : ''}Resumen: ${r.migradas} ${simular ? 'a migrar' : 'migradas'}, ${r.existentes} ya existentes, ${r.omitidas} omitidas, ${r.errores} con error.`
);
if (!simular && r.migradas > 0) console.log('Estas cuentas no tienen correo: que lo agreguen en Mi perfil para poder recuperar su contraseña.');
