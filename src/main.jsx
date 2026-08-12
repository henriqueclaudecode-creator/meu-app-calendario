import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { aplicarTema, lerTema } from './lib/aparencia';
import { ehPremium } from './lib/premium';
import { PremiumProvider } from './lib/PremiumContext';
import { pedirPermissao, sincronizarTodos, agendarAniversario } from './lib/notificacoes';
import { listarEventos } from './db/eventos';
import { lerPerfil } from './lib/perfil';
import { iniciarSync } from './lib/sync';

// Aplica o tema salvo antes de renderizar (evita flash). Fora do Premium, força
// o tema Padrão.
aplicarTema(ehPremium() ? lerTema() : 'light');

// Sincronização com a nuvem (só age quando o Firebase está ligado E há login).
iniciarSync();

// Notificações (lembretes): pede a permissão e reagenda os eventos já salvos.
// No navegador vira no-op; só faz efeito no app instalado (Android).
(async () => {
  try {
    await pedirPermissao();
    await sincronizarTodos(await listarEventos());
    await agendarAniversario(lerPerfil().nascimento);
  } catch { /* silencioso */ }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PremiumProvider>
      <App />
    </PremiumProvider>
  </StrictMode>,
);
