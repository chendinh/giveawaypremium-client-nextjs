import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trang Chủ | GiveAway Premium',
};

/**
 * Layout cho /trang-chu — inject <link rel="preload"> cho ảnh marquee.
 * Preload 3 ảnh đầu (LCP candidates), phần còn lại lazy load tự nhiên.
 */
export default function TrangChuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preloadImages = [
    '/images/Store/store2.jpg',
    '/images/Store/store4.jpg',
    '/images/Store/store6.jpg',
  ];

  return (
    <>
      <head>
        {preloadImages.map(src => (
          <link
            key={src}
            rel="preload"
            as="image"
            href={src}
            fetchPriority="high"
          />
        ))}
      </head>
      {children}
    </>
  );
}
