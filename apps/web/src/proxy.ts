import { NextRequest, NextResponse } from 'next/server';
import { preferredLocale } from './shared/lib/locale-routing';
export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.'))
        return NextResponse.next();
    const first = path.split('/')[1];
    if (first === 'en' || first === 'uk') {
        const response = NextResponse.next();
        response.cookies.set('fp-locale', first, { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
        return response;
    }
    const locale = preferredLocale(request.headers.get('accept-language') ?? '', request.cookies.get('fp-locale')?.value);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${path === '/' ? '' : path}`;
    return NextResponse.redirect(url);
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)'] };
