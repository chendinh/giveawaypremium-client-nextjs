'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Instagram, Facebook } from 'lucide-react';
import Lottie from 'react-lottie';
import rightArrowJson from '../../../../../public/images/Lottie/rightArrow.json';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────────────────────

const slides = [
  { title: 'VỀ CHÚNG TÔI', route: '/gioi-thieu' },
  { title: 'KÝ GỬI', route: '/ky-gui' },
  { title: 'MUA SẮM', route: '/mua-sam' },
];

const MARQUEE_IMAGES = [
  '/images/Store/store2.jpg',
  '/images/Store/store4.jpg',
  '/images/Store/store6.jpg',
  '/images/Store/store8.jpg',
  '/images/Store/store10.jpg',
  '/images/Store/store12.jpg',
  '/images/Store/store15.jpg',
  '/images/Store/store17.jpg',
  '/images/Store/store20.jpg',
  '/images/Store/store24.jpg',
  '/images/Store/store26.jpg',
  '/images/Store/store28.jpg',
];

const lottieOptions = {
  loop: true,
  autoplay: true,
  animationData: rightArrowJson,
  rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
};

// ─── Grapheme split ────────────────────────────────────────────────────────────

function splitGraphemes(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seg = new (Intl as any).Segmenter('vi', {
        granularity: 'grapheme',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.from(seg.segment(str) as Iterable<any>).map(
        (s: any) => s.segment as string
      );
    } catch {
      /* fallback */
    }
  }
  return Array.from(str);
}

