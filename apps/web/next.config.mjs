import nextI18NextConfig from './next-i18next.config.mjs';
import fs from 'fs';

const buildTime = new Date().toISOString();
fs.writeFileSync('./public/build-info.json', JSON.stringify({ buildTime }));
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  i18n: nextI18NextConfig.i18n,
  images: {
    domains: ['images.unsplash.com'],
  },
  reactStrictMode: true,
};

export default nextConfig;
