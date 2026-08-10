// Retrospectiva do ano — "Seu {ano}". O ritual de fim de ano do conceito: o app
// olha para tudo que a pessoa viveu e organizou no ano e devolve num resumo
// afetivo, encerrando com a virada "{ano} → {ano+1}".
//
// Tudo é calculado dos dados locais (eventos + momentos). Sem rede, sem custo.
// Renderizada em tela cheia, aberta a partir da Minha História (Premium).

import { createPortal } from 'react-dom';
import { IconeCat } from './IconeCat';
import { IconeMontanha } from './IconeMontanha';
import { acharCategoriaMomento } from '../lib/momentoCategorias';
import { cores, raio, raioGrande } from '../lib/tema';

const COR_MOMENTO = '#bf9540';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function doAno(iso, ano) { return typeof iso === 'string' && iso.slice(0, 4) === String(ano); }

function Retrospectiva({ ano, eventos, momentos, categorias, onFechar }) {
  const evs = eventos.filter((e) => doAno(e.data, ano));
  const moms = momentos.filter((m) => doAno(m.data, ano)).sort((a, b) => a.data.localeCompare(b.data));

  // Categoria de compromisso mais presente no ano.
  const contagem = {};
  for (const e of evs) if (e.categoriaId) contagem[e.categoriaId] = (contagem[e.categoriaId] ?? 0) + 1;
  const topId = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0];
  const topCat = topId ? categorias.find((c) => c.id === topId) : null;

  // Mês mais movimentado (por nº de compromissos).
  const porMes = new Array(12).fill(0);
  for (const e of evs) { const m = Number(e.data.slice(5, 7)) - 1; if (m >= 0 && m < 12) porMes[m] += 1; }
  let mesTop = -1;
  for (let i = 0; i < 12; i++) if (porMes[i] > (mesTop === -1 ? 0 : porMes[mesTop])) mesTop = i;

  const nCategorias = new Set(evs.map((e) => e.categoriaId).filter(Boolean)).size;
  const temAlgo = evs.length > 0 || moms.length > 0;

  return createPortal(
    <div style={estilos.tela}>
      <div style={estilos.coluna}>
        <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {/* Capa */}
        <div style={estilos.capa}>
          <span style={estilos.capaSelo}><IconeMontanha tamanho={40} cor={COR_MOMENTO} /></span>
          <div style={estilos.capaRotulo}>Sua retrospectiva</div>
          <div style={estilos.capaAno}>{ano}</div>
          <p style={estilos.capaTexto}>Um ano da sua história chegou ao fim. Veja o que você viveu e organizou.</p>
        </div>

        {!temAlgo ? (
          <p style={estilos.vazio}>Ainda não há registros de {ano}. Conforme você usa o app, este resumo ganha vida.</p>
        ) : (
          <>
            {/* Números do ano */}
            <div style={estilos.numeros}>
              <Numero valor={evs.length} rotulo={evs.length === 1 ? 'compromisso' : 'compromissos'} />
              <Numero valor={moms.length} rotulo={moms.length === 1 ? 'momento' : 'momentos'} destaque />
              <Numero valor={nCategorias} rotulo={nCategorias === 1 ? 'categoria' : 'categorias'} />
            </div>

            {/* Momentos do ano — o coração da retrospectiva */}
            {moms.length > 0 && (
              <div style={estilos.bloco}>
                <div style={estilos.blocoTitulo}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={COR_MOMENTO} stroke="none" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7L6.8 18.2l1-5.8-4.3-4.1 5.9-.9z" /></svg>
                  Momentos de {ano}
                </div>
                {moms.map((m) => {
                  const cat = acharCategoriaMomento(m.categoria);
                  const [, mm, dd] = m.data.split('-').map(Number);
                  return (
                    <div key={m.id} style={estilos.momento}>
                      <span style={{ ...estilos.momentoIcone, background: cat.cor }}><IconeCat id={cat.icone} tamanho={16} cor="#fff" strokeWidth={2} /></span>
                      <span style={estilos.momentoTitulo}>{m.titulo}</span>
                      <span style={estilos.momentoData}>{dd} {MESES_CURTO[mm - 1]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Destaques calculados */}
            {(topCat || mesTop >= 0) && (
              <div style={estilos.bloco}>
                <div style={estilos.blocoTitulo}>Destaques</div>
                {topCat && (
                  <div style={estilos.destaque}>
                    <span style={{ ...estilos.destaqueIcone, background: topCat.cor }}><IconeCat id={topCat.icone} tamanho={16} cor="#fff" strokeWidth={2} /></span>
                    <div style={estilos.destaqueTexto}>
                      <div style={estilos.destaqueForte}>{topCat.nome}</div>
                      <div style={estilos.destaqueFraco}>sua área mais presente · {contagem[topId]} compromissos</div>
                    </div>
                  </div>
                )}
                {mesTop >= 0 && porMes[mesTop] > 0 && (
                  <div style={estilos.destaque}>
                    <span style={{ ...estilos.destaqueIcone, background: cores.acento }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                    </span>
                    <div style={estilos.destaqueTexto}>
                      <div style={{ ...estilos.destaqueForte, textTransform: 'capitalize' }}>{MESES[mesTop]}</div>
                      <div style={estilos.destaqueFraco}>seu mês mais movimentado · {porMes[mesTop]} compromissos</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Virada de ano */}
        <div style={estilos.virada}>
          <span style={estilos.viradaAno}>{ano}</span>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COR_MOMENTO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          <span style={{ ...estilos.viradaAno, color: COR_MOMENTO }}>{ano + 1}</span>
        </div>
        <p style={estilos.viradaTexto}>Que {ano + 1} traga novos momentos para a sua história.</p>

        <button style={estilos.botao} onClick={onFechar}>Fechar</button>
      </div>
    </div>,
    document.body,
  );
}

function Numero({ valor, rotulo, destaque }) {
  return (
    <div style={estilos.numero}>
      <div style={{ ...estilos.numeroValor, ...(destaque ? { color: COR_MOMENTO } : null) }}>{valor}</div>
      <div style={estilos.numeroRotulo}>{rotulo}</div>
    </div>
  );
}

const estilos = {
  tela: { position: 'fixed', inset: 0, zIndex: 500, background: cores.bg, display: 'flex', justifyContent: 'center', overflowY: 'auto' },
  coluna: { width: '100%', maxWidth: 460, boxSizing: 'border-box', minHeight: '100%', padding: '20px 22px calc(28px + env(safe-area-inset-bottom))' },
  fechar: { display: 'flex', marginLeft: 'auto', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },

  capa: { textAlign: 'center', padding: '10px 0 26px' },
  capaSelo: { display: 'inline-flex', marginBottom: 12 },
  capaRotulo: { fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: cores.textoApagado },
  capaAno: { fontSize: 64, fontWeight: 800, letterSpacing: -2, color: cores.texto, lineHeight: 1, margin: '4px 0 14px' },
  capaTexto: { fontSize: 15, color: cores.textoSuave, lineHeight: 1.5, margin: '0 auto', maxWidth: 320, fontWeight: 500 },

  vazio: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', lineHeight: 1.5, padding: '20px 10px' },

  numeros: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 },
  numero: { textAlign: 'center', background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, padding: '16px 8px' },
  numeroValor: { fontSize: 30, fontWeight: 800, letterSpacing: -1, color: cores.texto },
  numeroRotulo: { fontSize: 12, fontWeight: 600, color: cores.textoSuave, marginTop: 3 },

  bloco: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, padding: 16, marginBottom: 14 },
  blocoTitulo: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: cores.textoApagado, marginBottom: 12 },

  momento: { display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0' },
  momentoIcone: { flexShrink: 0, width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  momentoTitulo: { flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: cores.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  momentoData: { fontSize: 12.5, fontWeight: 700, color: cores.textoApagado },

  destaque: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' },
  destaqueIcone: { flexShrink: 0, width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  destaqueTexto: { minWidth: 0 },
  destaqueForte: { fontSize: 15, fontWeight: 800, color: cores.texto },
  destaqueFraco: { fontSize: 12.5, color: cores.textoSuave, marginTop: 1, fontWeight: 500 },

  virada: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28 },
  viradaAno: { fontSize: 30, fontWeight: 800, letterSpacing: -1, color: cores.textoApagado },
  viradaTexto: { textAlign: 'center', fontSize: 14.5, color: cores.textoSuave, lineHeight: 1.5, margin: '12px auto 0', maxWidth: 300, fontWeight: 500 },

  botao: { width: '100%', marginTop: 26, padding: '15px', borderRadius: raio, border: 'none', background: cores.acento, color: cores.acentoTexto, fontSize: 15.5, fontWeight: 800, cursor: 'pointer' },
};

export default Retrospectiva;
