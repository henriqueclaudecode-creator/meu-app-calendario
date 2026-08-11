// Menu de navegação que DESCE do topo por cima do conteúdo (não empurra o app).
// Mantém o MESMO design da antiga barra de abas (itens na horizontal, ícone em
// cima e rótulo embaixo, com traço no item ativo) — só que agora oculto, abrindo
// pelo botão ☰. Recursos Pro mostram o diamante.

import { createPortal } from 'react-dom';
import { cores, sombraForte, raioGrande } from '../lib/tema';
import { IconePro } from './IconePro';

const ITENS = [
  { id: 'calendario', rotulo: 'Calendário' },
  { id: 'agenda', rotulo: 'Agenda' },
  { id: 'mapa', rotulo: 'Mapa da Vida', premium: true },
  { id: 'historia', rotulo: 'Minha História', premium: true },
  { id: 'mais', rotulo: 'Config.' },
];

function Icone({ id, ativo, apagado }) {
  const cor = ativo ? cores.acento : cores.textoApagado;
  const c = {
    width: 23, height: 23, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: apagado ? { opacity: 0.32 } : undefined,
  };
  if (id === 'calendario') return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" /></svg>;
  if (id === 'agenda') return <svg {...c}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
  if (id === 'mapa') return <svg {...c}><circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="4" r="1.4" /><circle cx="19" cy="15" r="1.4" /><circle cx="5" cy="15" r="1.4" /><path d="M12 9.6V5.4M13.8 13.2l3.7 1.4M10.2 13.2l-3.7 1.4" /></svg>;
  if (id === 'historia') return <svg {...c}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
  // Configurações — engrenagem SÓLIDA (com furo central), no estilo da imagem.
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={cor} style={apagado ? { opacity: 0.32 } : undefined} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

export default function MenuLateral({ ativa, onNavegar, onFechar, premium }) {
  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label="Navegação">
      <nav style={estilos.painel} className="menuDesce" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.interno}>
          {ITENS.map((it) => {
            const ativo = it.id === ativa;
            const bloqueado = it.premium && !premium;
            return (
              <button
                key={it.id}
                style={estilos.item}
                onClick={() => { onNavegar(it.id); onFechar(); }}
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
                <span style={{ ...estilos.indicador, background: ativo ? cores.acento : 'transparent' }} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  painel: {
    width: '100%', maxWidth: 'var(--app-max, 560px)', boxSizing: 'border-box', background: cores.superficie,
    borderRadius: `0 0 ${raioGrande + 4}px ${raioGrande + 4}px`, boxShadow: sombraForte,
    paddingTop: 'env(safe-area-inset-top)', paddingBottom: 8,
  },
  interno: { maxWidth: 'var(--app-max, 560px)', margin: '0 auto', display: 'flex', padding: '0 2px' },
  item: {
    flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    border: 'none', background: 'transparent', cursor: 'pointer', padding: '18px 1px 19px',
  },
  iconeWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -6, right: -9, display: 'flex' },
  rotulo: { fontSize: 9.5, lineHeight: 1.1, letterSpacing: -0.2, textAlign: 'center', height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' },
  indicador: { position: 'absolute', left: '20%', right: '20%', bottom: 0, height: 3, borderRadius: '3px 3px 0 0' },
};
