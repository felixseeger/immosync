import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const rootIndexHtml = path.resolve(__dirname, 'index.html');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      ...(process.env.NODE_ENV !== 'production'
        ? [
            {
              name: 'avoid-html-import-analysis',
              enforce: 'pre' as const,
              transform(code: string, id: string) {
                const normalized = id.replace(/\\/g, '/');
                if (normalized === rootIndexHtml.replace(/\\/g, '/')) {
                  return { code: 'export {}', map: null };
                }
              },
            },
          ]
        : []),
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
