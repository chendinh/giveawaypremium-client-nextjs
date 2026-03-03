import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { i18n } from '../next-i18next.config.mjs';
// import LanguageDetector from 'i18next-browser-languagedetector';

// Lấy locale từ URL
// function getLocaleFromPath(pathname: string) {
//   // const pathLocale = pathname.split('/')[1];
//   // return i18n.locales.includes(pathLocale) ? pathLocale : null;
// }

// // Detect locale từ trình duyệt
// function getLocaleFromHeader(request: NextRequest) {
//   // const acceptLang = request.headers.get('accept-language');
//   // if (!acceptLang) return null;
//   // // ví dụ: "vi,en;q=0.9"
//   // const langs = acceptLang.split(',').map(l => l.split(';')[0]);
//   // return langs.find(lang => i18n.locales.includes(lang)) || null;
// }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // If already has locale, do nothing
  if (pathname.startsWith('/trang-chu')) {
    return NextResponse.next();
  }
  // If at root, redirect to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/trang-chu', request.url)); // Change 'en' to your default locale
  }
  return NextResponse.next();
}

// export async function middleware(request: NextRequest) {
// const { pathname } = request.nextUrl;
// // Nếu URL đã có locale (/en, /vi) thì không redirect
// const pathnameLocale = getLocaleFromPath(pathname);
// if (pathnameLocale) return NextResponse.next();
// // Nếu vào root "/" thì detect
// if (pathname === '/') {
//   const detector = new LanguageDetector();
//   const language = await detector.detect();
//   const detectedLocale =
//     getLocaleFromHeader(request) || i18n.defaultLocale || language || 'en';
//   return NextResponse.redirect(new URL(`/${detectedLocale}`, request.url));
// }
// return NextResponse.next();
// }

export const config = {
  // Chạy middleware cho tất cả path trừ static files & api
  matcher: ['/((?!_next|api|favicon.ico|assets).*)'],
};
