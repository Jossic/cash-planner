import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';

export default defineConfig(() => {
  return {
    plugins: [
      // Disable dev SSR to avoid circular JSON issues in dev within Tauri
      qwikCity({ devSsrServer: false } as any),
      qwikVite(),
    ],
    server: { port: 5173, strictPort: true, hmr: { overlay: false } },
    preview: { port: 5173 },
  };
});
