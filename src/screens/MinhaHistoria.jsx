// Aba Minha História — a linha do tempo da vida do usuário.
//
// Os compromissos aparecem em ordem (mais recentes primeiro), agrupados por dia,
// sobre um trilho vertical com pontos na cor da etiqueta. Embaixo, "Conquistas"
// geradas a partir dos próprios dados — quase uma autobiografia do que a pessoa
// organizou.

import BotaoMenu from '../components/BotaoMenu';
import PreviewPremium from '../components/PreviewPremium';
import NovoMomento from '../components/NovoMomento';
import Retrospectiva from '../components/Retrospectiva';
import { useEffect, useState } from 'react';
import { listarEventos } from '../db/eventos';
import { listarMomentos } from '../db/momentos';
import { listarCategorias } from '../db/categorias';
import { acharCategoriaMomento } from '../lib/momentoCategorias';
import { hojeISO } from '../lib/datas';
import { IconeCat } from '../components/IconeCat';
import { IconeMontanha } from '../components/IconeMontanha';
import { cores, raio, raioGrande } from '../lib/tema';

// Cor de destaque dos momentos de vida (dourado do app).
const COR_MOMENTO = '#bf9540';

const FILTROS = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'dia', rotulo: 'Dia' },
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'ano', rotulo: 'Ano' },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dataLocal(iso) { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); }
function diasEntre(aIso, bIso) { return Math.round((dataLocal(bIso) - dataLocal(aIso)) / 86400000); }

function rotuloData(iso, hoje) {
  const dd = diasEntre(iso, hoje);
  const dt = dataLocal(iso);
  const base = `${dt.getDate()} ${MESES[dt.getMonth()]} · ${DIAS[dt.getDay()]}`;
  if (dd === 0) return { forte: 'Hoje', fraco: base };
  if (dd === 1) return { forte: 'Ontem', fraco: base };
  return { forte: `${dt.getDate()} ${MESES[dt.getMonth()].toUpperCase()}`, fraco: DIAS[dt.getDay()] };
}

function dataLonga(iso) { const [a, m, d] = iso.split('-').map(Number); return `${d} de ${MESES_LONGOS[m - 1]} de ${a}`; }

function noFiltro(iso, filtro, hoje) {
  if (filtro === 'tudo') return true;
  if (filtro === 'dia') return iso === hoje;
  if (filtro === 'mes') return iso.slice(0, 7) === hoje.slice(0, 7);
  if (filtro === 'ano') return iso.slice(0, 4) === hoje.slice(0, 4);
  const h = dataLocal(hoje); const dow = (h.getDay() + 6) % 7;
  const seg = new Date(h); seg.setDate(h.getDate() - dow);
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
  const d = dataLocal(iso);
  return d >= seg && d <= dom;
}

// Maior sequência de dias consecutivos com evento; devolve tamanho e último dia.
function maiorSequencia(datasIso) {
  const dias = [...new Set(datasIso)].sort();
  if (!dias.length) return { len: 0, fim: null };
  let melhor = 1, atual = 1, fimMelhor = dias[0];
  for (let i = 1; i < dias.length; i++) {
    const diff = diasEntre(dias[i - 1], dias[i]);
    atual = diff === 1 ? atual + 1 : 1;
    if (atual > melhor) { melhor = atual; fimMelhor = dias[i]; }
  }
  return { len: melhor, fim: fimMelhor };
}

function marco(total, marcos) {
  let m = 0;
  for (const x of marcos) if (total >= x) m = x;
  return m;
}

