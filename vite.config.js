import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expõe na rede local para abrir no celular (mesma Wi-Fi)
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
  },
  esbuild: {
    // Remove logs de debug do bundle de produção (release).
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info'],
  },
});
