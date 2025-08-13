import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity({
        // Disable SSR in development to prevent circular JSON issues with Tauri
        renderStrategy: 'spa'
      }),
      qwikVite({
        client: {
          // Ensure client-side rendering for Tauri compatibility
          outDir: 'dist'
        }
      }),
    ],
    server: { 
      port: 5173, 
      strictPort: true, 
      hmr: { overlay: false },
      // Allow Tauri to access the dev server
      host: '0.0.0.0'
    },
    preview: { port: 5173 },
    clearScreen: false,
    // Ensure proper handling of imports
    define: {
      global: 'globalThis',
    },
  };
});
