'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Image from 'next/image';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import logoWhite from '@images/Icon/logoHeaderWhite.svg';
import giveawayText from '@images/Icon/giveawayTextBlack.svg';

const navItems = [
  { label: 'Về chúng tôi', href: '/gioi-thieu' },
  { label: 'Ký gửi', href: '/ky-gui' },
  { label: 'Mua sắm', href: '/mua-sam' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ẩn header ở các trang đặc biệt nếu cần
  if (pathname === '/admin' || pathname === '/monitor') return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-lg transition-all duration-500">
      <div className="w-full mx-auto pl-5 md:pl-10 lg:px-[80px] py-5 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-4 hover:opacity-90 transition"
        >
          <Image
            src={logoWhite}
            alt="Logo"
            width={20}
            height={20}
            className="object-contain"
          />
          <Image
            src={giveawayText}
            alt="Giveaway Premium"
            width={65}
            height={30}
            className="object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex mr-16 items-center gap-10">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-black text-sm font-medium relative transition-all hover:text-gray-400',
                pathname === item.href && 'text-black'
              )}
            >
              {item.label}
              {pathname === item.href && (
                <span className="absolute -bottom-2 left-0 w-full h-0.5 !bg-gray-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-black hover:bg-black/10 mr-2"
            >
              <Menu className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full bg-gradient-to-b bg-white border-l-0"
          >
            <div className="flex flex-col items-center justify-center h-full gap-12">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'text-5xl font-bold transition-all hover:text-gray-400',
                    pathname === item.href ? 'text-black' : 'text-gray-700/70'
                  )}
                >
                  {pathname === item.href ? `${item.label}` : item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
