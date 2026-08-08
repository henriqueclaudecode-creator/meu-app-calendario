// Aba Mapa da Vida — uma constelação da vida do usuário.
//
// No centro fica "Você". Ao redor, cada etiqueta vira um "planeta": quanto mais
// usada no período, maior o círculo e mais perto do centro. Linhas discretas
// ligam tudo ao centro, sobre órbitas concêntricas. Não é um dashboard: é para
// dar a sensação de olhar para a própria vida.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { listarEventos } from '../db/eventos';
import { listarCategorias } from '../db/categorias';
import { hojeISO } from '../lib/datas';
import { IconeCat } from '../components/IconeCat';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

// Períodos do filtro (do mais curto ao mais amplo).
const PERIODOS = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'ano', rotulo: 'Ano' },
  { id: 'vida', rotulo: 'Toda a vida' },
];

function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function noPeriodo(dataIso, periodo, hoje) {
  if (periodo === 'vida') return true;
  if (periodo === 'hoje') return dataIso === hoje;
  if (periodo === 'mes') return dataIso.slice(0, 7) === hoje.slice(0, 7);
  if (periodo === 'ano') return dataIso.slice(0, 4) === hoje.slice(0, 4);
  // semana: segunda a domingo da semana atual
  const h = dataLocal(hoje);
  const dow = (h.getDay() + 6) % 7;
  const seg = new Date(h); seg.setDate(h.getDate() - dow);
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
  const dd = dataLocal(dataIso);
  return dd >= seg && dd <= dom;
}

// Duração em horas de um evento (sem horário conta 0; com início e sem fim, 1h).
function horasDe(e) {
  if (!e.inicio) return 0;
  if (!e.fim) return 1;
  const [hi, mi] = e.inicio.split(':').map(Number);
  const [hf, mf] = e.fim.split(':').map(Number);
  const min = (hf * 60 + mf) - (hi * 60 + mi);
  return min > 0 ? min / 60 : 0;
}

function fmtHoras(h) {
  if (h === 0) return '0h';
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
}

// Maior sequência de dias consecutivos com pelo menos um evento (na lista dada).
function maiorSequencia(datasIso) {
  const dias = [...new Set(datasIso)].sort();
  let melhor = dias.length ? 1 : 0;
  let atual = 1;
  for (let i = 1; i < dias.length; i++) {
    const diff = Math.round((dataLocal(dias[i]) - dataLocal(dias[i - 1])) / 86400000);
    atual = diff === 1 ? atual + 1 : 1;
    if (atual > melhor) melhor = atual;
  }
  return melhor;
}

