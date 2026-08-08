// Cartões de plano — usados no painel "Seja Pro" e no paywall.
// Anual em destaque ("Mais Popular") com ícone de escudo; Mensal discreto.

import { PLANOS } from '../lib/premium';
import { cores, raio, raioGrande, sombraSuave } from '../lib/tema';

function Radio({ ativo }) {
  return (
    <span style={{ ...estilos.radio, ...(ativo ? estilos.radioAtivo : null) }}>
      {ativo && <span style={estilos.radioPonto} />}
    </span>
  );
}

function IconeEscudo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.acento} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.acento} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default function Planos({ selecionado, onSelecionar }) {
  const anual = PLANOS.anual;
  const mensal = PLANOS.mensal;
  return (
    <div style={estilos.wrap}>
      {/* Anual — destaque */}
      <button
        type="button"
        style={{ ...estilos.card, ...estilos.cardAnual, ...(selecionado === 'anual' ? estilos.cardAtivo : null) }}
        onClick={() => onSelecionar('anual')}
      >
        <div style={estilos.selo}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" /></svg>
          MAIS POPULAR
        </div>
        <div style={estilos.linha}>
          <span style={estilos.iconeBox}><IconeEscudo /></span>
          <div style={estilos.meio}>
            <div style={estilos.rotulo}>{anual.rotulo}</div>
            <div style={estilos.trialDestaque}>7 dias grátis</div>
            <div style={estilos.depois}>depois {anual.preco}{anual.periodo} · {anual.equivalente}</div>
            <div style={estilos.pillEconomia}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0f9d58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1" /></svg>
              {anual.economia}
            </div>
          </div>
          <Radio ativo={selecionado === 'anual'} />
        </div>
      </button>

      {/* Mensal — discreto */}
      <button
        type="button"
        style={{ ...estilos.card, ...(selecionado === 'mensal' ? estilos.cardAtivo : null) }}
        onClick={() => onSelecionar('mensal')}
      >
        <div style={estilos.linha}>
          <span style={estilos.iconeBox}><IconeCalendario /></span>
          <div style={estilos.meio}>
            <div style={estilos.rotulo}>{mensal.rotulo}</div>
            <div style={estilos.trialDestaque}>7 dias grátis</div>
            <div style={estilos.depois}>depois {mensal.preco}{mensal.periodo}</div>
          </div>
          <Radio ativo={selecionado === 'mensal'} />
        </div>
      </button>
    </div>
  );
}

const estilos = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { position: 'relative', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 14, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raioGrande, background: cores.superficie, boxShadow: sombraSuave },
  cardAnual: { borderColor: cores.acento, paddingTop: 18 },
  cardAtivo: { boxShadow: `0 0 0 2px ${cores.acento}` },
  selo: { position: 'absolute', top: -11, left: 16, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#2563eb', color: '#fff', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, padding: '4px 10px', borderRadius: 999 },
  linha: { display: 'flex', alignItems: 'center', gap: 13 },
  iconeBox: { flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: cores.acentoBg, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  meio: { flex: 1, minWidth: 0 },
  rotulo: { fontSize: 14, fontWeight: 800, color: cores.texto },
  trialDestaque: { fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: cores.acento, marginTop: 2 },
  depois: { fontSize: 12, fontWeight: 600, color: cores.textoSuave, marginTop: 2 },
  precoLinha: { display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 1 },
  preco: { fontSize: 23, fontWeight: 800, letterSpacing: -0.6, color: cores.texto },
  periodo: { fontSize: 13.5, fontWeight: 600, color: cores.textoSuave },
  equivalente: { fontSize: 12.5, fontWeight: 600, color: cores.textoSuave, marginTop: 2 },
  pillEconomia: { display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 9px', borderRadius: 999, background: 'rgba(15,157,88,0.12)', color: '#0f9d58', fontSize: 12, fontWeight: 800 },
  radio: { width: 22, height: 22, borderRadius: '50%', borderWidth: 2, borderStyle: 'solid', borderColor: cores.bordaForte, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flexShrink: 0 },
  radioAtivo: { borderColor: cores.acento },
  radioPonto: { width: 11, height: 11, borderRadius: '50%', background: cores.acento },
};
