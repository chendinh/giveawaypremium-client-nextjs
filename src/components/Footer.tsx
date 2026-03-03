'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FacebookIcon, Instagram } from 'lucide-react';
import { useLocale } from '@/context/LocaleProvider';

interface NavItem {
  title: string;
  href: string;
  isButton?: boolean; // To style "Contact Us" as a button
}

const footerNavItems: NavItem[] = [
  { title: 'About', href: '/about' },
  { title: 'Game List', href: '/games' },
  { title: 'Provably Fair', href: '/provably-fair' },
  { title: 'Verify Tool', href: '/verify-tool' },
];

export default function Footer() {
  const locale = useLocale();
  const router = useRouter();

  return (
    <footer className="border shadow-sm boder-t-[1px] border-[#E6E8EC] py-4 border-b-0 border-l-0 border-r-0">
      <div className="flex-col md:flex-row container my-6 md:y-10 mx-auto flex items-center justify-between">
        <div className="mb-6 md:mb-0">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            width={100}
            height={100}
            priority
            style={{ width: 'auto', height: 'auto' }}
            className="cursor-pointer"
            onClick={() => router.push('/')}
          />
        </div>
        <div className="flex gap-2">
          <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-2 flex items-center justify-between">
            <nav className=" md:flex items-center lg:space-x-12 space-x-6">
              {footerNavItems.map(item => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href!}`}
                  className={`text-gray-500 text-sm hover:text-blue-500 font-['archivo-semibold'] ${
                    item.isButton
                      ? 'px-4 py-2 border border-[##E6E8EC] text-black rounded-full hover:bg-gray-200'
                      : ''
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="container w-[80%] md:w-full bg-[#E6E8EC] h-[1px] mx-auto"></div>

      <div className="flex flex-col container md:flex-row justify-between items-center mx-auto w-full py-5 md:py-8 mb-5">
        <div className="flex space-x-8 px-8 md:px-0">
          <span className='text-xs font-["roboto"] text-[#777E90] w-[120px] sm:w-max md:w-auto'>
            Copyright © 2021 UI8 LLC. All rights reserved
          </span>
          <span className='text-xs font-["roboto-semibold"] text-[#777E90]'>
            Privacy Policy
          </span>
          <span className='text-xs font-["roboto-semibold"] text-[#777E90]'>
            Terms of Use
          </span>
        </div>

        <div className="flex space-x-4 items-center mt-5 md:mt-0">
          <FacebookIcon />
          <Instagram />
        </div>
      </div>
    </footer>
  );
}
