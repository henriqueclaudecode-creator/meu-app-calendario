// Barra de navegação FIXA na parte de baixo do app (estilo tab bar). Substitui o
// antigo menu que descia do topo pelas três barrinhas. Cada seção tem ícone em
// cima e rótulo embaixo; o item ativo ganha a cor de acento. Recursos Pro mostram
// o diamante. Segue os tokens de tema (funciona em todos os temas).

import { cores, sombraForte } from '../lib/tema';
import { IconePro } from './IconePro';

const ITENS = [
  { id: 'calendario', rotulo: 'Calendário' },
  { id: 'agenda', rotulo: 'Agenda' },
  { id: 'mapa', rotulo: 'Marcos', premium: true },
  { id: 'historia', rotulo: 'Jornada', premium: true },
  { id: 'mais', rotulo: 'Config.' },
];

function Icone({ id, ativo, apagado }) {
  const cor = ativo ? cores.acento : cores.textoApagado;
  const c = {
    width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: apagado ? { opacity: 0.32 } : undefined,
  };
  if (id === 'calendario') return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
  if (id === 'agenda') return <svg {...c}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
  // Marcos — constelação de pontos conectados (marcos da vida).
  if (id === 'mapa') return <svg {...c}><circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="4" r="1.4" /><circle cx="19" cy="15" r="1.4" /><circle cx="5" cy="15" r="1.4" /><path d="M12 9.6V5.4M13.8 13.2l3.7 1.4M10.2 13.2l-3.7 1.4" /></svg>;
  // Jornada — caminho com paradas (rota da vida).
  if (id === 'historia') return <svg {...c}><circle cx="5.5" cy="6" r="1.7" /><circle cx="18.5" cy="18" r="1.7" /><path d="M5.5 7.7v3.3a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3v1.3" /></svg>;
  // Config. — engrenagem sólida.
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={cor} style={apagado ? { opacity: 0.32 } : undefined} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

export default function BarraInferior({ ativa, onNavegar, premium }) {
  return (
    <nav style={estilos.barra} aria-label="Navegação principal">
      <div style={estilos.interno}>
        {ITENS.map((it) => {
          const ativo = it.id === ativa;
          const bloqueado = it.premium && !premium;
          return (
            <button
              key={it.id}
              style={estilos.item}
              onClick={() => onNavegar(it.id)}
              aria-current={ativo ? 'page' : undefined}
              aria-label={bloqueado ? `${it.rotulo} (Premium)` : it.rotulo}
            >
              <span style={estilos.iconeWrap}>
                <Icone id={it.id} ativo={ativo} apagado={bloqueado} />
                {bloqueado && <span style={estilos.selo}><IconePro tamanho={11} cor={cores.acento} preenchido /></span>}
              </span>
              <span style={{ ...estilos.rotulo, color: ativo ? cores.acento : cores.textoApagado, fontWeight: ativo ? 700 : 600, opacity: bloqueado ? 0.8 : 1 }}>
                {it.rotulo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const estilos = {
  barra: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
    background: cores.superficie, borderTop: `1px solid ${cores.borda}`,
    boxShadow: sombraForte,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  interno: { maxWidth: 'var(--app-max, 560px)', margin: '0 auto', display: 'flex', padding: '0 2px' },
  item: {
    flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    border: 'none', background: 'transparent', cursor: 'pointer', padding: '9px 1px 8px',
  },
  iconeWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -6, right: -9, display: 'flex' },
  rotulo: { fontSize: 10, lineHeight: 1.1, letterSpacing: -0.2, textAlign: 'center', whiteSpace: 'nowrap' },
};
