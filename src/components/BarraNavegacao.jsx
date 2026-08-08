// Barra de navegação, fixa no TOPO, com as quatro seções do app. O item ativo
// ganha cor de acento e um traço embaixo.

import { cores } from '../lib/tema';
import { usePremium } from '../lib/PremiumContext';

const ABAS = [
  { id: 'calendario', rotulo: 'Calendário' },
  { id: 'agenda', rotulo: 'Agenda' },
  { id: 'mapa', rotulo: 'Mapa da Vida', premium: true },
  { id: 'historia', rotulo: 'Minha História', premium: true },
  { id: 'mais', rotulo: 'Mais' },
];

function Icone({ id, ativo, apagado }) {
  const cor = ativo ? cores.acento : cores.textoApagado;
  const comum = {
    width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: apagado ? { opacity: 0.28 } : undefined,
  };
  if (id === 'calendario') {
    return (
      <svg {...comum}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (id === 'agenda') {
    // Lista / agenda: marcadores + linhas.
    return (
      <svg {...comum}>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
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
  const { premium, abrirPaywall } = usePremium() ?? {};
  return (
    <nav style={estilos.barra}>
      <div style={estilos.interno}>
        {ABAS.map((aba) => {
          const ativo = aba.id === ativa;
          const bloqueado = aba.premium && !premium;
          const clicar = () => (bloqueado ? abrirPaywall?.() : onMudar(aba.id));
          return (
            <button key={aba.id} style={estilos.item} onClick={clicar} aria-current={ativo ? 'page' : undefined} aria-label={bloqueado ? `${aba.rotulo} (Premium)` : aba.rotulo}>
              <span style={estilos.iconeWrap}>
                <Icone id={aba.id} ativo={ativo} apagado={bloqueado} />
                {bloqueado && <span style={estilos.selo} aria-hidden="true">✨</span>}
              </span>
              {aba.id !== 'mais' && (
                <span style={{ ...estilos.rotulo, color: ativo ? cores.acento : cores.textoApagado, fontWeight: ativo ? 700 : 600, opacity: bloqueado ? 0.75 : 1 }}>
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
  interno: { maxWidth: 560, margin: '0 auto', display: 'flex', padding: '0 2px' },
  item: {
    flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px 1px 9px',
  },
  rotulo: { fontSize: 9.5, lineHeight: 1.1, letterSpacing: -0.2, textAlign: 'center', height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconeWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -6, right: -9, fontSize: 10, lineHeight: 1 },
  indicador: { position: 'absolute', left: '20%', right: '20%', bottom: 0, height: 3, borderRadius: '3px 3px 0 0' },
};

export default BarraNavegacao;
