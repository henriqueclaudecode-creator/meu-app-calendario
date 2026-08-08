// Painel "Seja Pro" — a vitrine do Orbi Pro. Usado na aba Mais e dentro do
// paywall (bottom sheet). Visual do mockup do tema Padrão, adaptado aos demais
// temas pelas variáveis de cor (cores.*), então nunca fica destoante.
//
// O botão principal oferece o teste grátis de 7 dias (a assinatura, com trial,
// é criada pela Google Play na fase 2).

import { useState } from 'react';
import Planos from './Planos';
import { IconeOrbi } from './IconeOrbi';
import { PLANOS } from '../lib/premium';
import { cores, raio, raioGrande, sombra, sombraSuave } from '../lib/tema';

const RECURSOS = [
  { id: 'temas', titulo: 'Temas Premium', desc: 'Acesso a todos os temas atuais e aos próximos lançamentos.', icone: 'rolo' },
  { id: 'mapa', titulo: 'Mapa da Vida', desc: 'Visualize sua vida completa de forma inteligente e conectada.', icone: 'livro' },
  { id: 'historia', titulo: 'Minha História', desc: 'Explore toda a sua jornada sem limitações e com mais detalhes.', icone: 'mapa' },
  { id: 'widgets', titulo: 'Widgets', desc: 'Widgets de calendário e próximos eventos na tela inicial.', icone: 'widget' },
  { id: 'novas', titulo: 'Novas funcionalidades', desc: 'Receba novos recursos exclusivos do Orbi Pro assim que forem lançados.', icone: 'brilho' },
  { id: 'beneficios', titulo: 'Benefícios exclusivos', desc: 'Aproveite experiências e conteúdos exclusivos para usuários Pro.', icone: 'coroa' },
];

function IconeRecurso({ id }) {
  const c = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: cores.acento, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'rolo') return <svg {...c}><rect x="3" y="4" width="13" height="6" rx="1.5" /><path d="M16 7h3a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-6a2 2 0 0 0-2 2V16" /><rect x="9" y="16" width="4" height="5" rx="1" /></svg>;
  if (id === 'livro') return <svg {...c}><path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5z" /><path d="M12 6.5V20" /></svg>;
  if (id === 'mapa') return <svg {...c}><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 4z" /><path d="M9 4v13.5M15 6.5V20" /></svg>;
  if (id === 'brilho') return <svg {...c}><path d="M12 3l1.7 4.6L18.5 9l-4.8 1.4L12 15l-1.7-4.6L5.5 9l4.8-1.4z" /><path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></svg>;
  if (id === 'widget') return <svg {...c}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
  return <svg {...c}><path d="M4 8.5l3.8 3.2L12 5l4.2 6.7L20 8.5 18.4 19H5.6z" /></svg>;
}

export default function PainelPro({ onAssinar, onFechar }) {
  const [plano, setPlano] = useState('anual');
  const sel = PLANOS[plano];

  return (
    <div style={estilos.pagina}>
      {/* Herói */}
      <div style={estilos.heroi}>
        <span style={estilos.heroiIcone}><IconeOrbi tamanho={34} /></span>
        <div style={estilos.heroiTexto}>
          <div style={estilos.titulo}>Seja <span style={estilos.tituloPro}>Pro</span></div>
          <div style={estilos.subtitulo}>Desbloqueie todos os recursos premium do <span style={estilos.marca}>Orbi</span>.</div>
        </div>
      </div>

      {/* Banner de teste grátis */}
      <div style={estilos.banner}>
        <span style={estilos.bannerIcone} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.acento} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 7.5 4.5 9 8 12 8zM12 8s1.5-5 4.5-3.5S15 8 12 8z" /></svg>
        </span>
        <div>
          <div style={estilos.bannerTitulo}>7 dias grátis para testar tudo</div>
          <div style={estilos.bannerSub}>{sel.preco}{sel.periodo} após o período de teste. Cancele antes do fim para não ser cobrado.</div>
        </div>
      </div>

      {/* Benefícios */}
      <div style={estilos.secaoTitulo}>O que você desbloqueia</div>
      <div style={estilos.grade}>
        {RECURSOS.map((r) => (
          <div key={r.id} style={estilos.recurso}>
            <span style={estilos.recursoIcone}><IconeRecurso id={r.icone} /></span>
            <span style={estilos.recursoTitulo}>{r.titulo}</span>
          </div>
        ))}
      </div>

      {/* Planos */}
      <div style={estilos.planosWrap}>
        <Planos selecionado={plano} onSelecionar={setPlano} />
      </div>

      {/* CTA */}
      <button style={estilos.cta} onClick={() => onAssinar(plano)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        Começar teste grátis
      </button>
      {onFechar && <button style={estilos.agora} onClick={onFechar}>Agora não</button>}

      {/* Aviso de cobrança */}
      <div style={estilos.aviso}>
        Você não será cobrado durante os 7 dias. Após o período de teste, sua assinatura
        será renovada automaticamente por {sel.preco}{sel.periodo}, salvo cancelamento.
      </div>

      {/* Rodapé */}
      <div style={estilos.rodape}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cores.textoApagado} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
        Cancele quando quiser. Sem taxas de cancelamento.
      </div>
      <div style={estilos.rodapeGoogle}>As assinaturas são gerenciadas pela Google Play.</div>
    </div>
  );
}

const estilos = {
  pagina: {},
  heroi: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  heroiIcone: { flexShrink: 0, width: 54, height: 54, borderRadius: 15, background: '#ffffff', border: `1px solid ${cores.borda}`, boxShadow: sombra, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroiTexto: { minWidth: 0 },
  titulo: { fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: cores.texto, lineHeight: 1.05 },
  tituloPro: { color: cores.acento },
  subtitulo: { fontSize: 13, color: cores.textoSuave, marginTop: 3, fontWeight: 500, lineHeight: 1.4 },
  marca: { color: cores.acento, fontWeight: 700 },

  banner: { display: 'flex', alignItems: 'center', gap: 12, background: cores.acentoBg, border: `1px solid ${cores.acento}22`, borderRadius: raioGrande, padding: '14px 16px', marginBottom: 16 },
  bannerIcone: { flexShrink: 0, display: 'flex' },
  bannerTitulo: { fontSize: 17, fontWeight: 900, color: cores.acento, letterSpacing: -0.4 },
  bannerSub: { fontSize: 12, color: cores.textoSuave, marginTop: 3, fontWeight: 500, lineHeight: 1.4 },

  secaoTitulo: { fontSize: 12, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: cores.textoApagado, margin: '0 0 9px 2px' },
  grade: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 },
  recurso: { display: 'flex', alignItems: 'center', gap: 8, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '9px 10px' },
  recursoIcone: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: cores.acentoBg },
  recursoTitulo: { fontSize: 12.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2, lineHeight: 1.15 },

  planosWrap: { marginBottom: 14 },
  cta: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', letterSpacing: -0.2 },
  agora: { width: '100%', marginTop: 6, padding: '10px', border: 'none', borderRadius: raio, background: 'transparent', color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  aviso: { fontSize: 11, lineHeight: 1.45, fontWeight: 500, color: cores.textoApagado, textAlign: 'center', margin: '10px 4px 0' },
  rodape: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: cores.textoApagado, margin: '12px 0 3px', textAlign: 'center' },
  rodapeGoogle: { textAlign: 'center', fontSize: 11, color: cores.textoFraco, fontWeight: 500 },
};
