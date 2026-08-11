// Bottom sheet do botão (+). Pergunta o que o usuário quer criar: um
// Compromisso ou uma Categoria (etiqueta). Embaixo, atalhos de acesso rápido
// que já abrem o compromisso com um período pré-selecionado.

import { createPortal } from 'react-dom';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

const ATALHOS = [
  { id: 'hoje', rotulo: 'Hoje', icone: 'calendario' },
  { id: 'manha', rotulo: 'Manhã', icone: 'sol', inicio: '09:00', fim: '10:00' },
  { id: 'tarde', rotulo: 'Tarde', icone: 'sol-tarde', inicio: '14:00', fim: '15:00' },
  { id: 'noite', rotulo: 'Noite', icone: 'lua', inicio: '20:00', fim: '21:00' },
  { id: 'importante', rotulo: 'Importante', icone: 'bandeira', importante: true },
];

function IconeAtalho({ id }) {
  const c = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: cores.texto, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'calendario') return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
  if (id === 'sol') return <svg {...c}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  if (id === 'sol-tarde') return <svg {...c}><path d="M17 18a5 5 0 0 0-10 0M12 2v3M4.2 10.2l1.4 1.4M18.4 11.6l1.4-1.4M2 18h20M5.6 6.3L4.2 4.9" /></svg>;
  if (id === 'lua') return <svg {...c}><path d="M20 14a8 8 0 1 1-8.9-11 6 6 0 0 0 8.9 11z" /></svg>;
  // bandeira
  return <svg {...c}><path d="M5 21V4M5 4h11l-1.5 4L16 12H5" /></svg>;
}

function MenuCriar({ onCompromisso, onEvento, onAniversario, onFechar }) {
  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label="O que você deseja criar">
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />
        <div style={estilos.cabecalho}>
          <div style={estilos.titulo}>O que você deseja criar?</div>
          <div style={estilos.sub}>Escolha uma opção para continuar</div>
        </div>

        <div style={estilos.opcoes}>
          <button style={estilos.opcao} onClick={() => onCompromisso()}>
            <span style={estilos.opcaoIcone}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" /></svg>
            </span>
            <span style={estilos.opcaoNome}>Compromisso</span>
            <span style={estilos.opcaoDesc}>Um lembrete no seu calendário</span>
          </button>

          <button style={estilos.opcao} onClick={() => onEvento()}>
            <span style={estilos.opcaoIcone}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><circle cx="9" cy="14" r="1.2" fill={cores.texto} stroke="none" /><circle cx="15" cy="14" r="1.2" fill={cores.texto} stroke="none" /><path d="M8 6a2 2 0 0 1 4 0M12 6a2 2 0 0 1 4 0" /></svg>
            </span>
            <span style={estilos.opcaoNome}>Evento</span>
            <span style={estilos.opcaoDesc}>Com convidados, local e anexos</span>
          </button>

          <button style={estilos.opcao} onClick={() => onAniversario()}>
            <span style={estilos.opcaoIcone}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M4 16c1.2 0 1.2 1 2.5 1s1.3-1 2.5-1 1.2 1 2.5 1 1.3-1 2.5-1 1.2 1 2.5 1 1.3-1 2.5-1M12 8V5M12 4.5a.7.7 0 1 0 0-.1z" /></svg>
            </span>
            <span style={estilos.opcaoNome}>Aniversário</span>
            <span style={estilos.opcaoDesc}>Datas especiais de quem você ama</span>
          </button>
        </div>

        <button style={estilos.cancelar} onClick={onFechar}>Cancelar</button>
      </div>
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(22px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 14px' },
  cabecalho: { textAlign: 'center', marginBottom: 18 },
  titulo: { fontSize: 20, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  sub: { fontSize: 13.5, color: cores.textoSuave, marginTop: 4, fontWeight: 500 },

  opcoes: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 },
  opcao: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 7, padding: '16px 8px', borderRadius: raioGrande, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  opcaoIcone: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: '50%', background: cores.superficie, border: `1px solid ${cores.borda}`, marginBottom: 2 },
  opcaoNome: { fontSize: 14.5, fontWeight: 700, color: cores.texto },
  opcaoDesc: { fontSize: 11, fontWeight: 500, color: cores.textoSuave, lineHeight: 1.35 },
  linkCategoria: { width: '100%', marginTop: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie, color: cores.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },

  rapidoTitulo: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: cores.textoApagado, textAlign: 'center', margin: '22px 0 14px' },
  atalhos: { display: 'flex', justifyContent: 'space-between', gap: 6 },
  atalho: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },
  atalhoBolha: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: cores.superficie2, border: `1px solid ${cores.borda}` },
  atalhoRotulo: { fontSize: 12, fontWeight: 600, color: cores.textoSuave },

  cancelar: { width: '100%', marginTop: 20, padding: '13px', borderRadius: 999, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie, color: cores.textoSuave, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' },
};

export default MenuCriar;
