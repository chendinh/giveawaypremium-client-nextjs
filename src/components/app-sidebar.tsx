'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  items?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    title: 'INTRODUCTION',
    items: [{ title: 'P Poker Overview', href: '/intro/poker-overview' }],
  },
  {
    title: 'INTRODUCTIONS',
    items: [
      { title: 'What is P Poker', href: '/how/butt12on1' },
      { title: 'Buyback and Burn', href: '/how/button2' },
      { title: 'Future P Poker Utilities', href: '/how/button3' },
      { title: 'Roadmap', href: '/how/buttsado4' },
      { title: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [{ title: 'Official links', href: '/intro/poker-overview' }],
  },
  {
    title: 'HOW IT WORKS',
    items: [
      { title: 'Cash Games', href: '/how/button44' },
      { title: 'Tournaments', href: '/how/button134' },
      { title: 'Wallet Integration', href: '/how/button324234' },
      { title: 'Hand Record', href: '/table-history' },
    ],
  },
  {
    title: 'DOCUMENTATION',
    items: [
      { title: 'Validation Overview', href: '/how/button55' },
      { title: 'How to use', href: '/how/button2323234' },
      { title: 'Validation Tool', href: '/verify-tool' },
      { title: 'Security', href: '/how/button444234' },
      { title: 'Report', href: '/report' },
    ],
  },
  {
    title: 'USER CONTROLS',
    items: [
      { title: 'Deposit Funds', href: '/how/butto123123n' },
      { title: 'Start New Session', href: '/how/b13123213213utton' },
      { title: 'Review Transaction History', href: '/how/buttvvdsvon' },
      { title: 'Manage Account Settings', href: '/how/butsdfsfton' },
    ],
  },
];

export function AppSidebar({ locale }: { locale: string }) {
  const currentRoute = usePathname();
  const isActive = (href: string) => currentRoute === href;

  return (
    <aside className="hidden z-50 lg:block w-72 bg-white dark:bg-gray-800 border border-t-0 border-l-0 border-b-0 border-[#E6E8EC]">
      <nav className="p-4 pt-[35px]">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.href || item.title}>
              {item.href ? (
                <Link
                  href={`${item.href}`}
                  className={`block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    item.disabled ? 'text-gray-400 cursor-not-allowed' : ''
                  }`}
                  aria-disabled={item.disabled}
                >
                  {item.title}
                </Link>
              ) : (
                <span className="block p-2 font-['roboto-semibold']">
                  {item.title}
                </span>
              )}
              {item.items && (
                <ul className="space-y-1">
                  {item.items.map(subItem => (
                    <li key={subItem.href}>
                      <Link
                        href={`/${locale}${subItem.href!}`}
                        className={`flex justify-between align-baseline items-center font-['roboto'] p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          subItem.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#868686]'
                        }`}
                        style={{
                          color: isActive(`/${locale}${subItem.href!}`!)
                            ? '#3772FF'
                            : '#868686',
                          fontWeight: isActive(`/${locale}${subItem.href!}`!)
                            ? 600
                            : 400,
                        }}
                        aria-disabled={subItem.disabled}
                      >
                        {subItem.title}
                        <Image
                          src="/images/arrow-right.png"
                          width={12}
                          height={12}
                          alt="arrow-right"
                          className="max-h-[12px]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