function useLetterReveal(text: string, trigger: boolean, baseDelay = 0) {
  const chars = splitGraphemes(text);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array(chars.length).fill(false)
  );

  useEffect(() => {
    if (!trigger) {
      setRevealed(Array(chars.length).fill(false));
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    chars.forEach((_, i) => {
      timers.push(
        setTimeout(
          () =>
            setRevealed(prev => {
              const n = [...prev];
              n[i] = true;
              return n;
            }),
          baseDelay + i * 90
        )
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text, baseDelay]);

  return { chars, revealed };
}

// ─── RevealText ───────────────────────────────────────────────────────────────

function RevealText({
  text,
  active,
  delay = 0,
  className,
  onClick,
}: {
  text: string;
  active: boolean;
  delay?: number;
  className?: string;
  onClick?: () => void;
}) {
  const { chars, revealed } = useLetterReveal(text, active, delay);
  return (
    <span
      className={cn('cursor-pointer select-none', className)}
      onClick={onClick}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            paddingTop: '0.15em',
            paddingBottom: '0.05em',
            marginTop: '-0.15em',
            verticalAlign: 'bottom',
            lineHeight: 1.15,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: revealed[i] ? 'translateY(0)' : 'translateY(115%)',
              transition: 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
}

// ─── MarqueeStrip ─────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = [...MARQUEE_IMAGES, ...MARQUEE_IMAGES];
  return (
    <div className="w-full overflow-hidden">
      <div className="marquee-track">
        {items.map((src, i) => (
          <div
            key={i}
            className="relative mx-1 h-16 w-24 flex-shrink-0 overflow-hidden rounded-sm grayscale hover:grayscale-0 transition-all duration-500"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
              priority={i < 3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeCarousel() {
  const router = useRouter();

  // Animation vào — trigger ngay sau mount
  const [pageReady, setPageReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [slideActive, setSlideActive] = useState(false);

  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPageReady(true), 16);
    const t2 = setTimeout(() => setSlideActive(true), 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setSlideActive(false);
    setTimeout(() => {
      setCurrentSlide(idx);
      setSlideActive(true);
    }, 400);
  }, []);

  useEffect(() => {
    if (!pageReady) return;
    autoRef.current = setInterval(
      () => goToSlide((currentSlide + 1) % slides.length),
      4500
    );
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [currentSlide, goToSlide, pageReady]);

  const handleNavigate = (route: string) => {
    setIsExiting(true);
    if (autoRef.current) clearInterval(autoRef.current);
    // Đợi exit animation xong (~500ms) rồi mới chuyển trang
    setTimeout(() => router.push(route), 320);
  };

  const handleDotClick = (idx: number) => {
    if (autoRef.current) clearInterval(autoRef.current);
    goToSlide(idx);
  };

  const Dots = () => (
    <div
      className={cn(
        'flex gap-2 mt-8 ml-0.5 transition-all ease-out',
        isExiting
          ? 'duration-[300ms] opacity-0 translate-y-2'
          : pageReady
            ? 'duration-[1400ms] delay-[900ms] opacity-100 translate-y-0'
            : 'duration-[1400ms] opacity-0 translate-y-2'
      )}
    >
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => handleDotClick(i)}
          className={cn(
            'transition-all duration-300 rounded-full bg-black',
            i === currentSlide
              ? 'w-6 h-1.5 opacity-100'
              : 'w-1.5 h-1.5 opacity-25 hover:opacity-60'
          )}
          aria-label={slides[i].title}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="relative hidden md:flex h-screen w-full items-center justify-center overflow-visible">
        {/* GIVEAWAY — slide từ trái vào, exit trượt ra trái */}
        <div
          className={cn(
            'absolute left-0 bottom-32 z-10 -rotate-90 origin-bottom-left',
            'transition-all ease-[cubic-bezier(0.25,1,0.5,1)]',
            isExiting
              ? 'duration-[450ms] -translate-x-[220px] opacity-0'
              : pageReady
                ? 'duration-[1800ms] translate-x-0 opacity-100'
                : 'duration-[1800ms] -translate-x-[220px] opacity-0'
          )}
        >
          <span className="text-lg font-medium tracking-widest whitespace-nowrap">
            GIVEAWAY
          </span>
        </div>

        {/* PREMIUM — slide từ phải vào, exit trượt ra phải */}
        <div
          className={cn(
            'absolute right-0 top-[200px] z-10 rotate-90 origin-top-right',
            'transition-all ease-[cubic-bezier(0.25,1,0.5,1)]',
            isExiting
              ? 'duration-[450ms] translate-x-[220px] opacity-0'
              : pageReady
                ? 'duration-[1800ms] delay-[250ms] translate-x-0 opacity-100'
                : 'duration-[1800ms] translate-x-[220px] opacity-0'
          )}
        >
          <span className="text-lg font-medium tracking-widest whitespace-nowrap">
            PREMIUM
          </span>
        </div>

        {/* Slide text — exit: drop xuống */}
        <div className="relative w-full h-full flex items-center pl-[10%]">
          <div
            className={cn(
              'transition-all ease-in-out',
              isExiting
                ? 'duration-[400ms] opacity-0 translate-y-6'
                : 'duration-[800ms] opacity-100 translate-y-0'
            )}
          >
            <RevealText
              key={currentSlide}
              text={slides[currentSlide].title}
              active={slideActive}
              className="text-7xl font-['myriadpro-semibold'] uppercase tracking-wider text-black"
              onClick={() => handleNavigate(slides[currentSlide].route)}
            />
            <Dots />
          </div>
          {/* <Lottie
            options={lottieOptions}
            height={120}
            width={120}
            speed={0.5}
            style={{
              position: 'absolute',
              right: 20,
              bottom: 100,
              pointerEvents: 'none',
              zoom: 0.8,
            }}
          /> */}
        </div>

        {/* Footer — exit: trượt xuống */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 z-10',
            'transition-all ease-out',
            isExiting
              ? 'duration-[400ms] translate-y-12 opacity-0'
              : pageReady
                ? 'duration-[1600ms] delay-[600ms] translate-y-0 opacity-100'
                : 'duration-[1600ms] translate-y-12 opacity-0'
          )}
        >
          <div className="mb-3">
            <MarqueeStrip />
          </div>
          <div className="flex items-center justify-between px-12 pb-6">
            <a
              href="https://www.chendinh.com/work/giveaway-premium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-black hover:text-yellow-600 transition-colors"
            >
              *ChenDinh Solutions
            </a>
            <div className="flex items-center gap-8">
              <span className="text-sm text-black">Follow us</span>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/giveawaypremium_quan1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-6 w-6 text-black hover:opacity-60 transition-opacity" />
                </a>
                <a
                  href="https://www.facebook.com/giveawaypremiumquan1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-6 w-6 text-black hover:opacity-60 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="relative flex md:hidden h-screen w-full flex-col items-center justify-center overflow-visible">
        {/* GIVEAWAY mobile — exit trượt ra trái */}
        <div
          className={cn(
            'absolute left-0 top-[170px] z-10 -rotate-90 origin-bottom-left',
            'transition-all ease-[cubic-bezier(0.25,1,0.5,1)]',
            isExiting
              ? 'duration-[450ms] -translate-x-[150px] opacity-0'
              : pageReady
                ? 'duration-[1800ms] translate-x-[35px] opacity-100'
                : 'duration-[1800ms] -translate-x-[150px] opacity-0'
          )}
        >
          <span className="text-base font-medium tracking-widest whitespace-nowrap">
            GIVEAWAY
          </span>
        </div>

        {/* PREMIUM mobile — exit trượt ra phải */}
        <div
          className={cn(
            'absolute right-0 bottom-[200px] z-10 rotate-90 origin-top-right',
            'transition-all ease-[cubic-bezier(0.25,1,0.5,1)]',
            isExiting
              ? 'duration-[450ms] translate-x-[150px] opacity-0'
              : pageReady
                ? 'duration-[1800ms] delay-[250ms] -translate-x-[15px] opacity-100'
                : 'duration-[1800ms] translate-x-[150px] opacity-0'
          )}
        >
          <span className="text-base font-medium tracking-widest whitespace-nowrap">
            PREMIUM
          </span>
        </div>

        {/* Slide text mobile — exit: drop xuống */}
        <div className="relative w-full flex-1 mt-20 flex items-center pl-[10%]">
          <div
            className={cn(
              'transition-all ease-in-out',
              isExiting
                ? 'duration-[400ms] opacity-0 translate-y-6'
                : 'duration-[800ms] opacity-100 translate-y-0'
            )}
          >
            <RevealText
              key={currentSlide}
              text={slides[currentSlide].title}
              active={slideActive}
              className="text-[44px] font-bold uppercase tracking-wider text-gray-800"
              onClick={() => handleNavigate(slides[currentSlide].route)}
            />
            <Dots />
          </div>
        </div>

        {/* Mobile footer — exit: trượt xuống */}
        <div
          className={cn(
            'w-full z-10',
            'transition-all ease-out',
            isExiting
              ? 'duration-[400ms] translate-y-12 opacity-0'
              : pageReady
                ? 'duration-[1600ms] delay-[600ms] translate-y-0 opacity-100'
                : 'duration-[1600ms] translate-y-12 opacity-0'
          )}
        >
          <div className="mb-2">
            <MarqueeStrip />
          </div>
          <div className="flex flex-col items-center gap-3 px-6 pb-24">
            <div className="w-full max-w-xs border-t border-black" />
            <div className="flex w-full items-center justify-between">
              <a
                href="https://www.chendinh.com/work/giveaway-premium"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-black hover:text-yellow-600"
              >
                *ChenDinh Solutions
              </a>
              <div className="flex items-center gap-3">
                <span className="text-xs text-black">Follow us</span>
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/giveawaypremium_quan1/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-5 w-5 text-black" />
                  </a>
                  <a
                    href="https://www.facebook.com/giveawaypremiumquan1/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-5 w-5 text-black" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
