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
  // Configurações (engrenagem).
  return <svg {...c}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" /></svg>;
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
    width: '100%', maxWidth: 560, boxSizing: 'border-box', background: cores.superficie,
    borderRadius: `0 0 ${raioGrande + 4}px ${raioGrande + 4}px`, boxShadow: sombraForte,
    paddingTop: 'env(safe-area-inset-top)',
  },
  interno: { maxWidth: 560, margin: '0 auto', display: 'flex', padding: '0 2px' },
  item: {
    flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 1px 13px',
  },
  iconeWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: -6, right: -9, display: 'flex' },
  rotulo: { fontSize: 9.5, lineHeight: 1.1, letterSpacing: -0.2, textAlign: 'center', height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' },
  indicador: { position: 'absolute', left: '20%', right: '20%', bottom: 0, height: 3, borderRadius: '3px 3px 0 0' },
};
