// Aba Calendário — a tela inicial do app.
//
// Filosofia (ver PDF): o calendário é o protagonista e fica LIMPO. Mostra o mês,
// os compromissos do dia selecionado e o botão +. Cada compromisso mostra só o
// título e um pequeno indicador da cor da sua etiqueta.
//
// Extras: seletor de visão (Dia/Semana/Mês/Ano), menu lateral (as três barras),
// feriados destacados com o nome na grade e uma faixa de eventos favoritos.

import { useEffect, useState } from 'react';
import { listarEventos } from '../db/eventos';
import { listarCategorias } from '../db/categorias';
import { hojeISO } from '../lib/datas';
import { IconeCat } from '../components/IconeCat';
import NovoEvento from '../components/NovoEvento';
import NovaCategoria from '../components/NovaCategoria';
import MenuCriar from '../components/MenuCriar';
import BotaoMenu from '../components/BotaoMenu';
import NovoAniversario from '../components/NovoAniversario';
import BuscaEventos from '../components/BuscaEventos';
import { IconePeriodo } from '../components/IconePeriodo';
import { mapaFeriados } from '../db/feriados';
import { lerLocal } from '../lib/preferencias';
import { publicarWidget } from '../lib/widget';
import { usePremium } from '../lib/PremiumContext';
import { cores, sombra, sombraSuave, sombraAcento, raio, raioGrande } from '../lib/tema';

const COR_FERIADO = '#0891b2';
const COR_NEUTRA = cores.textoApagado; // compromisso sem etiqueta

const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const NOMES_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const VISTAS = [
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'ano', rotulo: 'Ano' },
];

