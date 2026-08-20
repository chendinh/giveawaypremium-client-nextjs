import '@/lib/i18n';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { DictionaryProvider } from '@/context/DictionaryProvider';
import { getDictionary, DEFAULT_LOCALE } from '@/lib/get-dictionary';
import { LocaleProvider } from '@/context/LocaleProvider';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeProvider';
// import { AppSidebar } from '@/components/app-sidebar';
// import Footer from '@/components/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import 'reactflow/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import Header from '@/components/Header';
import { UpdateNotification } from '@/components/UpdateNotification';
import InitLoader from '@/components/InitLoader';
import logoFavicon from '@images/favicon.ico';
import ParallaxHome from '@/components/parallaxHome';
// import homeLoadingJson from '@images/Lottie/homeLoadingBar.json';
// import Lottie from 'react-lottie';
// # scss file import
// import 'react-image-gallery/styles/scss/image-gallery.scss';

// # css file import
import 'react-image-gallery/styles/css/image-gallery.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GiveAwayPremium',
  description: 'GiveAwayPremium',
  icons: {
    icon: [logoFavicon.src],
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = DEFAULT_LOCALE;
  const dict = await getDictionary(locale);
  //

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Inline loader: hiển thị ngay từ byte HTML đầu tiên, trước khi JS load */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #gap-init-loader {
                position: fixed; inset: 0; z-index: 9999;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                background: #fff;
                transition: opacity 650ms ease-in-out;
              }
              #gap-init-loader.exiting { opacity: 0; pointer-events: none; }
              #gap-init-loader-bar-track {
                position: absolute; bottom: 15%;
                left: 50%; transform: translateX(-50%);
                width: 160px; height: 1px;
                background: #e5e7eb; border-radius: 9999px; overflow: hidden;
              }
              #gap-init-loader-bar {
                height: 100%; width: 0%; background: #000;
                border-radius: 9999px;
                transition: width 35ms linear;
              }
              #gap-init-loader-logo {
                display: flex; flex-direction: column;
                align-items: center; gap: 16px;
                opacity: 0; transform: scale(0.95) translateY(12px);
                transition: opacity 700ms ease-out, transform 700ms ease-out;
              }
              #gap-init-loader-logo.visible {
                opacity: 1; transform: scale(1) translateY(0);
              }
              #gap-init-loader-logo img { display: block; }
              #gap-init-loader-premium {
                font-size: 11px; letter-spacing: 0.35em;
                color: #FFD700; text-transform: uppercase;
                font-family: sans-serif;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (sessionStorage.getItem('gap_loaded')) return;
                } catch(e) { return; }

                var el = document.createElement('div');
                el.id = 'gap-init-loader';
                el.innerHTML = '<div id="gap-init-loader-logo">'
                  + '<img src="/images/Icon/logoHeaderWhite.svg" alt="GiveAway Premium" width="48" height="48" style="width:48px;height:48px" />'
                  + '<img src="/images/Icon/giveawayTextBlack.svg" alt="GIVEAWAY" width="120" height="18" style="width:112px;height:auto;opacity:0.8" />'
                  + '<p id="gap-init-loader-premium">Premium</p>'
                  + '</div>'
                  + '<div id="gap-init-loader-bar-track"><div id="gap-init-loader-bar"></div></div>';

                document.documentElement.appendChild(el);

                // Logo fade in after 120ms
                setTimeout(function() {
                  var logo = document.getElementById('gap-init-loader-logo');
                  if (logo) logo.classList.add('visible');
                }, 120);

                // Progress bar 0→100 in ~1.4s
                var progress = 0;
                var bar = null;
                var iv = setInterval(function() {
                  progress += 2.5;
                  if (progress >= 100) { progress = 100; clearInterval(iv); }
                  bar = bar || document.getElementById('gap-init-loader-bar');
                  if (bar) bar.style.width = progress + '%';
                }, 35);

                window.__gapRemoveInitLoader = function() {
                  var loader = document.getElementById('gap-init-loader');
                  if (!loader) return;
                  loader.classList.add('exiting');
                  setTimeout(function() { loader.parentNode && loader.parentNode.removeChild(loader); }, 700);
                };
              })();
            `,
          }}
        />
      </head>
      <ReactFlowProvider>
        <DictionaryProvider dict={dict}>
          <LocaleProvider locale={locale}>
            <body suppressHydrationWarning className={inter.className}>
              <TooltipProvider delayDuration={100}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  <ParallaxHome />
                  <InitLoader />
                  <Header />
                  <div className="!z-99 flex min-h-[calc(100vh-97px)]">
                    {/* <AppSidebar locale={locale} /> */}

                    <main className="relative w-full flex justify-center align-top">
                      {children}
                    </main>
                  </div>
                  {/* <Footer /> */}
                </ThemeProvider>
                <Toaster position="bottom-right" />
                <UpdateNotification />
              </TooltipProvider>
              <SpeedInsights />
              <Analytics />
            </body>
          </LocaleProvider>
        </DictionaryProvider>
      </ReactFlowProvider>
    </html>
  );
}
