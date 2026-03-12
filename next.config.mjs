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
  // Enable instrumentation hook for Parse Server initialization
  instrumentationHook: true,
  // Ensure Parse Server and its dependencies are not bundled by webpack
  serverExternalPackages: [
    'parse-server',
    'parse-dashboard',
    'express',
    'multer',
    'cloudinary',
    'nodemailer',
    'winston',
    'winston-daily-rotate-file',
    'node-schedule',
    'sib-api-v3-sdk',
    'ejs',
    'p-queue',
  ],
};

export default nextConfig;
