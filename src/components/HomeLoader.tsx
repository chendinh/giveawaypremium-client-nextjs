'use client';

/**
 * HomeLoader — chỉ hiện 1 lần duy nhất khi mở web lần đầu trong session.
 * Dùng sessionStorage key 'gap_loaded' — navigate đi rồi quay lại không hiện lại.
 */

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'gap_loaded';

const AMBIENT = [
  '/images/Store/store1.jpg',
  '/images/Store/store9.jpg',
  '/images/Store/store18.jpg',
  '/images/Store/store22.jpg',
];

interface HomeLoaderProps {
  onDone: () => void;
}

export default function HomeLoader({ onDone }: HomeLoaderProps) {
  const [ambientIdx, setAmbientIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logoIn, setLogoIn] = useState(false);
  const [exiting, setExiting] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Logo fade in
  useEffect(() => {
    const t = setTimeout(() => setLogoIn(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Ambient crossfade mỗi 1.8s
  useEffect(() => {
    ambientRef.current = setInterval(
      () => setAmbientIdx(i => (i + 1) % AMBIENT.length),
      1800
    );
    return () => {
      if (ambientRef.current) clearInterval(ambientRef.current);
    };
  }, []);

  // Progress 0 → 100 trong ~1.4s
  useEffect(() => {
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 100;
        }
        return p + 2.5;
      });
    }, 35);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // Khi progress = 100 → exit
  useEffect(() => {
    if (progress < 100) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, '1');
        onDone();
      }, 650);
    }, 200);
    return () => clearTimeout(t);
  }, [progress, onDone]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white',
        'transition-opacity duration-[650ms] ease-in-out',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {AMBIENT.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="100vw"
            className={cn(
              'object-cover grayscale transition-opacity duration-[1800ms]',
              i === ambientIdx ? 'opacity-[0.04]' : 'opacity-0'
            )}
            priority={i === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/90" />
      </div>

      {/* Logo */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center gap-4',
          'transition-all duration-700 ease-out',
          logoIn
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-3'
        )}
      >
        <Image
          src="/images/Icon/logoHeaderWhite.svg"
          alt="GiveAway Premium"
          width={48}
          height={48}
          className="w-12 h-12"
          priority
        />
        <Image
          src="/images/Icon/giveawayTextBlack.svg"
          alt="GIVEAWAY"
          width={120}
          height={18}
          className="w-28 h-auto opacity-80"
          priority
        />
        <p className="text-[11px] tracking-[0.35em] text-[#FFD700] uppercase">
          Premium
        </p>
      </div>

      {/* Progress line */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[160px] z-10">
        <div className="h-px w-full bg-gray-200 overflow-hidden rounded-full">
          <div
            className="h-full bg-black rounded-full"
            style={{ width: `${progress}%`, transition: 'width 35ms linear' }}
          />
        </div>
      </div>
    </div>
  );
}