function calcularConquistas(eventos, categorias) {
  const conquistas = [];
  const porData = [...eventos].sort((a, b) => a.data.localeCompare(b.data));
  const total = eventos.length;

  const mComp = marco(total, [10, 25, 50, 100, 250]);
  if (mComp) {
    conquistas.push({ id: 'comp', icone: 'trofeu', cor: '#bf9540', titulo: `Você completou ${mComp} compromissos.`, data: porData[mComp - 1]?.data });
  }

  const seq = maiorSequencia(eventos.map((e) => e.data));
  if (seq.len >= 3) {
    conquistas.push({ id: 'seq', icone: 'chama', cor: '#b0563c', titulo: `${seq.len} dias seguidos organizando sua rotina.`, data: seq.fim });
  }

  // Categoria com mais compromissos.
  const contagem = {};
  for (const e of eventos) if (e.categoriaId) contagem[e.categoriaId] = (contagem[e.categoriaId] ?? 0) + 1;
  const topId = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0];
  if (topId) {
    const cat = categorias.find((c) => c.id === topId);
    const n = contagem[topId];
    const mCat = marco(n, [5, 10, 25, 50, 100]);
    if (cat && mCat) {
      const ultimaData = eventos.filter((e) => e.categoriaId === topId).map((e) => e.data).sort().slice(-1)[0];
      conquistas.push({ id: 'cat', icone: cat.icone, cor: cat.cor, titulo: `A categoria ${cat.nome} atingiu ${mCat} compromissos.`, data: ultimaData });
    }
  }

  // Nº de categorias criadas.
  if (categorias.length >= 3) {
    const ult = [...categorias].sort((a, b) => (a.criado_em ?? 0) - (b.criado_em ?? 0))[categorias.length - 1];
    const dataCat = ult?.criado_em ? new Date(ult.criado_em).toISOString().slice(0, 10) : null;
    conquistas.push({ id: 'ncat', icone: 'medalha', cor: '#35576b', titulo: `Você criou sua ${categorias.length}ª categoria.`, data: dataCat });
  }

  return conquistas;
}

function IconeConquista({ id, cor }) {
  const c = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'trofeu') return <IconeMontanha tamanho={30} cor="#fff" />;
  if (id === 'chama') return <svg {...c}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.3-3.6C9 10 10 11 10 12c0-2 2-3 2-9z" /></svg>;
  if (id === 'medalha') return <svg {...c}><circle cx="12" cy="14" r="6" /><path d="M8.5 8.5L6 3h4l2 3 2-3h4l-2.5 5.5M12 11.5l1 2 2 .2-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 13.7l2-.2z" /></svg>;
  return <IconeCat id={id} tamanho={22} cor="#fff" strokeWidth={2} />;
}

