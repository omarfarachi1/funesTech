import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verificar } from './lib/token';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const sesion = token ? await verificar(token) : null;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/panel') && !sesion) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if ((pathname === '/' || pathname === '/registro') && sesion) {
    return NextResponse.redirect(new URL('/panel', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/registro', '/panel/:path*'] };
