import type { Metadata } from 'next';
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google';
import './globals.css';

const titulo = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--fuente-titulo',
});
const texto = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fuente-texto',
});

export const metadata: Metadata = {
  title: 'Funestrabajo · Municipalidad de Funes',
  description: 'La bolsa de empleo de la ciudad de Funes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${titulo.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
