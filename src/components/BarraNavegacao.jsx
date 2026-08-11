// Barra de navegação, fixa no TOPO, com as quatro seções do app. O item ativo
// ganha cor de acento e um traço embaixo.

import { cores } from '../lib/tema';

const ABAS = [
  { id: 'calendario', rotulo: 'Calendário' },
  { id: 'mapa', rotulo: 'Mapa da Vida' },
  { id: 'historia', rotulo: 'Minha História' },
  { id: 'mais', rotulo: 'Mais' },
];

function Icone({ id, ativo }) {
  const cor = ativo ? cores.acento : cores.textoApagado;
  const comum = {
    width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (id === 'calendario') {
    return (
      <svg {...comum}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  if (id === 'mapa') {
    // Constelação: um centro e pequenos "planetas" orbitando.
    return (
      <svg {...comum}>
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="4" r="1.4" />
        <circle cx="19" cy="15" r="1.4" />
        <circle cx="5" cy="15" r="1.4" />
        <path d="M12 9.6V5.4M13.8 13.2l3.7 1.4M10.2 13.2l-3.7 1.4" />
      </svg>
    );
  }
  if (id === 'historia') {
    // Linha do tempo / relógio.
    return (
      <svg {...comum}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }
  // mais: três barrinhas (menu).
  return (
    <svg {...comum}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function BarraNavegacao({ ativa, onMudar }) {
  return (
    <nav style={estilos.barra}>
      <div style={estilos.interno}>
        {ABAS.map((aba) => {
          const ativo = aba.id === ativa;
          return (
            <button key={aba.id} style={estilos.item} onClick={() => onMudar(aba.id)} aria-current={ativo ? 'page' : undefined} aria-label={aba.rotulo}>
              <Icone id={aba.id} ativo={ativo} />
              {aba.id !== 'mais' && (
                <span style={{ ...estilos.rotulo, color: ativo ? cores.acento : cores.textoApagado, fontWeight: ativo ? 700 : 600 }}>
                  {aba.rotulo}
                </span>
              )}
              <span style={{ ...estilos.indicador, background: ativo ? cores.acento : 'transparent' }} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const estilos = {
  barra: {
    position: 'sticky', top: 0, zIndex: 50,
    background: cores.superficie, borderBottom: `1px solid ${cores.borda}`,
    boxShadow: '0 2px 10px rgba(15, 37, 71, 0.05)',
    paddingTop: 'env(safe-area-inset-top)',
  },
  interno: { maxWidth: 'var(--app-max, 560px)', margin: '0 auto', display: 'flex', padding: '0 8px' },
  item: {
    flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    border: 'none', background: 'transparent', cursor: 'pointer', padding: '9px 0 10px',
  },
  rotulo: { fontSize: 11.5, letterSpacing: -0.1 },
  indicador: { position: 'absolute', left: '20%', right: '20%', bottom: 0, height: 3, borderRadius: '3px 3px 0 0' },
};

export default BarraNavegacao;