function MapaVida() {
  const hoje = hojeISO();
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [detalhe, setDetalhe] = useState(null);
  const [pronto, setPronto] = useState(false);

  const areaRef = useRef(null);
  const [lado, setLado] = useState(340);

  useEffect(() => {
    (async () => {
      try {
        const [evs, cats] = await Promise.all([listarEventos(), listarCategorias()]);
        setEventos(evs);
        setCategorias(cats);
      } catch { /* vazio */ }
    })();
  }, []);

  // Mede a área para posicionar tudo proporcionalmente (funciona no mobile).
  useLayoutEffect(() => {
    if (!areaRef.current) return;
    const medir = () => {
      const w = areaRef.current?.clientWidth ?? 340;
      setLado(Math.min(w, 380));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, []);

  // Dispara a animação de entrada depois do primeiro paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPronto(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // --- Cálculo dos nós a partir dos eventos do período ---
  const evsPeriodo = eventos.filter((e) => noPeriodo(e.data, periodo, hoje));
  const porCat = new Map();
  for (const e of evsPeriodo) {
    const id = e.categoriaId ?? '__sem__';
    if (!porCat.has(id)) porCat.set(id, { eventos: 0, horas: 0, datas: [] });
    const acc = porCat.get(id);
    acc.eventos += 1;
    acc.horas += horasDe(e);
    acc.datas.push(e.data);
  }

  const nós = [];
  for (const cat of categorias) {
    const d = porCat.get(cat.id);
    if (!d || d.eventos === 0) continue;
    nós.push({ cat, ...d, peso: d.eventos * 0.6 + d.horas * 0.4 });
  }
  nós.sort((a, b) => b.peso - a.peso);

  const pesoMax = nós.reduce((m, n) => Math.max(m, n.peso), 0);
  const pesoTotal = nós.reduce((s, n) => s + n.peso, 0);

  // Geometria proporcional ao lado da área.
  const cx = lado / 2;
  const cy = lado / 2;
  const centroD = lado * 0.20;
  const distMin = lado * 0.25;
  const distMax = lado * 0.36;
  const escalaN = Math.max(0.5, Math.min(1, 6 / Math.max(nós.length, 1)));
  const tamMin = lado * 0.13 * escalaN + lado * 0.02;
  const tamMax = lado * 0.22 * escalaN + lado * 0.02;

  const posicionados = nós.map((n, i) => {
    const norm = pesoMax > 0 ? n.peso / pesoMax : 0;
    const size = tamMin + norm * (tamMax - tamMin);
    const dist = distMax - norm * (distMax - distMin);
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / nós.length;
    const nodeCx = cx + Math.cos(ang) * dist;
    const nodeCy = cy + Math.sin(ang) * dist;
    const percent = pesoTotal > 0 ? Math.round((n.peso / pesoTotal) * 100) : 0;
    return { ...n, size, nodeCx, nodeCy, percent, topHalf: nodeCy < cy };
  });

  // Resumo do período.
  const totalComp = evsPeriodo.length;
  const totalHoras = evsPeriodo.reduce((s, e) => s + horasDe(e), 0);
  const seqGeral = maiorSequencia(evsPeriodo.map((e) => e.data));
  const nCategorias = posicionados.length;

  return (
    <div style={estilos.pagina}>
      <div style={estilos.cabecalho}>
        <h1 style={estilos.titulo}>Mapa da Vida</h1>
        <p style={estilos.subtitulo}>Uma visão geral da sua vida organizada</p>
      </div>

      {/* Filtro de período */}
      <div style={estilos.filtros} className="sem-barra">
        {PERIODOS.map((p) => (
          <button key={p.id} style={{ ...estilos.filtro, ...(periodo === p.id ? estilos.filtroAtivo : null) }} onClick={() => setPeriodo(p.id)}>
            {p.rotulo}
          </button>
        ))}
      </div>

      {/* Constelação */}
      <div ref={areaRef} style={estilos.areaWrap}>
        <div style={{ ...estilos.area, width: lado, height: lado }}>
          {/* Órbitas + linhas */}
          <svg width={lado} height={lado} style={estilos.svg} aria-hidden="true">
            {[0.5, 0.72, 0.94].map((f, i) => (
              <circle key={i} cx={cx} cy={cy} r={(lado / 2) * f * 0.86} fill="none" stroke={cores.borda} strokeWidth="1" opacity={0.55} />
            ))}
            {posicionados.map((n, i) => (
              <line
                key={n.cat.id}
                x1={cx} y1={cy} x2={n.nodeCx} y2={n.nodeCy}
                stroke={n.cat.cor} strokeWidth="1.3"
                opacity={pronto ? 0.35 : 0}
                style={{ transition: `opacity 0.5s ease ${150 + i * 90}ms` }}
              />
            ))}
          </svg>

          {/* Centro "Você" */}
          <div style={{ ...estilos.centro, width: centroD, height: centroD, left: cx - centroD / 2, top: cy - centroD / 2, opacity: pronto ? 1 : 0, transform: pronto ? 'scale(1)' : 'scale(0.4)' }}>
            <svg width={centroD * 0.34} height={centroD * 0.34} viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
            <span style={{ ...estilos.centroTexto, fontSize: centroD * 0.15 }}>Você</span>
          </div>

          {/* Planetas (etiquetas) */}
          {posicionados.map((n, i) => {
            const transladar = pronto ? 'translate(0,0) scale(1)' : `translate(${cx - n.nodeCx}px, ${cy - n.nodeCy}px) scale(0.2)`;
            return (
              <button
                key={n.cat.id}
                onClick={() => setDetalhe(n)}
                style={{
                  ...estilos.planeta,
                  left: n.nodeCx - n.size / 2, top: n.nodeCy - n.size / 2, width: n.size, height: n.size,
                  opacity: pronto ? 1 : 0, transform: transladar,
                  transition: `transform 0.5s cubic-bezier(0.16,1,0.3,1) ${120 + i * 90}ms, opacity 0.4s ease ${120 + i * 90}ms, left 0.5s ease, top 0.5s ease, width 0.4s ease, height 0.4s ease`,
                }}
              >
                <span style={{ ...estilos.planetaBola, width: n.size, height: n.size, background: n.cat.cor }}>
                  <IconeCat id={n.cat.icone} tamanho={Math.round(n.size * 0.4)} cor="#fff" strokeWidth={2} />
                </span>
                <span style={{ ...estilos.planetaLabel, ...(n.topHalf ? { bottom: n.size + 4 } : { top: n.size + 4 }) }}>
                  <span style={estilos.planetaNome}>{n.cat.nome}</span>
                  <span style={estilos.planetaPct}>{n.percent}%</span>
                  <span style={estilos.planetaHoras}>{fmtHoras(n.horas)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {posicionados.length === 0 && (
          <div style={estilos.vazioSobre}>
            <div style={estilos.vazioTitulo}>Nada neste período</div>
            <p style={estilos.vazioTexto}>Crie compromissos com etiquetas para ver sua vida se organizar aqui.</p>
          </div>
        )}
      </div>

      {posicionados.length > 0 && <p style={estilos.dica}>Toque em uma etiqueta para ver mais detalhes</p>}

      {/* Resumo do período */}
      <div style={estilos.resumo}>
        <div style={estilos.resumoTitulo}>Resumo do período</div>
        <div style={estilos.resumoGrade}>
          <Tile valor={totalComp} rotulo="Compromissos" />
          <Tile valor={fmtHoras(Math.round(totalHoras))} rotulo="Tempo total" />
          <Tile valor={nCategorias} rotulo="Categorias" />
          <Tile valor={seqGeral} rotulo="Maior sequência" />
        </div>
      </div>

      {detalhe && <DetalheEtiqueta n={detalhe} onFechar={() => setDetalhe(null)} />}
    </div>
  );
}

function Tile({ valor, rotulo }) {
  return (
    <div style={estilos.tile}>
      <div style={estilos.tileValor}>{valor}</div>
      <div style={estilos.tileRotulo}>{rotulo}</div>
    </div>
  );
}

function DetalheEtiqueta({ n, onFechar }) {
  const datas = [...n.datas].sort();
  const primeiro = datas[0];
  const ultimo = datas[datas.length - 1];
  const seq = maiorSequencia(n.datas);
  const fmt = (iso) => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };

  return (
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true">
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />
        <div style={estilos.detCabecalho}>
          <span style={{ ...estilos.detIcone, background: n.cat.cor }}><IconeCat id={n.cat.icone} tamanho={24} cor="#fff" strokeWidth={2} /></span>
          <div>
            <div style={estilos.detNome}>{n.cat.nome}</div>
            <div style={estilos.detPct}>{n.percent}% da sua vida no período</div>
          </div>
        </div>
        <div style={estilos.detGrade}>
          <Linha rotulo="Compromissos" valor={n.eventos} />
          <Linha rotulo="Horas totais" valor={fmtHoras(n.horas)} />
          <Linha rotulo="Maior sequência" valor={`${seq} ${seq === 1 ? 'dia' : 'dias'}`} />
          <Linha rotulo="Primeiro" valor={fmt(primeiro)} />
          <Linha rotulo="Último" valor={fmt(ultimo)} />
        </div>
        <button style={estilos.fechar} onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }) {
  return (
    <div style={estilos.detLinha}>
      <span style={estilos.detLinhaRot}>{rotulo}</span>
      <span style={estilos.detLinhaVal}>{valor}</span>
    </div>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 560, boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 90px' },
  cabecalho: { padding: '4px 2px 14px', textAlign: 'center' },
  titulo: { fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: cores.texto, margin: 0 },
  subtitulo: { fontSize: 13.5, color: cores.textoSuave, margin: '4px 0 0', fontWeight: 500 },

  filtros: { display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 4px', justifyContent: 'center' },
  filtro: { flexShrink: 0, padding: '8px 14px', borderRadius: 999, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie, color: cores.textoSuave, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroAtivo: { background: cores.acento, borderColor: cores.acento, color: cores.textoClaro },

  areaWrap: { position: 'relative', display: 'flex', justifyContent: 'center', margin: '10px 0 4px', minHeight: 320 },
  area: { position: 'relative' },
  svg: { position: 'absolute', inset: 0, pointerEvents: 'none' },

  centro: { position: 'absolute', borderRadius: '50%', background: cores.superficie2, border: `1px solid ${cores.bordaForte}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
  centroTexto: { fontWeight: 800, color: cores.texto, letterSpacing: -0.3 },

  planeta: { position: 'absolute', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' },
  planetaBola: { position: 'relative', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' },
  planetaLabel: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15, whiteSpace: 'nowrap' },
  planetaNome: { fontSize: 12, fontWeight: 700, color: cores.texto },
  planetaPct: { fontSize: 13, fontWeight: 800, color: cores.texto },
  planetaHoras: { fontSize: 11, fontWeight: 600, color: cores.textoSuave },

  vazioSobre: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 },
  vazioTitulo: { fontSize: 16, fontWeight: 800, color: cores.texto },
  vazioTexto: { fontSize: 13.5, color: cores.textoSuave, marginTop: 6, lineHeight: 1.5, maxWidth: 280 },

  dica: { textAlign: 'center', fontSize: 12.5, color: cores.textoApagado, fontWeight: 600, margin: '6px 0 16px' },

  resumo: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, padding: 16, marginTop: 6 },
  resumoTitulo: { fontSize: 15, fontWeight: 800, color: cores.texto, marginBottom: 14 },
  resumoGrade: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  tile: { textAlign: 'center' },
  tileValor: { fontSize: 20, fontWeight: 800, color: cores.texto, letterSpacing: -0.5 },
  tileRotulo: { fontSize: 11, fontWeight: 600, color: cores.textoSuave, marginTop: 3, lineHeight: 1.2 },

  fundo: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(20px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 16px' },
  detCabecalho: { display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 },
  detIcone: { flexShrink: 0, width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detNome: { fontSize: 19, fontWeight: 800, color: cores.texto, letterSpacing: -0.3 },
  detPct: { fontSize: 13, color: cores.textoSuave, marginTop: 2, fontWeight: 500 },
  detGrade: { borderTop: `1px solid ${cores.borda}` },
  detLinha: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 2px', borderBottom: `1px solid ${cores.borda}` },
  detLinhaRot: { fontSize: 14, color: cores.textoSuave, fontWeight: 600 },
  detLinhaVal: { fontSize: 14.5, color: cores.texto, fontWeight: 700 },
  fechar: { width: '100%', marginTop: 18, padding: '13px', borderRadius: 999, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.textoSuave, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' },
};

export default MapaVida;
