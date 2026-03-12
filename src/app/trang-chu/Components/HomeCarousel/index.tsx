// components/HomeCarousel.tsx hoặc app/page.tsx (nếu là trang home)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  X,
} from 'lucide-react';
import Lottie from 'react-lottie';
import rightArrowJson from '../../../../../public/images/Lottie/rightArrow.json'; // cập nhật đường dẫn tương đối

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // utils để merge className
import Autoplay from 'embla-carousel-autoplay';

const slides = [
  {
    title: 'VỀ CHÚNG TÔI',
    route: '/gioi-thieu',
    mobileSize: 'text-5xl',
  },
  {
    title: 'KÝ GỬI',
    route: '/ky-gui',
    mobileSize: 'text-6xl',
  },
  {
    title: 'MUA SẮM',
    route: '/mua-sam',
    mobileSize: 'text-5xl',
  },
];

export default function HomeCarousel() {
  const router = useRouter();
  const [isHideText, setIsHideText] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: rightArrowJson,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowSidebar(true);
      setShowFooter(true);
    }, 200);

    return () => clearTimeout(timer1);
  }, []);

  const handleNavigate = (route: string) => {
    setIsHideText(true);
    setTimeout(() => {
      router.push(route);
    }, 800);
  };

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <>
      {/* Desktop + Tablet */}
      <div className="relative hidden md:flex h-[calc(100vh-97px)] w-full flex-row items-center justify-center">
        {/* Left Sidebar - GIVEAWAY */}
        <div
          className={cn(
            'absolute left-0 bottom-32 z-10 -rotate-40 origin-bottom-left translate-x-[-190px] transition-all duration-1000',
            showSidebar && 'translate-x-0 rotate-[-90deg]'
          )}
        >
          <span className="text-lg font-medium tracking-widest">GIVEAWAY</span>
        </div>

        {/* Right Sidebar - PREMIUM */}
        <div
          className={cn(
            'absolute right-0 top-[200px] z-10 rotate-15 origin-top-right translate-x-[200px] transition-all duration-1000',
            showSidebar && 'translate-x-0 rotate-90'
          )}
        >
          <span className="text-lg font-medium tracking-widest">PREMIUM</span>
        </div>

        {/* Main Carousel */}
        <div
          className="relative w-full h-full cursor-pointer"
          // onClick={() => handleNavigate(slides[1].route)}
        >
          <Lottie
            options={defaultOptions}
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
          />

          <Carousel
            className="w-full h-full"
            opts={{
              align: 'start',
              loop: true,
            }}
            setApi={setApi}
            plugins={[
              Autoplay({
                delay: 3000,
                stopOnInteraction: true,
              }),
            ]}
          >
            <CarouselContent onClick={() => api?.scrollNext()}>
              {slides.map(slide => (
                <CarouselItem key={slide.route} className="h-[calc(100vh-97px)]">
                  <div className="flex h-full w-full items-center pl-[10%]">
                    <h1
                      onClick={e => {
                        e.stopPropagation();
                        handleNavigate(slide.route);
                      }}
                      className={cn(
                        'cursor-pointer text-7xl font-["myriadpro-semibold"] uppercase tracking-wider text-black transition-opacity duration-1000',
                        isHideText && 'opacity-0'
                      )}
                    >
                      {slide.title}
                    </h1>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'absolute bottom-6 left-0 right-0 flex items-center justify-between px-12 transition-transform duration-1000 translate-y-20',
            showFooter && 'translate-y-0'
          )}
        >
          <div className="flex items-center">
            <a
              href="https://www.chendinh.com/work/giveaway-premium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-black hover:text-yellow-600 transition-colors"
            >
              *ChenDinh Solutions
            </a>
          </div>

          <div className="flex items-center gap-8">
            <span className="text-sm text-black">Follow us</span>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/giveawaypremium_quan1/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-6 w-6 text-black hover:text-black transition-colors" />
              </a>
              <a
                href="https://www.facebook.com/giveawaypremiumquan1/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-6 w-6 text-black hover:text-black transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="relative flex md:hidden h-[calc(100dvh-97px)] w-full flex-col items-center justify-center overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={cn(
            'absolute left-0 top-[100px] -rotate-90 origin-bottom-left translate-x-[-100px] transition-all duration-1000',
            showSidebar && 'translate-x-[35px] rotate-[-90deg]'
          )}
        >
          <span className="text-base font-medium tracking-widest">
            GIVEAWAY
          </span>
        </div>

        {/* Right Sidebar */}
        <div
          className={cn(
            'absolute right-0 bottom-24 rotate-90 origin-top-right translate-x-[100px] transition-all duration-1000',
            showSidebar && 'translate-x-[-15px] rotate-90'
          )}
        >
          <span className="text-base font-medium tracking-widest">PREMIUM</span>
        </div>

        {/* Mobile Carousel */}
        <div className="relative w-full h-full cursor-pointer">
          <Lottie
            options={defaultOptions}
            height={60}
            width={60}
            speed={0.5}
            style={{
              position: 'absolute',
              right: 10,
              bottom: 50,
              pointerEvents: 'none',
              zoom: 0.5,
            }}
          />

          <Carousel className="w-full h-full">
            <CarouselContent>
              {slides.map(slide => (
                <CarouselItem
                  key={slide.route}
                  className="h-[calc(100dvh-97px)] flex items-center justify-start pl-[10%]"
                >
                  <h1
                    onClick={() => handleNavigate(slide.route)}
                    className={cn(
                      'uppercase font-bold !text-3xl md:!text-5xl text-gray-700 transition-opacity duration-800',
                      slide.mobileSize,
                      isHideText && 'opacity-0'
                    )}
                  >
                    {slide.title}
                  </h1>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Mobile Footer */}
        <div
          className={cn(
            'absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3 px-6 transition-transform duration-1000 translate-y-20',
            showFooter && 'translate-y-0'
          )}
        >
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

            <div className="flex items-center gap-4">
              <span className="text-xs text-black">Follow us</span>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/giveawaypremium_quan1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-5 w-5 text-black hover:text-black" />
                </a>
                <a
                  href="https://www.facebook.com/giveawaypremiumquan1/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-5 w-5 text-black hover:text-black" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
