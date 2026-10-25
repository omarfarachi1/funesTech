import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verificar } from './lib/token';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const sesion = token ? await verificar(token) : null;
  const { pathname } = req.nextUrl;

  // El panel es privado: sin sesión, se va al ingreso
  if (pathname.startsWith('/panel') && !sesion) {
    return NextResponse.redirect(new URL('/ingresar', req.url));
  }
  // Con sesión iniciada no tiene sentido ver la portada, el ingreso ni el registro
  if ((pathname === '/' || pathname === '/ingresar' || pathname === '/registro') && sesion) {
    return NextResponse.redirect(new URL('/panel', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/ingresar', '/registro', '/panel/:path*'] };
