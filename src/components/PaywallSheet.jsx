// Paywall — bottom sheet elegante que sobe de baixo. Nunca é uma "tela seca":
// mostra os benefícios, os planos (anual em destaque) e um único botão para
// começar o teste grátis / assinar.

import { createPortal } from 'react-dom';
import PainelPro from './PainelPro';
import { cores, sombraForte, raioGrande } from '../lib/tema';

export default function PaywallSheet({ onFechar, onAssinar }) {
  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label="Orbi Pro">
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />
        <PainelPro onAssinar={onAssinar} onFechar={onFechar} />
      </div>
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '94vh', overflowY: 'auto', boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(20px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 14px' },

  saudacao: { textAlign: 'center', marginBottom: 16 },
  saudacaoTitulo: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: cores.texto },
  saudacaoSub: { fontSize: 13.5, color: cores.textoSuave, marginTop: 6, fontWeight: 500, lineHeight: 1.5 },
};
