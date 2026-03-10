import '@/lib/i18n';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DictionaryProvider } from '@/context/DictionaryProvider';
import { getDictionary } from '@/lib/get-dictionary';
import { LocaleProvider } from '@/context/LocaleProvider';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeProvider';
// import { AppSidebar } from '@/components/app-sidebar';
// import Footer from '@/components/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import 'reactflow/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import Header from '@/components/Header';
import logoFavicon from '@images/favicon.ico';
import ParallaxHome from '@/components/parallaxHome';
// import homeLoadingJson from '@images/Lottie/homeLoadingBar.json';
// import Lottie from 'react-lottie';
// # scss file import
// import 'react-image-gallery/styles/scss/image-gallery.scss';

// # css file import
import 'react-image-gallery/styles/css/image-gallery.css';

// # js file import (using webpack)
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
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const dict = await getDictionary(locale as 'en' | 'vi');
  //

  return (
    <html lang={locale} suppressHydrationWarning>
      <ReactFlowProvider>
        <DictionaryProvider dict={dict}>
          <LocaleProvider locale={locale as 'en' | 'vi'}>
            <body suppressHydrationWarning className={inter.className}>
              <TooltipProvider delayDuration={100}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  <ParallaxHome />
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
              </TooltipProvider>
            </body>
          </LocaleProvider>
        </DictionaryProvider>
      </ReactFlowProvider>
    </html>
  );
}
