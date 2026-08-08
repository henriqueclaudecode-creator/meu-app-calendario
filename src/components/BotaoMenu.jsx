// Botão ☰ (três barrinhas) que abre o MenuLateral. Fica no início do cabeçalho
// de cada tela. Visual neutro, herda a cor do texto do tema.

import { cores } from '../lib/tema';

export default function BotaoMenu({ onAbrir }) {
  return (
    <button style={estilos.botao} onClick={onAbrir} aria-label="Abrir menu" aria-haspopup="menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

const estilos = {
  botao: { flexShrink: 0, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '50%', padding: 0 },
};
