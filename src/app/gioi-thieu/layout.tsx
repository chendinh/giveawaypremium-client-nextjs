import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | GiveAway Premium',
};

/**
 * Layout cho /gioi-thieu — inject <link rel="preload"> cho:
 * - Founder avatar (hero image, above-the-fold trên section 2)
 * - store1.jpg (ảnh đầu tiên của ImageGallery)
 * - marker.png, phone.png (icons footer, nhỏ nhưng visible sớm)
 */
export default function GioiThieuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preloadImages = [
    '/images/founder-avater.jpg',
    '/images/Store/store1.jpg',
    '/images/Icon/marker.png',
    '/images/Icon/phone.png',
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
