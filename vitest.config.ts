import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@root': path.resolve(__dirname, ''),
    },
  },
  test: {
    globals: true, // để dùng expect, describe mà không cần import
    environment: 'jsdom',
    // coverage: {
    //   reporter: ['text', 'json', 'html'],
    // },
    setupFiles: './vitest.setup.ts',
  },
});
