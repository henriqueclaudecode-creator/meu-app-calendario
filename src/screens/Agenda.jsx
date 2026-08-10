// Aba Agenda — o foco é UM dia: uma faixa de semana em cima para trocar de dia e,
// embaixo, os compromissos separados por manhã/tarde/noite/madrugada. Separada do
// Calendário (que agora ocupa a tela toda, estilo Google Calendar).

import { useEffect, useMemo, useRef, useState } from 'react';
import { listarEventos } from '../db/eventos';
import { listarCategorias } from '../db/categorias';
import { hojeISO } from '../lib/datas';
import { IconeCat } from '../components/IconeCat';
import { IconePeriodo } from '../components/IconePeriodo';
import NovoEvento from '../components/NovoEvento';
import NovoAniversario from '../components/NovoAniversario';
import MenuCriar from '../components/MenuCriar';
import BuscaEventos from '../components/BuscaEventos';
import { mapaFeriados } from '../db/feriados';
import { lerLocal } from '../lib/preferencias';
import { publicarWidget } from '../lib/widget';
import { usePremium } from '../lib/PremiumContext';
import BotaoMenu from '../components/BotaoMenu';
import { cores, sombra, sombraSuave, raio, raioGrande } from '../lib/tema';

const COR_FERIADO = '#0891b2';
const COR_NEUTRA = cores.textoApagado;

