import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { aplicarTema, lerTema } from './lib/aparencia';
import { ehPremium } from './lib/premium';
import { PremiumProvider } from './lib/PremiumContext';
import { sincronizarTodos, agendarAniversario } from './lib/notificacoes';
import { listarEventos } from './db/eventos';
import { lerPerfil } from './lib/perfil';
import { iniciarSync } from './lib/sync';

// Aplica o tema salvo antes de renderizar (evita flash). Fora do Premium, força
// o tema Padrão.
aplicarTema(ehPremium() ? lerTema() : 'light');

// Sincronização com a nuvem (só age quando o Firebase está ligado E há login).
iniciarSync();

// Notificações (lembretes): reagenda os eventos já salvos a cada abertura, SEM
// pedir permissão aqui (o pedido fica no botão "Ativar notificações"). Se a
// permissão do sistema já estiver concedida, os agendamentos valem; senão, o
// plugin ignora sem quebrar. No navegador vira no-op.
(async () => {
  try {
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
