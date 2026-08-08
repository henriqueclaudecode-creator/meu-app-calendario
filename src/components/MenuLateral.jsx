// Menu de navegação que DESCE do topo por cima do conteúdo (não empurra o app).
// Substitui a antiga barra de abas. Abre pelo botão ☰ no cabeçalho das telas.
//
// Itens: Calendário, Agenda, Mapa da Vida (Pro), Minha História (Pro) e
// Configurações (⚙️, que é o antigo "Mais"). Recursos Pro mostram o diamante.

import { createPortal } from 'react-dom';
import { cores, sombraForte, raioGrande, raio } from '../lib/tema';
import { IconePro } from './IconePro';

const ITENS = [
  { id: 'calendario', rotulo: 'Calendário' },
  { id: 'agenda', rotulo: 'Agenda' },
  { id: 'mapa', rotulo: 'Mapa da Vida', premium: true },
  { id: 'historia', rotulo: 'Minha História', premium: true },
  { id: 'mais', rotulo: 'Configurações' },
];

function Icone({ id, cor }) {
  const c = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'calendario') return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
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
        <div style={estilos.cabecalho}>
          <span style={estilos.marca}>Orbi</span>
          <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={estilos.lista}>
          {ITENS.map((it) => {
            const ativo = it.id === ativa;
            const bloqueado = it.premium && !premium;
            const cor = ativo ? cores.acento : cores.texto;
            return (
              <button
                key={it.id}
                style={{ ...estilos.item, ...(ativo ? estilos.itemAtivo : null) }}
                onClick={() => { onNavegar(it.id); onFechar(); }}
                aria-current={ativo ? 'page' : undefined}
              >
                <span style={{ ...estilos.itemIcone, color: cor }}><Icone id={it.id} cor={cor} /></span>
                <span style={{ ...estilos.itemRotulo, color: cor, fontWeight: ativo ? 800 : 600 }}>{it.rotulo}</span>
                {bloqueado && (
                  <span style={estilos.itemPro}>
                    <IconePro tamanho={13} cor={cores.acento} />
                  </span>
                )}
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
    paddingTop: 'calc(env(safe-area-inset-top) + 8px)', padding: '8px 12px 14px',
  },
  cabecalho: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 10px' },
  marca: { fontSize: 20, fontWeight: 900, letterSpacing: -0.6, color: cores.acento },
  fechar: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '50%' },
  lista: { display: 'flex', flexDirection: 'column', gap: 3 },
  item: { position: 'relative', display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', padding: '13px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: raio },
  itemAtivo: { background: cores.acentoBg },
  itemIcone: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 },
  itemRotulo: { flex: 1, fontSize: 15.5, letterSpacing: -0.2 },
  itemPro: { flexShrink: 0, display: 'flex', alignItems: 'center' },
};