const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const NOMES_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function isoDe(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDias(iso, n) {
  const d = dataLocal(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Texto legível (claro ou escuro) sobre um fundo de cor hex.
function corTexto(bg) {
  if (typeof bg !== 'string' || bg[0] !== '#' || bg.length < 7) return '#ffffff';
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#1f2937' : '#ffffff';
}

const MAX_CHIPS = 2;

function segundaDaSemana(iso) {
  const d = dataLocal(iso);
  const desloc = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - desloc);
  return isoDe(d);
}

function montarGrade(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const deslocamento = (primeiro.getDay() + 6) % 7;
  const cursor = new Date(ano, mes, 1 - deslocamento);
  const celulas = [];
  for (let i = 0; i < 42; i++) {
    celulas.push({ dia: cursor.getDate(), noMes: cursor.getMonth() === mes, iso: isoDe(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return celulas;
}

// Um evento "ocorre" numa data se for a própria data ou uma repetição dela.
function ocorreEm(e, dataIso) {
  if (e.datasExcluidas?.includes(dataIso)) return false;
  const rep = e.repetir ?? 'nao';
  if (rep === 'nao' || !rep) return e.data === dataIso;
  if (dataIso < e.data) return false;
  const a = dataLocal(e.data);
  const b = dataLocal(dataIso);
  const diffDias = Math.round((b - a) / 86400000);
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (rep === 'diario') return true;
  if (rep === 'semanal') return a.getDay() === b.getDay();
  if (rep === 'mensal') return a.getDate() === b.getDate();
  if (rep === 'anual') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
  if (rep === 'personalizado') {
    const n = Math.max(1, e.repetirCada ?? 1);
    const u = e.repetirUnidade ?? 'semanas';
    if (u === 'dias') return diffDias % n === 0;
    if (u === 'semanas') return a.getDay() === b.getDay() && (diffDias / 7) % n === 0;
    if (u === 'meses') return a.getDate() === b.getDate() && meses % n === 0;
    if (u === 'anos') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && (b.getFullYear() - a.getFullYear()) % n === 0;
  }
  return false;
}

function periodoDe(hora) {
  const h = parseInt(hora.slice(0, 2), 10);
  if (h >= 5 && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  if (h >= 18 && h < 24) return 'noite';
  return 'madrugada';
}

const PERIODOS = [
  { id: 'manha', rotulo: 'Manhã', cor: 'var(--periodo-manha-icone, #f59e0b)', bg: 'var(--periodo-manha-bg, #fff4e1)' },
  { id: 'tarde', rotulo: 'Tarde', cor: 'var(--periodo-tarde-icone, #f97316)', bg: 'var(--periodo-tarde-bg, #ffede0)' },
  { id: 'noite', rotulo: 'Noite', cor: 'var(--periodo-noite-icone, #7c3aed)', bg: 'var(--periodo-noite-bg, #f1ebfc)' },
  { id: 'madrugada', rotulo: 'Madrugada', cor: 'var(--periodo-madrugada-icone, #93c5fd)', bg: 'var(--periodo-madrugada-bg, #1e293b)' },
];

function Agenda({ onAbrirMenu }) {
  const hoje = hojeISO();
  const [selecionado, setSelecionado] = useState(hoje);
  const [modo, setModo] = useState('semana'); // 'semana' | 'mes'
  const [busca, setBusca] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(null);
  const [feriados, setFeriados] = useState({});
  const { premium } = usePremium() ?? {};

  function mudarMesSel(passo) {
    const d = dataLocal(selecionado);
    const nd = new Date(d.getFullYear(), d.getMonth() + passo, Math.min(d.getDate(), 28));
    setSelecionado(isoDe(nd));
  }

  const anoSel = dataLocal(selecionado).getFullYear();
  useEffect(() => {
    let vivo = true;
    const { uf, municipio } = lerLocal();
    mapaFeriados(anoSel, { uf, municipio }).then((m) => { if (vivo) setFeriados(m); });
    return () => { vivo = false; };
  }, [anoSel]);

  async function carregar(focar) {
    try {
      const [lista, cats] = await Promise.all([listarEventos(), listarCategorias()]);
      setEventos(lista);
      setCategorias(cats);
      publicarWidget(lista, cats, { premium });
      if (focar) setSelecionado(focar);
    } catch {
      setEventos([]);
    }
  }
  useEffect(() => { carregar(); }, []);

  const etiquetaDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const corDe = (e) => e.cor ?? etiquetaDe(e)?.cor ?? COR_NEUTRA;
  const visivel = (e) => !(e.tipo === 'aniversario' && e.exibirNaAgenda === false);
  const eventosDo = (d) => eventos
    .filter((e) => visivel(e) && ocorreEm(e, d))
    .sort((a, b) => (a.inicio ?? '99:99').localeCompare(b.inicio ?? '99:99'));

  const segunda = segundaDaSemana(selecionado);
  const semana = Array.from({ length: 7 }, (_, i) => addDias(segunda, i));
  const selDate = dataLocal(selecionado);
  const ehHoje = selecionado === hoje;

  // Timeline contínua: todos os dias (numa janela) que têm compromissos, em ordem.
  // A janela vai de ~2 meses atrás até ~13 meses à frente, cobrindo repetições.
  const secoes = useMemo(() => {
    if (eventos.length === 0) return [];
    const cedo = eventos.reduce((min, e) => (e.data < min ? e.data : min), eventos[0].data);
    const inicio = cedo < addDias(hoje, -60) ? addDias(hoje, -60) : cedo;
    const fim = addDias(hoje, 400);
    const out = [];
    let cur = inicio;
    let guarda = 0;
    while (cur <= fim && guarda++ < 1000) {
      const evs = eventosDo(cur);
      if (evs.length) out.push({ iso: cur, eventos: evs });
      cur = addDias(cur, 1);
    }
    return out;
  }, [eventos, categorias, hoje]);

  // Refs de cada seção para rolar até o dia escolhido e para acompanhar a rolagem.
  const secaoRefs = useRef({});
  const rolandoPrograma = useRef(false);

  function irParaDia(iso) {
    setSelecionado(iso);
    const el = secaoRefs.current[iso];
    if (el) {
      rolandoPrograma.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { rolandoPrograma.current = false; }, 600);
    }
  }

  // Ao rolar, o dia do topo vira o "selecionado" (a faixa de semana acompanha).
  useEffect(() => {
    const alvos = Object.values(secaoRefs.current).filter(Boolean);
    if (alvos.length === 0) return;
    const obs = new IntersectionObserver((entradas) => {
      if (rolandoPrograma.current) return;
      const visiveis = entradas.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const topo = visiveis[0];
      if (topo) {
        const iso = topo.target.getAttribute('data-iso');
        if (iso) setSelecionado(iso);
      }
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });
    alvos.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [secoes]);

  function corDoDia(d) {
    const evs = eventosDo(d);
    if (evs.length) return corDe(evs[0]);
    return feriados[d] ? COR_FERIADO : null;
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.cabecalho}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BotaoMenu onAbrir={onAbrirMenu} />
          <div>
            <h1 style={estilos.titulo}>Agenda</h1>
            <p style={estilos.subtitulo}>Seus compromissos, dia a dia</p>
          </div>
        </div>
        <button style={estilos.lupa} onClick={() => setBusca(true)} aria-label="Pesquisar eventos">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        </button>
      </div>

      {/* Seletor de visão: Semana · Mês */}
      <div style={estilos.seletorModo}>
        {[{ id: 'semana', r: 'Semana' }, { id: 'mes', r: 'Mês' }].map((v) => (
          <button key={v.id} style={{ ...estilos.modoBtn, ...(modo === v.id ? estilos.modoBtnAtivo : null) }} onClick={() => setModo(v.id)}>{v.r}</button>
        ))}
      </div>

      {/* Faixa da semana ou grade do mês. */}
      {modo === 'semana' ? (
      <div style={estilos.cartaoSemana}>
        <div style={estilos.mesLinha}>
          <button style={estilos.setaMes} onClick={() => setSelecionado(addDias(selecionado, -7))} aria-label="Semana anterior">‹</button>
          <span style={estilos.mesTitulo}>{cap(MESES[selDate.getMonth()])} {selDate.getFullYear()}</span>
          <button style={estilos.setaMes} onClick={() => setSelecionado(addDias(selecionado, 7))} aria-label="Próxima semana">›</button>
        </div>
        <div style={estilos.gradeSemana}>
          {DIAS_SEMANA.map((d) => <div key={d} style={{ ...estilos.nomeSemana, ...(d === 'DOM' ? { color: cores.perigo } : null) }}>{d}</div>)}
          {semana.map((d) => {
            const date = dataLocal(d);
            const sel = d === selecionado;
            const eHoje = d === hoje;
            const fds = date.getDay() === 0 || date.getDay() === 6;
            const ehFeriado = !!feriados[d];
            const evs = eventosDo(d);
            const visiveis = evs.slice(0, 2);
            const extra = evs.length - visiveis.length;
            return (
              <button key={d} style={estilos.diaSemana} onClick={() => irParaDia(d)} title={feriados[d] || undefined}>
                <span style={{
                  ...estilos.numeroSemana,
                  ...(fds && !sel ? { color: cores.perigo } : null),
                  ...(ehFeriado && !sel && !eHoje ? { color: COR_FERIADO } : null),
                  ...(eHoje && !sel ? estilos.numeroHoje : null),
                  ...(sel ? estilos.numeroSel : null),
                }}>{date.getDate()}</span>
                <span style={estilos.chipsDia}>
                  {visiveis.map((e) => {
                    const cc = corDe(e);
                    return <span key={e.id} style={{ ...estilos.chipDia, background: cc, color: corTexto(cc) }} title={e.titulo}>{e.titulo}</span>;
                  })}
                  {extra > 0 && <span style={estilos.chipMaisDia}>+{extra}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      ) : (
      <div style={estilos.cartaoSemana}>
        <div style={estilos.mesLinha}>
          <button style={estilos.setaMes} onClick={() => mudarMesSel(-1)} aria-label="Mês anterior">‹</button>
          <span style={estilos.mesTitulo}>{cap(MESES[selDate.getMonth()])} {selDate.getFullYear()}</span>
          <button style={estilos.setaMes} onClick={() => mudarMesSel(1)} aria-label="Próximo mês">›</button>
        </div>
        <div style={estilos.gradeMes}>
          {DIAS_SEMANA.map((d) => <div key={d} style={{ ...estilos.nomeSemana, ...(d === 'DOM' ? { color: cores.perigo } : null) }}>{d}</div>)}
          {montarGrade(selDate.getFullYear(), selDate.getMonth()).map((c) => {
            const sel = c.iso === selecionado;
            const eHoje = c.iso === hoje;
            const ehDomingo = dataLocal(c.iso).getDay() === 0;
            const ehFeriado = !!feriados[c.iso];
            const evs = c.noMes ? eventosDo(c.iso) : [];
            const visiveis = evs.slice(0, MAX_CHIPS);
            const extra = evs.length - visiveis.length;
            return (
              <button key={c.iso} style={{ ...estilos.celulaMes, ...(ehDomingo ? estilos.celulaDomingo : null) }} onClick={() => irParaDia(c.iso)} title={feriados[c.iso] || undefined}>
                <span style={{
                  ...estilos.numeroSemana,
                  ...(!c.noMes ? { color: cores.textoFraco, fontWeight: 600 } : null),
                  ...(ehFeriado && c.noMes && !sel && !eHoje ? { color: COR_FERIADO } : null),
                  ...(ehDomingo && c.noMes && !sel && !eHoje ? { color: cores.perigo } : null),
                  ...(eHoje && !sel ? estilos.numeroHoje : null),
                  ...(sel ? estilos.numeroSel : null),
                }}>{c.dia}</span>
                <span style={estilos.celConteudo}>
                  {ehFeriado && c.noMes && <span style={estilos.feriadoTag} title={feriados[c.iso]}>{feriados[c.iso]}</span>}
                  {visiveis.map((e) => {
                    const cc = corDe(e);
                    return (
                      <span key={e.id} style={{ ...estilos.chip, background: cc, color: corTexto(cc) }} title={e.titulo}>{e.titulo}</span>
                    );
                  })}
                  {extra > 0 && <span style={estilos.chipMais}>+{extra}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Botão "hoje" para voltar rápido ao dia atual na timeline. */}
      {!ehHoje && (
        <div style={estilos.diaLinha}>
          <button style={estilos.botaoHoje} onClick={() => irParaDia(hoje)}>Ir para hoje</button>
        </div>
      )}

      {/* Timeline contínua: um cabeçalho de data (que gruda no topo) por dia. */}
      {secoes.length === 0 ? (
        <p style={estilos.vazia}>Nada marcado ainda. Toque no + para criar.</p>
      ) : (
        secoes.map((sec) => {
          const d = dataLocal(sec.iso);
          const cab = `${cap(NOMES_DIAS[d.getDay()])}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
          const eHoje = sec.iso === hoje;
          return (
            <div key={sec.iso} data-iso={sec.iso} ref={(el) => { secaoRefs.current[sec.iso] = el; }} style={estilos.secao}>
              <div style={{ ...estilos.secaoCab, ...(eHoje ? estilos.secaoCabHoje : null) }}>
                <span style={estilos.secaoData}>{cab}</span>
                {eHoje && <span style={estilos.secaoHojeTag}>Hoje</span>}
                {feriados[sec.iso] && <span style={estilos.secaoFeriado}>🎌 {feriados[sec.iso]}</span>}
              </div>
              {sec.eventos.map((e) => (
                <CardEvento key={e.id} evento={e} etiqueta={etiquetaDe(e)} cor={corDe(e)} onAbrir={() => setForm(e.tipo === 'aniversario' ? { tipo: 'aniversario', evento: e } : { tipo: 'compromisso', evento: e })} />
              ))}
            </div>
          );
        })
      )}

      <button style={estilos.botaoMais} className="fab" aria-label="Criar" onClick={() => setForm({ tipo: 'menu' })}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {form?.tipo === 'menu' && (
        <MenuCriar
          onCompromisso={(preset) => setForm({ tipo: 'compromisso', item: 'compromisso', evento: null, preset })}
          onEvento={(preset) => setForm({ tipo: 'compromisso', item: 'evento', evento: null, preset })}
          onAniversario={() => setForm({ tipo: 'aniversario', evento: null })}
          onFechar={() => setForm(null)}
        />
      )}

      {form?.tipo === 'compromisso' && (
        <NovoEvento
          evento={form.evento}
          tipo={form.item ?? form.evento?.tipo}
          dataInicial={selecionado}
          presetInicio={form.preset?.inicio}
          onSalvo={(data) => carregar(data)}
          onFechar={() => setForm(null)}
        />
      )}

      {form?.tipo === 'aniversario' && (
        <NovoAniversario
          evento={form.evento}
          onSalvo={(data) => carregar(data)}
          onFechar={() => setForm(null)}
        />
      )}

      {busca && <BuscaEventos onFechar={() => setBusca(false)} onMudou={() => carregar()} />}
    </div>
  );
}

function CardEvento({ evento, etiqueta, cor, onAbrir }) {
  return (
    <button style={{ ...estilos.card, borderLeft: `4px solid ${cor}` }} onClick={onAbrir} title="Tocar para editar ou excluir">
      {evento.inicio && (
        <div style={estilos.hora}>
          <span style={estilos.horaInicio}>{evento.inicio}</span>
          {evento.fim && <span style={estilos.horaFim}>{evento.fim}</span>}
        </div>
      )}
      <span style={{ ...estilos.cardIcone, background: cor }}>
        <IconeCat id={etiqueta?.icone ?? 'calendario'} tamanho={20} cor="#fff" strokeWidth={2} />
      </span>
      <div style={estilos.cardTexto}>
        <div style={estilos.cardTitulo}>
          {evento.favorito && <span style={estilos.estrela} aria-label="Favorito">★</span>}
          {evento.titulo}
        </div>
        {etiqueta && <span style={{ ...estilos.tag, color: cor }}>{etiqueta.nome}</span>}
        {evento.notas && <div style={estilos.cardSub}>{evento.notas}</div>}
      </div>
      <span style={estilos.seta}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </span>
    </button>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 560, boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 90px', position: 'relative' },

  cabecalho: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '10px 2px 14px' },
  titulo: { fontSize: 28, fontWeight: 800, letterSpacing: -0.6, color: cores.texto, margin: 0 },
  subtitulo: { fontSize: 14, color: cores.textoSuave, margin: '4px 0 0', fontWeight: 500 },
  lupa: { flexShrink: 0, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${cores.borda}`, background: cores.superficie, cursor: 'pointer', borderRadius: '50%', padding: 0, marginTop: 2 },

  seletorModo: { display: 'flex', gap: 4, background: cores.superficie2, border: `1px solid ${cores.borda}`, borderRadius: 999, padding: 4, marginBottom: 12 },
  modoBtn: { flex: 1, padding: '8px 0', border: 'none', background: 'transparent', color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', borderRadius: 999 },
  modoBtnAtivo: { background: cores.superficie, color: cores.acento, boxShadow: sombraSuave },
  gradeMes: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 4 },
  celulaMes: { minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: 60, padding: '3px 1px', border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' },
  celulaDomingo: { background: 'rgba(229, 72, 77, 0.06)', borderRadius: 8 },
  celConteudo: { width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 },
  chip: { display: 'block', width: '100%', boxSizing: 'border-box', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.35, letterSpacing: -0.1 },
  chipMais: { fontSize: 8.5, fontWeight: 700, color: cores.textoApagado, paddingLeft: 4, lineHeight: 1.3 },
  feriadoTag: { maxWidth: '100%', boxSizing: 'border-box', fontSize: 8.5, fontWeight: 700, lineHeight: 1.15, color: 'var(--feriado-texto, #0e6f86)', background: 'var(--feriado-bg, #e6f6fb)', border: '1px solid var(--feriado-borda, #b7e3ef)', borderRadius: 5, padding: '1px 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },

  cartaoSemana: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, boxShadow: sombra, padding: '14px 12px', marginBottom: 6 },
  mesLinha: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mesTitulo: { fontSize: 16, fontWeight: 800, color: cores.texto },
  setaMes: { border: 'none', background: 'transparent', color: cores.textoApagado, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 8px' },
  gradeSemana: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 4 },
  nomeSemana: { textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: cores.textoApagado, marginBottom: 2 },
  diaSemana: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 0' },
  numeroSemana: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', fontSize: 15, fontWeight: 700, color: cores.texto },
  numeroHoje: { border: `2px solid ${cores.acento}`, color: cores.acento },
  numeroSel: { background: `var(--dia-sel-bg, ${cores.acento})`, color: `var(--dia-sel-texto, ${cores.textoClaro})` },
  pontoDia: { width: 6, height: 6, borderRadius: '50%' },
  chipsDia: { width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, minHeight: 14 },
  chipDia: { display: 'block', width: '100%', boxSizing: 'border-box', fontSize: 8, fontWeight: 700, borderRadius: 4, padding: '1px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, letterSpacing: -0.1 },
  chipMaisDia: { fontSize: 8, fontWeight: 700, color: cores.textoApagado, textAlign: 'center', lineHeight: 1.2 },

  secao: { marginBottom: 6 },
  secaoCab: { position: 'sticky', top: 'calc(env(safe-area-inset-top) + 52px)', zIndex: 5, display: 'flex', alignItems: 'center', gap: 8, background: cores.bg, padding: '10px 2px 8px' },
  secaoCabHoje: {},
  secaoData: { fontSize: 15, fontWeight: 800, color: cores.texto, letterSpacing: -0.2 },
  secaoHojeTag: { padding: '2px 9px', borderRadius: 999, background: cores.acentoBg, color: cores.acento, fontSize: 11.5, fontWeight: 800 },
  secaoFeriado: { fontSize: 12, fontWeight: 700, color: 'var(--feriado-texto, #0e6f86)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  diaLinha: { display: 'flex', alignItems: 'center', gap: 8, margin: '18px 2px 14px' },
  setaDia: { border: 'none', background: 'transparent', color: cores.textoApagado, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' },
  diaTexto: { fontSize: 16, fontWeight: 700, color: cores.texto },
  botaoHoje: { marginLeft: 'auto', padding: '6px 14px', border: `1px solid ${cores.acentoClaro}`, borderRadius: 999, background: cores.acentoBg, color: cores.acento, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  vazia: { color: cores.textoSuave, fontSize: 14, textAlign: 'center', padding: '28px 0' },
  feriadoAviso: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--feriado-bg, #e6f6fb)', color: 'var(--feriado-texto, #0e6f86)', border: '1px solid var(--feriado-borda, #b7e3ef)', borderRadius: raio, padding: '10px 13px', fontSize: 13.5, fontWeight: 700, margin: '0 2px 12px' },

  periodoTitulo: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 800, color: cores.texto, margin: '18px 2px 10px' },
  periodoIcone: { flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  card: { width: '100%', boxSizing: 'border-box', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '13px 14px', marginBottom: 10 },
  hora: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 46, flexShrink: 0 },
  horaInicio: { fontSize: 16, fontWeight: 800, color: `var(--hora-cor, ${cores.texto})` },
  horaFim: { fontSize: 12.5, color: cores.textoApagado, fontWeight: 600 },
  cardIcone: { flexShrink: 0, width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTexto: { minWidth: 0, flex: 1 },
  cardTitulo: { fontSize: 15.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2 },
  estrela: { color: '#f59e0b', marginRight: 4 },
  tag: { display: 'inline-block', marginTop: 4, fontSize: 12.5, fontWeight: 700 },
  cardSub: { fontSize: 12.5, color: cores.textoSuave, marginTop: 4 },
  seta: { flexShrink: 0, display: 'flex', color: cores.textoApagado },

  botaoMais: {
    position: 'fixed', right: 'max(18px, calc(50vw - 280px + 18px))', bottom: 24, zIndex: 30,
    width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: cores.acento, color: cores.acentoTexto,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.30)',
  },
};

export default Agenda;