function iso(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function isoDe(d) {
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

function dataLocal(dataIso) {
  const [a, m, d] = dataIso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function montarGrade(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const deslocamento = (primeiro.getDay() + 6) % 7;
  const cursor = new Date(ano, mes, 1 - deslocamento);
  const semanas = [];
  for (let s = 0; s < 6; s++) {
    const semana = [];
    for (let d = 0; d < 7; d++) {
      semana.push({ dia: cursor.getDate(), noMes: cursor.getMonth() === mes, iso: isoDe(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

function diasDaSemana(dataIso) {
  const d = dataLocal(dataIso);
  const desloc = (d.getDay() + 6) % 7;
  const seg = new Date(d.getFullYear(), d.getMonth(), d.getDate() - desloc);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(seg);
    x.setDate(seg.getDate() + i);
    return isoDe(x);
  });
}

// Um evento "ocorre" numa data se for a própria data ou uma repetição dela.
function ocorreEm(e, dataIso) {
  // Ocorrência excluída avulsa (de um repetido) não aparece.
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

// "hoje", "amanhã", "em 12 dias"… a partir da diferença em dias.
function rotuloContagem(dias) {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias === -1) return 'ontem';
  if (dias > 1) return `em ${dias} dias`;
  return `há ${-dias} dias`;
}

function Calendario({ onAbrirMenu }) {
  const hoje = hojeISO();
  const hojeDate = dataLocal(hoje);

  const [ano, setAno] = useState(hojeDate.getFullYear());
  const [mes, setMes] = useState(hojeDate.getMonth());
  const [selecionado, setSelecionado] = useState(hoje);
  const [vista, setVista] = useState('mes');
  const [busca, setBusca] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  // form: null | { tipo:'menu' } | { tipo:'compromisso', evento, preset } | { tipo:'categoria' }
  const [form, setForm] = useState(null);
  const [feriados, setFeriados] = useState({});
  const { premium } = usePremium() ?? {};

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

  useEffect(() => {
    let vivo = true;
    const { uf, municipio } = lerLocal();
    mapaFeriados(ano, { uf, municipio }).then((m) => { if (vivo) setFeriados(m); });
    return () => { vivo = false; };
  }, [ano]);

  const etiquetaDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const corDe = (e) => e.cor ?? etiquetaDe(e)?.cor ?? COR_NEUTRA;

  // Aniversários com "exibir na agenda" desligado não entram nas listas do dia.
  const visivel = (e) => !(e.tipo === 'aniversario' && e.exibirNaAgenda === false);
  const eventosDo = (dataIso) => eventos
    .filter((e) => visivel(e) && ocorreEm(e, dataIso))
    .sort((a, b) => (a.inicio ?? '99:99').localeCompare(b.inicio ?? '99:99'));
  const temEvento = (dataIso) => eventos.some((e) => visivel(e) && ocorreEm(e, dataIso));
  const grade = montarGrade(ano, mes);
  const eventosSelecionado = eventosDo(selecionado);

  // Favoritos: próximos primeiro (a partir de hoje), com os passados no fim.
  const favoritos = eventos
    .filter((e) => e.favorito)
    .sort((a, b) => {
      const fa = a.data < hoje, fb = b.data < hoje;
      if (fa !== fb) return fa ? 1 : -1;
      return a.data.localeCompare(b.data) || (a.inicio ?? '').localeCompare(b.inicio ?? '');
    });

  function mudarMes(passo) {
    const d = new Date(ano, mes + passo, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  function irParaDia(dataIso, novaVista) {
    const d = dataLocal(dataIso);
    setSelecionado(dataIso);
    setAno(d.getFullYear());
    setMes(d.getMonth());
    if (novaVista) setVista(novaVista);
  }

  // Abre um evento existente para edição. `ocorrencia` é o dia clicado (usado
  // para excluir só aquela ocorrência de um repetido).
  function abrirEvento(e, ocorrencia) {
    setSelecionado(ocorrencia ?? e.data);
    setForm(e.tipo === 'aniversario'
      ? { tipo: 'aniversario', evento: e }
      : { tipo: 'compromisso', evento: e, ocorrencia: ocorrencia ?? e.data });
  }

  // Arrastar para os lados (swipe) troca o período conforme a visão atual.
  const [toqueIni, setToqueIni] = useState(null);
  function aoTocarInicio(e) {
    const t = e.touches?.[0];
    if (t) setToqueIni({ x: t.clientX, y: t.clientY });
  }
  function aoTocarFim(e) {
    if (!toqueIni) return;
    const t = e.changedTouches?.[0];
    if (t) {
      const dx = t.clientX - toqueIni.x;
      const dy = t.clientY - toqueIni.y;
      // Só conta como swipe horizontal se for claramente lateral.
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navegar(dx < 0 ? 1 : -1);
      }
    }
    setToqueIni(null);
  }

  // Setas do topo: navegam de acordo com a visão atual.
  function navegar(passo) {
    if (vista === 'ano') { setAno((a) => a + passo); return; }
    if (vista === 'mes') { mudarMes(passo); return; }
    const d = dataLocal(selecionado);
    d.setDate(d.getDate() + passo * (vista === 'semana' ? 7 : 1));
    irParaDia(isoDe(d));
  }

  const selDate = dataLocal(selecionado);
  const ehHojeSel = selecionado === hoje;
  const dataTexto = `${cap(NOMES_DIAS[selDate.getDay()])}, ${selDate.getDate()} de ${MESES[selDate.getMonth()]}`;

  // Título do topo conforme a visão.
  let tituloTopo;
  if (vista === 'ano') {
    tituloTopo = String(ano);
  } else if (vista === 'semana') {
    const semana = diasDaSemana(selecionado);
    const a = dataLocal(semana[0]);
    const b = dataLocal(semana[6]);
    tituloTopo = a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} de ${MESES_CURTO[a.getMonth()]}`
      : `${a.getDate()} ${MESES_CURTO[a.getMonth()]} – ${b.getDate()} ${MESES_CURTO[b.getMonth()]}`;
  } else {
    tituloTopo = `${cap(MESES[mes])} ${ano}`;
  }

  const diasContagem = (dataIso) => Math.round((dataLocal(dataIso) - hojeDate) / 86400000);

  return (
    <div style={estilos.pagina}>
      {/* Cabeçalho: menu, título do período, setas e a lupa de pesquisa. */}
      <div style={estilos.cabecalho}>
        <BotaoMenu onAbrir={onAbrirMenu} />
        <button style={estilos.setaMes} onClick={() => navegar(-1)} aria-label="Anterior">‹</button>
        <div style={estilos.mesTitulo}>{tituloTopo}</div>
        <button style={estilos.setaMes} onClick={() => navegar(1)} aria-label="Próximo">›</button>
        <button style={estilos.lupa} onClick={() => setBusca(true)} aria-label="Pesquisar eventos">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        </button>
      </div>

      {/* Seletor de visão: Dia · Semana · Mês · Ano */}
      <div style={estilos.seletorVista}>
        {VISTAS.map((v) => {
          const ativo = v.id === vista;
          return (
            <button key={v.id} style={{ ...estilos.vistaBtn, ...(ativo ? estilos.vistaBtnAtivo : null) }} onClick={() => setVista(v.id)}>
              {v.rotulo}
            </button>
          );
        })}
      </div>

      {/* Favoritos em destaque */}
      {favoritos.length > 0 && (
        <div style={estilos.favLista}>
          {favoritos.map((e) => {
            const cor = corDe(e);
            return (
              <button key={e.id} style={estilos.favCard} onClick={() => { irParaDia(e.data); setForm(e.tipo === 'aniversario' ? { tipo: 'aniversario', evento: e } : { tipo: 'compromisso', evento: e }); }}>
                <span style={{ ...estilos.favCardIcone, background: cor }}>
                  <IconeCat id={etiquetaDe(e)?.icone ?? 'estrela'} tamanho={16} cor="#fff" strokeWidth={2} />
                </span>
                <span style={estilos.favCardTitulo}>{e.titulo}</span>
                <span style={{ ...estilos.favCardContagem, color: cor }}>{rotuloContagem(diasContagem(e.data))}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* VISÃO: MÊS */}
      {vista === 'mes' && (
        <div style={estilos.cartaoGrade} onTouchStart={aoTocarInicio} onTouchEnd={aoTocarFim}>
          <div style={estilos.linhaSemana}>
            {DIAS_SEMANA.map((d) => (<div key={d} style={estilos.nomeSemana}>{d}</div>))}
          </div>
          {grade.map((semana, i) => (
            <div key={i} style={estilos.semana}>
              {semana.map((celula) => (
                <Celula
                  key={celula.iso}
                  celula={celula}
                  selecionado={celula.iso === selecionado}
                  ehHoje={celula.iso === hoje}
                  eventos={eventosDo(celula.iso)}
                  corDe={corDe}
                  feriado={feriados[celula.iso]}
                  onClick={() => { setSelecionado(celula.iso); setForm({ tipo: 'compromisso', evento: null, data: celula.iso }); }}
                  onAbrirEvento={abrirEvento}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* VISÃO: ANO */}
      {vista === 'ano' && (
        <div style={estilos.anoGrade}>
          {MESES.map((nome, m) => (
            <MiniMes
              key={m}
              ano={ano}
              mes={m}
              hoje={hoje}
              selecionado={selecionado}
              temEvento={temEvento}
              feriados={feriados}
              onAbrirMes={() => { setMes(m); setVista('mes'); }}
              onDia={(dataIso) => irParaDia(dataIso, 'mes')}
            />
          ))}
        </div>
      )}

      {/* VISÃO: SEMANA — grade de 7 células grandes, no estilo do mês. */}
      {vista === 'semana' && (
        <div style={estilos.cartaoGrade} onTouchStart={aoTocarInicio} onTouchEnd={aoTocarFim}>
          <div style={estilos.linhaSemana}>
            {DIAS_SEMANA.map((d) => (<div key={d} style={estilos.nomeSemana}>{d}</div>))}
          </div>
          <div style={estilos.semanaGradeUnica}>
            {diasDaSemana(selecionado).map((dataIso) => (
              <CelulaSemana
                key={dataIso}
                iso={dataIso}
                dia={dataLocal(dataIso).getDate()}
                selecionado={dataIso === selecionado}
                ehHoje={dataIso === hoje}
                eventos={eventosDo(dataIso)}
                corDe={corDe}
                feriado={feriados[dataIso]}
                onClick={() => { setSelecionado(dataIso); setForm({ tipo: 'compromisso', evento: null, data: dataIso }); }}
                onAbrirEvento={abrirEvento}
              />
            ))}
          </div>
        </div>
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
          dataInicial={form.data ?? selecionado}
          presetInicio={form.preset?.inicio}
          ocorrencia={form.ocorrencia}
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

      {form?.tipo === 'categoria' && (
        <NovaCategoria
          onSalvo={() => carregar()}
          onFechar={() => setForm(null)}
        />
      )}

      {busca && <BuscaEventos onFechar={() => setBusca(false)} onMudou={() => carregar()} />}
    </div>
  );
}

const MAX_CHIPS = 2;

function Celula({ celula, selecionado, ehHoje, eventos, corDe, feriado, onClick, onAbrirEvento }) {
  // Cada dia mostra o TÍTULO dos compromissos (até 2), com um pontinho na cor da
  // etiqueta; havendo mais, um "+N". Feriados aparecem numa etiqueta discreta.
  const visiveis = eventos.slice(0, MAX_CHIPS);
  const extra = eventos.length - visiveis.length;

  const estiloNumero = {
    ...estilos.numeroDia,
    ...(celula.noMes ? null : estilos.numeroForaMes),
    ...(feriado && !selecionado && !ehHoje ? estilos.numeroFeriado : null),
    ...(ehHoje && !selecionado ? estilos.numeroHoje : null),
    ...(selecionado ? estilos.numeroSelecionado : null),
  };

  return (
    <div role="button" tabIndex={0} style={estilos.celula} onClick={onClick} title={feriado || undefined}>
      <span style={estiloNumero}>{celula.dia}</span>
      <span style={estilos.celConteudo}>
        {feriado && <span style={estilos.feriadoTag} title={feriado}>{feriado}</span>}
        {visiveis.map((e) => {
          const c = corDe(e);
          return (
            <span
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={(ev) => { ev.stopPropagation(); onAbrirEvento?.(e, celula.iso); }}
              style={{ ...estilos.chip, background: c, color: corTexto(c), cursor: 'pointer' }}
              title={e.titulo}
            >
              {e.titulo}
            </span>
          );
        })}
        {extra > 0 && <span style={estilos.chipMais}>+{extra}</span>}
      </span>
    </div>
  );
}

// Célula da visão SEMANA — maior que a do mês, mostra mais títulos por dia.
function CelulaSemana({ iso, dia, selecionado, ehHoje, eventos, corDe, feriado, onClick, onAbrirEvento }) {
  const MAX = 4;
  const visiveis = eventos.slice(0, MAX);
  const extra = eventos.length - visiveis.length;
  const estiloNumero = {
    ...estilos.numeroDia,
    ...(feriado && !selecionado && !ehHoje ? estilos.numeroFeriado : null),
    ...(ehHoje && !selecionado ? estilos.numeroHoje : null),
    ...(selecionado ? estilos.numeroSelecionado : null),
  };
  return (
    <div role="button" tabIndex={0} style={estilos.celulaSemana} onClick={onClick} title={feriado || undefined}>
      <span style={estiloNumero}>{dia}</span>
      <span style={estilos.celConteudo}>
        {feriado && <span style={estilos.feriadoTag} title={feriado}>{feriado}</span>}
        {visiveis.map((e) => {
          const c = corDe(e);
          return (
            <span
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={(ev) => { ev.stopPropagation(); onAbrirEvento?.(e, iso); }}
              style={{ ...estilos.chipSemana, background: c, color: corTexto(c), cursor: 'pointer' }}
              title={e.titulo}
            >
              {e.inicio ? `${e.inicio} ` : ''}{e.titulo}
            </span>
          );
        })}
        {extra > 0 && <span style={estilos.chipMais}>+{extra}</span>}
      </span>
    </div>
  );
}

// Mini calendário de um mês (usado na visão Ano).
function MiniMes({ ano, mes, hoje, selecionado, temEvento, feriados, onAbrirMes, onDia }) {
  const grade = montarGrade(ano, mes);
  return (
    <div style={estilos.miniCartao}>
      <button style={estilos.miniTitulo} onClick={onAbrirMes}>{MESES_CURTO[mes]}</button>
      <div style={estilos.miniSemana}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (<span key={i} style={estilos.miniDow}>{d}</span>))}
      </div>
      {grade.map((semana, i) => (
        <div key={i} style={estilos.miniLinha}>
          {semana.map((c) => {
            const comEvento = temEvento(c.iso);
            const ferido = !!feriados[c.iso];
            const est = {
              ...estilos.miniDia,
              ...(c.noMes ? null : estilos.miniForaMes),
              ...(ferido && c.noMes ? { color: COR_FERIADO, fontWeight: 700 } : null),
              ...(c.iso === hoje ? estilos.miniHoje : null),
              ...(c.iso === selecionado ? estilos.miniSel : null),
            };
            return (
              <button key={c.iso} style={est} onClick={() => onDia(c.iso)}>
                {c.dia}
                {comEvento && c.noMes && <span style={estilos.miniPonto} />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CardEvento({ evento, etiqueta, onAbrir }) {
  const cor = evento.cor ?? etiqueta?.cor ?? COR_NEUTRA;
  return (
    <button style={estilos.cardEvento} onClick={onAbrir} title="Tocar para editar ou excluir">
      {evento.inicio && (
        <div style={estilos.cardHora}>
          <span style={estilos.horaInicio}>{evento.inicio}</span>
          {evento.fim && <span style={estilos.horaFim}>{evento.fim}</span>}
        </div>
      )}
      <span style={{ ...estilos.cardEventoIcone, background: cor }}>
        <IconeCat id={etiqueta?.icone ?? 'calendario'} tamanho={19} cor="#fff" strokeWidth={2} />
      </span>
      <div style={estilos.cardEventoTexto}>
        <div style={estilos.cardEventoTitulo}>
          {evento.favorito && <span style={estilos.cardFavEstrela} aria-label="Favorito">★</span>}
          {evento.titulo}
        </div>
        {etiqueta && <div style={{ ...estilos.cardEventoSub, color: cor }}>{etiqueta.nome}</div>}
        {evento.notas && <div style={estilos.cardEventoNota}>{evento.notas}</div>}
      </div>
      <span style={estilos.cardSeta}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </button>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 560, boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 14px', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },

  cabecalho: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 0 12px', flexShrink: 0 },
  mesTitulo: { flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: cores.texto, fontFamily: 'var(--fonte-titulo, inherit)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  setaMes: { border: 'none', background: 'transparent', color: cores.textoApagado, fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: '2px 6px', flexShrink: 0 },
  lupa: { flexShrink: 0, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '50%', padding: 0, marginLeft: 2 },

  seletorVista: { display: 'flex', gap: 4, background: cores.superficie2, border: `1px solid ${cores.borda}`, borderRadius: 999, padding: 4, marginBottom: 14 },
  vistaBtn: { flex: 1, padding: '8px 0', border: 'none', background: 'transparent', color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', borderRadius: 999 },
  vistaBtnAtivo: { background: cores.superficie, color: cores.acento, boxShadow: sombraSuave },

  favLista: { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 },
  favCard: { flex: '0 0 auto', width: 150, boxSizing: 'border-box', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 7, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '11px 12px', cursor: 'pointer' },
  favCardIcone: { width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  favCardTitulo: { fontSize: 13.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  favCardContagem: { fontSize: 12.5, fontWeight: 800 },

  cartaoGrade: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, boxShadow: sombra, padding: '14px 10px 10px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  linhaSemana: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6, flexShrink: 0 },
  nomeSemana: { textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: cores.textoApagado },
  semana: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minHeight: 0 },

  celula: { minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: 66, padding: '5px 2px', border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' },
  numeroDia: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', fontSize: 16, fontWeight: 700, color: cores.texto, flexShrink: 0 },
  numeroForaMes: { color: cores.textoFraco, fontWeight: 600 },
  numeroHoje: { border: `2px solid ${cores.acento}`, color: cores.acento },
  numeroFeriado: { color: COR_FERIADO, fontWeight: 800 },
  numeroSelecionado: { background: `var(--dia-sel-bg, ${cores.acento})`, color: `var(--dia-sel-texto, ${cores.textoClaro})` },
  celConteudo: { width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 },
  chip: { display: 'block', width: '100%', boxSizing: 'border-box', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.35, letterSpacing: -0.1 },
  chipMais: { fontSize: 8.5, fontWeight: 700, color: cores.textoApagado, paddingLeft: 4, lineHeight: 1.3 },
  feriadoTag: { maxWidth: '100%', boxSizing: 'border-box', fontSize: 8.5, fontWeight: 700, lineHeight: 1.15, color: 'var(--feriado-texto, #0e6f86)', background: 'var(--feriado-bg, #e6f6fb)', border: '1px solid var(--feriado-borda, #b7e3ef)', borderRadius: 5, padding: '1px 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },

  anoGrade: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  miniCartao: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '8px 6px 6px' },
  miniTitulo: { display: 'block', width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: cores.acento, cursor: 'pointer', marginBottom: 4, padding: 0 },
  miniSemana: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 },
  miniDow: { textAlign: 'center', fontSize: 8, fontWeight: 700, color: cores.textoFraco },
  miniLinha: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
  miniDia: { position: 'relative', aspectRatio: '1 / 1', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: cores.texto, fontSize: 9.5, fontWeight: 600, cursor: 'pointer', borderRadius: '50%', padding: 0 },
  miniForaMes: { color: cores.textoFraco, opacity: 0.5 },
  miniHoje: { border: `1.4px solid ${cores.acento}`, color: cores.acento, fontWeight: 800 },
  miniSel: { background: cores.acento, color: cores.textoClaro, fontWeight: 800 },
  miniPonto: { position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: cores.acento },

  semanaGradeUnica: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minHeight: 0 },
  celulaSemana: { minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 2px', border: 'none', background: 'transparent', cursor: 'pointer', overflow: 'hidden' },
  chipSemana: { display: 'block', width: '100%', boxSizing: 'border-box', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4, letterSpacing: -0.1 },

  semanaLista: { display: 'flex', flexDirection: 'column', gap: 8 },
  semanaDia: { width: '100%', boxSizing: 'border-box', textAlign: 'left', display: 'flex', gap: 12, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '10px 12px', cursor: 'pointer' },
  semanaDiaSel: { borderColor: cores.acento, boxShadow: sombraAcento },
  semanaData: { flexShrink: 0, width: 38, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  semanaDow: { fontSize: 10.5, fontWeight: 700, color: cores.textoApagado, letterSpacing: 0.4 },
  semanaNum: { fontSize: 19, fontWeight: 800, color: cores.texto, lineHeight: 1.2 },
  semanaNumHoje: { color: cores.acento },
  semanaConteudo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' },
  semanaFeriado: { fontSize: 12, fontWeight: 700, color: 'var(--feriado-texto, #0e6f86)' },
  semanaVazio: { fontSize: 13, color: cores.textoFraco },
  semanaEvento: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 },
  semanaPonto: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  semanaHora: { fontSize: 12, fontWeight: 700, color: cores.textoApagado, flexShrink: 0 },
  semanaTitulo: { fontSize: 13.5, fontWeight: 600, color: cores.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  agendaTitulo: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 15.5, fontWeight: 700, color: cores.texto, margin: '22px 2px 12px' },
  agendaHoje: { color: cores.acento, fontWeight: 800 },
  agendaVazia: { color: cores.textoSuave, fontSize: 14, textAlign: 'center', padding: '20px 0' },
  feriadoAviso: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--feriado-bg, #e6f6fb)', color: 'var(--feriado-texto, #0e6f86)', border: '1px solid var(--feriado-borda, #b7e3ef)', borderRadius: raio, padding: '9px 12px', fontSize: 13.5, fontWeight: 700, margin: '0 2px 12px' },

  periodoTitulo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: cores.texto, margin: '14px 2px 8px' },
  periodoIcone: { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  cardEvento: { width: '100%', boxSizing: 'border-box', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, boxShadow: sombraSuave, padding: '11px 13px', marginBottom: 8 },
  cardSeta: { flexShrink: 0, marginLeft: 'auto', display: 'flex', color: cores.textoApagado },
  cardHora: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 44, flexShrink: 0 },
  horaInicio: { fontSize: 14, fontWeight: 800, color: cores.texto },
  horaFim: { fontSize: 12, color: cores.textoApagado, fontWeight: 600 },
  cardEventoIcone: { flexShrink: 0, width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardEventoTexto: { minWidth: 0 },
  cardEventoTitulo: { fontSize: 14.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2 },
  cardFavEstrela: { color: '#f59e0b', marginRight: 4 },
  cardEventoSub: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  cardEventoNota: { fontSize: 12, color: cores.textoSuave, marginTop: 2 },

  botaoMais: {
    position: 'fixed', right: 'max(18px, calc(50vw - 280px + 18px))', bottom: 24, zIndex: 30,
    width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: cores.acento, color: cores.acentoTexto,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: sombraAcento,
  },
};

export default Calendario;
