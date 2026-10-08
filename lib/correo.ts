import nodemailer from 'nodemailer';

// Envía un correo por SMTP. Sin SMTP_HOST en desarrollo, el mensaje se muestra en la terminal.
export async function enviarCorreo(para: string, asunto: string, texto: string, html: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Falta configurar el correo: definí SMTP_HOST en las variables de entorno.');
    }
    console.log(`\n[correo simulado]\nPara: ${para}\nAsunto: ${asunto}\n\n${texto}\n`);
    return;
  }
  const puerto = Number(process.env.SMTP_PORT ?? 587);
  const transporte = nodemailer.createTransport({
    host,
    port: puerto,
    secure: puerto === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporte.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
    html,
  });
}
