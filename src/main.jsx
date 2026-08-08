import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { semearSePreciso } from './lib/seed';
import { aplicarTema, lerTema } from './lib/aparencia';
import { ehPremium } from './lib/premium';
import { PremiumProvider } from './lib/PremiumContext';
import { pedirPermissao, sincronizarTodos } from './lib/notificacoes';
import { listarEventos } from './db/eventos';

// Aplica o tema salvo antes de renderizar (evita flash). Fora do Premium, força
// o tema Padrão.
aplicarTema(ehPremium() ? lerTema() : 'light');

// Popula dados de exemplo na primeira execução (só uma vez).
semearSePreciso();

// Notificações (lembretes): pede a permissão e reagenda os eventos já salvos.
// No navegador vira no-op; só faz efeito no app instalado (Android).
(async () => {
  try {
    await pedirPermissao();
    await sincronizarTodos(await listarEventos());
  } catch { /* silencioso */ }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PremiumProvider>
      <App />
    </PremiumProvider>
  </StrictMode>,
);
