// Prévia de recurso Premium. Quando o usuário NÃO é Pro, mostra o conteúdo real
// borrado (blur) com um cartão compacto por cima — assim ele vê "do que se
// trata" e pode assinar. Sendo Pro, renderiza o conteúdo normalmente.

import { usePremium } from '../lib/PremiumContext';
import { IconePro } from './IconePro';
import { cores, sombraForte, raioGrande } from '../lib/tema';

export default function PreviewPremium({ titulo, descricao, children }) {
  const { premium, abrirPaywall } = usePremium() ?? {};
  if (premium) return children;

  return (
    <div style={estilos.wrap}>
      <div style={estilos.conteudo} aria-hidden="true">{children}</div>
      <div style={estilos.veu} />
      <div style={estilos.overlay}>
        <div style={estilos.cartao}>
          <span style={estilos.diamante}><IconePro tamanho={24} cor={cores.acento} /></span>
          <div style={estilos.titulo}>{titulo}</div>
          {descricao && <div style={estilos.desc}>{descricao}</div>}
          <div style={estilos.trial}>Incluído no teste grátis de 7 dias</div>
          <button style={estilos.btn} onClick={() => abrirPaywall?.()}>Desbloquear</button>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  wrap: { position: 'relative', flex: 1, minHeight: 0 },
  conteudo: { filter: 'blur(7px)', opacity: 0.55, pointerEvents: 'none', userSelect: 'none', transform: 'scale(1.02)', transformOrigin: 'top center' },
  veu: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, var(--cor-bg, #f6f9fd) 92%)', pointerEvents: 'none' },
  overlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' },
  cartao: {
    pointerEvents: 'auto', maxWidth: 300, width: '100%', boxSizing: 'border-box', textAlign: 'center',
    background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, boxShadow: sombraForte,
    padding: '22px 20px',
  },
  diamante: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: '50%', background: cores.acentoBg, marginBottom: 12 },
  titulo: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: cores.texto },
  desc: { fontSize: 13, color: cores.textoSuave, marginTop: 6, lineHeight: 1.45 },
  trial: { fontSize: 12, fontWeight: 700, color: cores.acento, marginTop: 12 },
  btn: { marginTop: 12, width: '100%', padding: '12px', border: 'none', borderRadius: 12, background: cores.acento, color: cores.acentoTexto, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' },
};
