import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Lê a versão real do app direto do build.gradle do Android, para exibir na tela
// de Config e confirmar qual build está instalado.
function versaoDoApp() {
  try {
    const g = readFileSync(new URL('./android/app/build.gradle', import.meta.url), 'utf8');
    const nome = g.match(/versionName\s+"([^"]+)"/)?.[1] ?? '?';
    const code = g.match(/versionCode\s+(\d+)/)?.[1] ?? '?';
    return { nome, code };
  } catch {
    return { nome: '?', code: '?' };
  }
}
const v = versaoDoApp();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(v.nome),
    __APP_BUILD__: JSON.stringify(v.code),
  },
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
