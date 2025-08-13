import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite({
        client: {
          outDir: 'dist'
        },
        // Force client-side only mode for Tauri
        ssr: false
      }),
    ],
    server: { 
      port: 5173, 
      strictPort: true, 
      hmr: { overlay: false },
      host: '0.0.0.0'
    },
    preview: { port: 5173 },
    clearScreen: false,
    define: {
      global: 'globalThis',
    },
    // Force SPA mode for Tauri compatibility
    build: {
      ssr: false,
      rollupOptions: {
        input: 'index.html'
      }
    }
  };
});