function MinhaHistoria({ onAbrirMenu }) {
  const hoje = hojeISO();
  const [eventos, setEventos] = useState([]);
  const [momentos, setMomentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState('tudo');
  // Controla se os compromissos comuns aparecem. null = automático (escondidos
  // nos períodos longos, para os momentos não se afogarem); bool = escolha do usuário.
  const [verComp, setVerComp] = useState(null);
  const [form, setForm] = useState(null); // null | { momento } — abre o NovoMomento
  const [retro, setRetro] = useState(false); // abre a Retrospectiva do ano

  async function carregar() {
    try {
      const [evs, moms, cats] = await Promise.all([listarEventos(), listarMomentos(), listarCategorias()]);
      setEventos(evs);
      setMomentos(moms);
      setCategorias(cats);
    } catch { /* vazio */ }
  }
  useEffect(() => { carregar(); }, []);

  const etiquetaDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;

  // Nos períodos amplos ("Tudo"/"Ano"), esconde compromissos comuns por padrão —
  // a linha do tempo conta a HISTÓRIA (momentos + destaques), não o histórico.
  const escondeAuto = filtro === 'tudo' || filtro === 'ano';
  const mostrarComp = verComp === null ? !escondeAuto : verComp;

  const momFiltrados = momentos.filter((m) => noFiltro(m.data, filtro, hoje));
  const evFiltrados = eventos.filter((e) => noFiltro(e.data, filtro, hoje));
  // Quando os compromissos estão recolhidos, os favoritos (destaques) continuam.
  const evVisiveis = mostrarComp ? evFiltrados : evFiltrados.filter((e) => e.favorito);
  const compOcultos = evFiltrados.length - evVisiveis.length;

  // Mescla momentos + eventos numa única linha do tempo (data desc; no mesmo dia,
  // momentos primeiro, depois por horário desc).
  const itens = [
    ...momFiltrados.map((m) => ({ chave: m.id, momento: true, data: m.data, ord: '~', ref: m })),
    ...evVisiveis.map((e) => ({ chave: e.id, momento: false, data: e.data, ord: e.inicio ?? '', ref: e })),
  ].sort((a, b) => b.data.localeCompare(a.data) || b.ord.localeCompare(a.ord));

  const grupos = [];
  for (const it of itens) {
    let g = grupos.find((x) => x.data === it.data);
    if (!g) { g = { data: it.data, itens: [] }; grupos.push(g); }
    g.itens.push(it);
  }

  const conquistas = calcularConquistas(eventos, categorias);

  // Retrospectiva: só faz sentido oferecer se o ano atual tem algum registro.
  const anoAtual = Number(hoje.slice(0, 4));
  const ehDezembro = Number(hoje.slice(5, 7)) === 12;
  const temRetro = eventos.some((e) => e.data?.slice(0, 4) === String(anoAtual))
    || momentos.some((m) => m.data?.slice(0, 4) === String(anoAtual));

  return (
    <div style={estilos.pagina}>
      <div style={{ ...estilos.cabecalho, display: 'flex', alignItems: 'center', gap: 4 }}>
        <BotaoMenu onAbrir={onAbrirMenu} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={estilos.titulo}>Minha História <IconeMontanha tamanho={34} cor={COR_MOMENTO} style={estilos.montanhaTitulo} /></h1>
          <p style={estilos.subtitulo}>Sua jornada, dia após dia</p>
        </div>
        <button style={estilos.btnMomento} onClick={() => setForm({ momento: null })}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <span style={estilos.btnMomentoTexto}>Momento</span>
        </button>
      </div>

      <PreviewPremium titulo="Minha História" descricao="Sua linha do tempo completa e as conquistas geradas a partir da sua própria rotina.">

      <div style={estilos.filtros} className="sem-barra">
        {FILTROS.map((f) => (
          <button key={f.id} style={{ ...estilos.filtro, ...(filtro === f.id ? estilos.filtroAtivo : null) }} onClick={() => { setFiltro(f.id); setVerComp(null); }}>
            {f.rotulo}
          </button>
        ))}
      </div>

      {temRetro && (
        <button style={estilos.retroCard} onClick={() => setRetro(true)}>
          <span style={estilos.retroSelo}><IconeMontanha tamanho={26} cor={COR_MOMENTO} /></span>
          <div style={estilos.retroTexto}>
            <div style={estilos.retroTitulo}>Seu {anoAtual}</div>
            <div style={estilos.retroSub}>{ehDezembro ? 'Um ano chegou ao fim — veja sua retrospectiva' : 'Veja a retrospectiva do seu ano'}</div>
          </div>
          <span style={estilos.retroSeta} aria-hidden="true">›</span>
        </button>
      )}

      {grupos.length === 0 ? (
        <div style={estilos.vazioBox}>
          <p style={estilos.vazio}>Registre um momento que marcou sua vida — nascimento, casamento, uma conquista.</p>
          <button style={estilos.vazioBtn} onClick={() => setForm({ momento: null })}>+ Adicionar momento</button>
        </div>
      ) : (
        <div style={estilos.timeline}>
          {grupos.map((g) => {
            const rot = rotuloData(g.data, hoje);
            return (
              <div key={g.data} style={estilos.grupo}>
                <div style={estilos.dataCol}>
                  <div style={estilos.dataForte}>{rot.forte}</div>
                  <div style={estilos.dataFraco}>{rot.fraco}</div>
                </div>
                <div style={estilos.itens}>
                  {g.itens.map((it) => it.momento
                    ? <MomentoItem key={it.chave} momento={it.ref} onAbrir={() => setForm({ momento: it.ref })} />
                    : <EventoItem key={it.chave} evento={it.ref} etiqueta={etiquetaDe(it.ref)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compOcultos > 0 && (
        <button style={estilos.verComp} onClick={() => setVerComp(true)}>
          Mostrar {compOcultos} {compOcultos === 1 ? 'compromisso' : 'compromissos'} deste período
        </button>
      )}
      {mostrarComp && escondeAuto && evFiltrados.some((e) => !e.favorito) && (
        <button style={estilos.verComp} onClick={() => setVerComp(false)}>
          Mostrar só os momentos
        </button>
      )}

      {conquistas.length > 0 && (
        <>
          <div style={estilos.secaoTitulo}>
            <IconeMontanha tamanho={20} cor={cores.textoApagado} />
            Conquistas
          </div>
          {conquistas.map((c) => (
            <div key={c.id} style={estilos.conquista}>
              <span style={{ ...estilos.conquistaIcone, background: c.cor }}><IconeConquista id={c.icone} cor={c.cor} /></span>
              <div style={estilos.conquistaTexto}>
                <div style={estilos.conquistaTitulo}>{c.titulo}</div>
                {c.data && <div style={estilos.conquistaData}>{dataLonga(c.data)}</div>}
              </div>
            </div>
          ))}
        </>
      )}
      </PreviewPremium>

      {form && (
        <NovoMomento
          momento={form.momento}
          onSalvo={() => carregar()}
          onFechar={() => setForm(null)}
        />
      )}

      {retro && (
        <Retrospectiva
          ano={anoAtual}
          eventos={eventos}
          momentos={momentos}
          categorias={categorias}
          onFechar={() => setRetro(false)}
        />
      )}
    </div>
  );
}

// Um compromisso comum na linha do tempo (camada secundária).
function EventoItem({ evento, etiqueta }) {
  const cor = etiqueta?.cor ?? cores.textoApagado;
  return (
    <div style={estilos.item}>
      <span style={{ ...estilos.itemPonto, background: cor }} />
      <div style={estilos.card}>
        <span style={{ ...estilos.cardIcone, background: cor }}>
          <IconeCat id={etiqueta?.icone ?? 'calendario'} tamanho={20} cor="#fff" strokeWidth={2} />
        </span>
        <div style={estilos.cardTexto}>
          <div style={estilos.cardHora}>{evento.inicio ?? 'Dia todo'}</div>
          <div style={estilos.cardTitulo}>{evento.titulo}</div>
          {etiqueta && <div style={{ ...estilos.cardEtiqueta, color: cor }}>{etiqueta.nome}</div>}
        </div>
      </div>
    </div>
  );
}

// Um Momento de Vida na linha do tempo — em DESTAQUE (anel dourado, marcador
// maior, selo "Momento"). Clicável para editar.
function MomentoItem({ momento, onAbrir }) {
  const cat = acharCategoriaMomento(momento.categoria);
  return (
    <div style={estilos.item}>
      <span style={estilos.itemPontoMomento} />
      <button style={estilos.cardMomento} onClick={onAbrir}>
        <span style={{ ...estilos.cardIconeMomento, background: cat.cor }}>
          <IconeCat id={cat.icone} tamanho={22} cor="#fff" strokeWidth={2} />
        </span>
        <div style={estilos.cardTexto}>
          <div style={estilos.momentoSelo}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={COR_MOMENTO} stroke="none" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7L6.8 18.2l1-5.8-4.3-4.1 5.9-.9z" /></svg>
            Momento
          </div>
          <div style={estilos.cardTituloMomento}>{momento.titulo}</div>
          <div style={{ ...estilos.cardEtiqueta, color: cat.cor }}>{cat.nome}</div>
          {momento.descricao && <div style={estilos.momentoDesc}>{momento.descricao}</div>}
        </div>
      </button>
    </div>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 560, boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 90px' },
  cabecalho: { padding: '4px 2px 14px' },
  titulo: { fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: cores.texto, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  estrela: { color: '#bf9540', fontSize: 20 },
  montanhaTitulo: { flexShrink: 0, marginBottom: -2 },
  subtitulo: { fontSize: 14, color: cores.textoSuave, margin: '4px 0 0', fontWeight: 500 },

  btnMomento: { flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 999, border: `1px solid ${COR_MOMENTO}`, background: cores.superficie, color: COR_MOMENTO, fontSize: 13, fontWeight: 800, cursor: 'pointer' },
  btnMomentoTexto: { whiteSpace: 'nowrap' },

  filtros: { display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 16px' },
  filtro: { flexShrink: 0, padding: '8px 16px', borderRadius: 999, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie, color: cores.textoSuave, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroAtivo: { background: cores.acento, borderColor: cores.acento, color: cores.textoClaro },

  retroCard: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '12px 14px', marginBottom: 16, borderRadius: raioGrande, border: `1.5px solid ${COR_MOMENTO}`, background: cores.superficie, cursor: 'pointer' },
  retroSelo: { flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: cores.acentoBg },
  retroTexto: { flex: 1, minWidth: 0 },
  retroTitulo: { fontSize: 16, fontWeight: 800, color: cores.texto, letterSpacing: -0.3 },
  retroSub: { fontSize: 12.5, color: cores.textoSuave, marginTop: 1, fontWeight: 500 },
  retroSeta: { flexShrink: 0, fontSize: 22, color: COR_MOMENTO, fontWeight: 700 },

  vazioBox: { textAlign: 'center', padding: '32px 20px 20px' },
  vazio: { color: cores.textoSuave, fontSize: 14, textAlign: 'center', lineHeight: 1.5, margin: 0 },
  vazioBtn: { marginTop: 16, padding: '11px 20px', borderRadius: 999, border: `1px solid ${COR_MOMENTO}`, background: cores.superficie, color: COR_MOMENTO, fontSize: 14, fontWeight: 800, cursor: 'pointer' },
  verComp: { display: 'block', width: '100%', margin: '2px 0 8px', padding: '10px', borderRadius: raio, border: `1px dashed ${cores.bordaForte}`, background: 'transparent', color: cores.textoSuave, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },

  timeline: {},
  grupo: { display: 'flex', gap: 10 },
  dataCol: { width: 62, flexShrink: 0, textAlign: 'right', paddingTop: 2 },
  dataForte: { fontSize: 12.5, fontWeight: 800, color: cores.texto, letterSpacing: 0.2 },
  dataFraco: { fontSize: 11, color: cores.textoApagado, fontWeight: 600, marginTop: 1 },
  itens: { flex: 1, minWidth: 0, position: 'relative', borderLeft: `2px solid ${cores.borda}`, paddingLeft: 16, paddingBottom: 6 },
  item: { position: 'relative', marginBottom: 10 },
  itemPonto: { position: 'absolute', left: -23, top: 16, width: 10, height: 10, borderRadius: '50%', border: `2px solid ${cores.superficie}`, boxSizing: 'content-box' },

  card: { display: 'flex', alignItems: 'center', gap: 12, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, padding: '11px 13px' },
  cardIcone: { flexShrink: 0, width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTexto: { minWidth: 0 },
  cardHora: { fontSize: 12, color: cores.textoApagado, fontWeight: 700 },
  cardTitulo: { fontSize: 15, fontWeight: 700, color: cores.texto, letterSpacing: -0.2, marginTop: 1 },
  cardEtiqueta: { fontSize: 12.5, fontWeight: 700, marginTop: 2 },

  // Momento de vida — destaque dourado.
  itemPontoMomento: { position: 'absolute', left: -25, top: 15, width: 12, height: 12, borderRadius: '50%', background: COR_MOMENTO, border: `3px solid ${cores.superficie}`, boxSizing: 'content-box', boxShadow: `0 0 0 2px ${COR_MOMENTO}` },
  cardMomento: { width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, background: cores.superficie, border: `1.5px solid ${COR_MOMENTO}`, borderRadius: raioGrande, padding: '12px 14px', cursor: 'pointer' },
  cardIconeMomento: { flexShrink: 0, width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  momentoSelo: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: COR_MOMENTO },
  cardTituloMomento: { fontSize: 16, fontWeight: 800, color: cores.texto, letterSpacing: -0.3, marginTop: 2 },
  momentoDesc: { fontSize: 13, color: cores.textoSuave, marginTop: 4, fontWeight: 500, lineHeight: 1.4 },

  secaoTitulo: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: cores.textoApagado, margin: '26px 2px 12px' },
  conquista: { display: 'flex', alignItems: 'center', gap: 13, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, padding: '12px 14px', marginBottom: 8 },
  conquistaIcone: { flexShrink: 0, width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  conquistaTexto: { minWidth: 0 },
  conquistaTitulo: { fontSize: 14.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2 },
  conquistaData: { fontSize: 12.5, color: cores.textoSuave, marginTop: 2, fontWeight: 500 },
};

export default MinhaHistoria;
