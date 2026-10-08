import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './supabase';
import { buscarPorEmail } from './cuentas';
import { enviarCorreo } from './correo';

const VIGENCIA_MIN = 30; // el enlace vence a los 30 minutos
const MAX_POR_HORA = 3; // pedidos por cuenta

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const esc = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// La dirección base sale de APP_URL (no del encabezado de la petición) para que nadie pueda falsificar el enlace.
function baseUrl() {
  const u = process.env.APP_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  if (!u) throw new Error('Falta APP_URL en las variables de entorno.');
  return u.replace(/\/$/, '');
}

// Si el correo existe, genera el enlace y lo envía. Si no existe, no hace nada (y no lo revela).
export async function solicitarRecuperacion(email: string) {
  const cuenta = await buscarPorEmail(email);
  if (!cuenta) return;

  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await db()
    .from('recuperaciones')
    .select('id', { count: 'exact', head: true })
    .eq('cuenta_id', cuenta.id)
    .gte('creada_en', desde);
  if (error) throw new Error(error.message);
  if ((count ?? 0) >= MAX_POR_HORA) return;

  const token = randomBytes(32).toString('base64url');
  const { error: e2 } = await db().from('recuperaciones').insert({
    cuenta_id: cuenta.id,
    token_hash: hash(token),
    expira_en: new Date(Date.now() + VIGENCIA_MIN * 60 * 1000).toISOString(),
  });
  if (e2) throw new Error(e2.message);

  const enlace = `${baseUrl()}/restablecer?token=${token}`;
  const texto =
    `Hola ${cuenta.nombre}:\n\n` +
    `Recibimos un pedido para crear una nueva contraseña en Funestrabajo.\n` +
    `Para continuar, entrá a este enlace (vale por ${VIGENCIA_MIN} minutos):\n\n${enlace}\n\n` +
    `Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.\n\n` +
    `Gobierno de la Ciudad de Funes`;
  const html =
    `<p>Hola ${esc(cuenta.nombre)}:</p>` +
    `<p>Recibimos un pedido para crear una nueva contraseña en <strong>Funestrabajo</strong>.</p>` +
    `<p><a href="${enlace}" style="display:inline-block;padding:10px 18px;background:#0b4839;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p>` +
    `<p>El enlace vale por ${VIGENCIA_MIN} minutos. Si el botón no funciona, copiá esta dirección en tu navegador:<br>${enlace}</p>` +
    `<p>Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.</p>` +
    `<p>Gobierno de la Ciudad de Funes</p>`;
  await enviarCorreo(cuenta.email, 'Recuperá tu contraseña · Funestrabajo', texto, html);
}

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export async function tokenValido(token: string): Promise<boolean> {
  if (!FORMATO_TOKEN.test(token)) return false;
  const { data, error } = await db()
    .from('recuperaciones')
    .select('id')
    .eq('token_hash', hash(token))
    .is('usada_en', null)
    .gt('expira_en', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

// Usa el enlace (una sola vez) y cambia la contraseña. Devuelve false si el enlace no sirve.
export async function restablecer(token: string, password: string): Promise<boolean> {
  if (!FORMATO_TOKEN.test(token)) return false;
  const ahora = new Date().toISOString();
  // Un único UPDATE marca el enlace como usado: si dos personas lo usan a la vez, solo una pasa.
  const { data, error } = await db()
    .from('recuperaciones')
    .update({ usada_en: ahora })
    .eq('token_hash', hash(token))
    .is('usada_en', null)
    .gt('expira_en', ahora)
    .select('cuenta_id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return false;

  const { error: e2 } = await db()
    .from('cuentas')
    .update({ password_hash: await bcrypt.hash(password, 10) })
    .eq('id', data.cuenta_id);
  if (e2) throw new Error(e2.message);

  // Anula cualquier otro enlace pendiente de esa cuenta
  await db().from('recuperaciones').update({ usada_en: ahora }).eq('cuenta_id', data.cuenta_id).is('usada_en', null);
  return true;
}
