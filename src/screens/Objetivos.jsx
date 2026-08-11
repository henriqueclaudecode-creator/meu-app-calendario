// Aba Objetivos — os concursos/exames/metas que o estudante acompanha.
//
// No topo, um destaque para o objetivo principal (o de maior prioridade). Abaixo,
// a lista de todos, cada um com sua data de prova, contagem regressiva, números
// (disciplinas, eventos, simulados) e um anel de progresso. No fim, os próximos
// eventos importantes puxados dos eventos reais (provas e simulados).

import { useEffect, useState } from 'react';
import { listarObjetivos } from '../db/objetivos';
import { listarEventos } from '../db/eventos';
import { hojeISO, diasEntre } from '../lib/datas';
import { CATEGORIAS } from '../lib/eventoCategorias';
import { IconeCategoria } from '../components/EventoCategoria';
import { ObjetivoIcone } from '../components/ObjetivoIcone';
import NovoObjetivo from '../components/NovoObjetivo';
import { cores, sombra, sombraSuave, raio, raioGrande, suavizarCor } from '../lib/tema';

const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function formatarProva(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

function Objetivos() {
  const hoje = hojeISO();
  const [objetivos, setObjetivos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState(null); // null | { objetivo: null|obj }

  async function carregar() {
    try {
      const [obs, evs] = await Promise.all([listarObjetivos(), listarEventos()]);
      setObjetivos(obs);
      setEventos(evs);
    } catch {
      setObjetivos([]);
      setEventos([]);
    }
  }
  useEffect(() => { carregar(); }, []);

  const ativos = objetivos.filter((o) => !o.arquivado);
  const principal = ativos.find((o) => o.principal) ?? ativos[0];

  // Próximos eventos importantes: provas e simulados futuros, mais próximos primeiro.
  const proximos = eventos
    .filter((e) => (e.categoria === 'prova' || e.categoria === 'simulado') && e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 8);

  return (
    <div style={estilos.pagina} className="telaObjetivos">
      <div style={estilos.cabecalho}>
        <div>
          <h1 style={estilos.titulo}>Objetivos</h1>
          <p style={estilos.subtitulo}>Acompanhe seus concursos e metas</p>
        </div>
        <button style={estilos.botaoAdd} className="fab" onClick={() => setForm({ objetivo: null })} aria-label="Novo objetivo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {principal && <Destaque objetivo={principal} hoje={hoje} onAbrir={() => setForm({ objetivo: principal })} />}

      {ativos.length > 0 && <div style={estilos.secaoTitulo}>Meus objetivos</div>}

      {ativos.length === 0 ? (
        <p style={estilos.vazia}>Nenhum objetivo ainda. Toque no + para criar o primeiro.</p>
      ) : (
        ativos.map((o) => <CardObjetivo key={o.id} objetivo={o} hoje={hoje} onAbrir={() => setForm({ objetivo: o })} />)
      )}

      {proximos.length > 0 && (
        <>
          <div style={estilos.secaoTitulo}>Próximos eventos importantes</div>
          <div style={estilos.faixaEventos} className="sem-barra">
            {proximos.map((e) => <CardProximo key={e.id} evento={e} hoje={hoje} />)}
          </div>
        </>
      )}

      {form && (
        <NovoObjetivo
          objetivo={form.objetivo}
          onSalvo={carregar}
          onFechar={() => setForm(null)}
        />
      )}
    </div>
  );
}

function Destaque({ objetivo, hoje, onAbrir }) {
  const faltam = Math.max(0, diasEntre(hoje, objetivo.dataProva));
  const cor = suavizarCor(objetivo.cor);
  return (
    <button style={{ ...estilos.destaque, background: cor + '1f', borderColor: cor + '33' }} onClick={onAbrir}>
      <div style={estilos.destaqueTopo}>
        <span style={{ ...estilos.destaqueIcone, background: cores.superficie }}>
          <ObjetivoIcone icone={objetivo.icone} tamanho={30} cor={cor} />
        </span>
        <div style={estilos.destaqueMeio}>
          <div style={estilos.destaqueTitulo}>{objetivo.titulo}</div>
          {objetivo.subtitulo && <div style={estilos.destaqueSub}>{objetivo.subtitulo}</div>}
          <span style={{ ...estilos.provaChip, background: cores.superficie, color: cor }}>Prova: {formatarProva(objetivo.dataProva)}</span>
        </div>
        <div style={estilos.destaqueDias}>
          <div style={{ ...estilos.faltamRotulo, color: cor }}>Faltam</div>
          <div style={{ ...estilos.faltamNumero, color: cor }}>{faltam}</div>
          <div style={{ ...estilos.faltamRotulo, color: cor }}>dias</div>
        </div>
      </div>
      <div style={estilos.barraFundo}>
        <div style={{ ...estilos.barraProg, width: `${objetivo.progresso}%`, background: cor }} />
      </div>
      <div style={estilos.destaqueRodape}>
        <span style={{ color: cor, fontWeight: 700 }}>{objetivo.progresso}% concluído</span>
      </div>
    </button>
  );
}

function CardObjetivo({ objetivo, hoje, onAbrir }) {
  const faltam = Math.max(0, diasEntre(hoje, objetivo.dataProva));
  const cor = suavizarCor(objetivo.cor);
  return (
    <button style={estilos.card} onClick={onAbrir}>
      <div style={estilos.cardTopo}>
        <span style={{ ...estilos.cardIcone, background: cor }}>
          <ObjetivoIcone icone={objetivo.icone} tamanho={26} cor="#fff" />
        </span>
        <div style={estilos.cardMeio}>
          <div style={estilos.cardTitulo}>
            {objetivo.titulo}
            {objetivo.principal && <span style={estilos.principalTag}>Principal</span>}
          </div>
          {objetivo.subtitulo && <div style={estilos.cardSub}>{objetivo.subtitulo}</div>}
          <div style={estilos.cardProva}>📅 Prova: {formatarProva(objetivo.dataProva)}</div>
        </div>
        <div style={estilos.cardDias}>
          <div style={estilos.cardDiasRotulo}>Faltam</div>
          <div style={estilos.cardDiasNumero}>{faltam} <span style={estilos.cardDiasUn}>dias</span></div>
        </div>
      </div>
      <div style={estilos.numerosLinha}>
        <Numero rotulo={objetivo.rotuloDisc} valor={objetivo.disciplinas} cor={cor} />
        <Numero rotulo="Eventos" valor={objetivo.eventos} cor={cor} />
        <Numero rotulo="Simulados" valor={objetivo.simulados} cor={cor} />
        <Anel progresso={objetivo.progresso} cor={cor} />
      </div>
    </button>
  );
}

function Numero({ rotulo, valor, cor }) {
  return (
    <div style={estilos.numeroBox}>
      <span style={estilos.numeroRotulo}>{rotulo}</span>
      <span style={{ ...estilos.numeroValor, color: cor }}>{valor}</span>
    </div>
  );
}

function Anel({ progresso, cor }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const traco = (progresso / 100) * circ;
  return (
    <div style={estilos.anelBox}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke={cores.borda} strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={cor} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${traco} ${circ}`} transform="rotate(-90 26 26)" />
        <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={cores.texto}>{progresso}%</text>
      </svg>
    </div>
  );
}

function CardProximo({ evento, hoje }) {
  const cat = CATEGORIAS[evento.categoria] ?? CATEGORIAS.evento;
  const [, m, d] = evento.data.split('-').map(Number);
  const faltam = Math.max(0, diasEntre(hoje, evento.data));
  return (
    <div style={{ ...estilos.proximo, borderColor: cat.bg }}>
      <div style={estilos.proximoTopo}>
        <div>
          <div style={{ ...estilos.proximoDia, color: cat.cor }}>{String(d).padStart(2, '0')}</div>
          <div style={{ ...estilos.proximoMes, color: cat.cor }}>{MESES_CURTO[m - 1]}</div>
        </div>
        <span style={{ ...estilos.proximoIcone, background: cat.bg }}>
          <IconeCategoria categoria={evento.categoria} tamanho={18} />
        </span>
      </div>
      <div style={estilos.proximoTitulo}>{evento.titulo}</div>
      {evento.sub && <div style={estilos.proximoSub}>{evento.sub}</div>}
      <span style={{ ...estilos.proximoBadge, background: cat.bg, color: cat.cor }}>⏱ {faltam} dias</span>
    </div>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 'var(--app-max, 560px)', boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 90px', position: 'relative' },

  cabecalho: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 2px 16px' },
  titulo: { fontSize: 30, fontWeight: 800, letterSpacing: -0.6, color: cores.texto, margin: 0 },
  subtitulo: { fontSize: 14, color: cores.textoSuave, margin: '4px 0 0', fontWeight: 500 },
  botaoAdd: { flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: cores.acento, color: cores.textoClaro, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.30)' },

  destaque: { display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid', borderRadius: raioGrande, boxShadow: sombra, padding: 18, marginBottom: 20 },
  destaqueTopo: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  destaqueIcone: { flexShrink: 0, width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: sombraSuave },
  destaqueMeio: { flex: 1, minWidth: 0 },
  destaqueTitulo: { fontSize: 20, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  destaqueSub: { fontSize: 14, color: cores.textoSuave, marginTop: 2, fontWeight: 500 },
  provaChip: { display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, border: `1px solid ${cores.borda}` },
  destaqueDias: { flexShrink: 0, textAlign: 'right' },
  faltamRotulo: { fontSize: 13, fontWeight: 600, lineHeight: 1.1 },
  faltamNumero: { fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: -1 },
  barraFundo: { height: 8, borderRadius: 999, background: 'rgba(128, 140, 165, 0.25)', marginTop: 16, overflow: 'hidden' },
  barraProg: { height: '100%', borderRadius: 999 },
  destaqueRodape: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 },

  secaoTitulo: { fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: cores.texto, margin: '8px 2px 12px' },
  vazia: { color: cores.textoSuave, fontSize: 14, textAlign: 'center', padding: '20px 0' },

  card: { display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, boxShadow: sombra, padding: 16, marginBottom: 14 },
  cardTopo: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardIcone: { flexShrink: 0, width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardMeio: { flex: 1, minWidth: 0 },
  cardTitulo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: cores.texto, flexWrap: 'wrap' },
  principalTag: { padding: '2px 8px', borderRadius: 999, background: 'var(--principal-tag-bg, #fdeced)', color: cores.perigo, fontSize: 11, fontWeight: 700 },
  cardSub: { fontSize: 13.5, color: cores.textoSuave, marginTop: 2, fontWeight: 500 },
  cardProva: { fontSize: 12.5, color: cores.textoApagado, marginTop: 6, fontWeight: 600 },
  cardDias: { flexShrink: 0, textAlign: 'right' },
  cardDiasRotulo: { fontSize: 12, color: cores.textoSuave, fontWeight: 600 },
  cardDiasNumero: { fontSize: 22, fontWeight: 800, color: cores.texto, letterSpacing: -0.5 },
  cardDiasUn: { fontSize: 13, fontWeight: 600, color: cores.textoSuave },

  numerosLinha: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 },
  numeroBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 8px', background: cores.superficie2, borderRadius: raio },
  numeroRotulo: { fontSize: 11.5, color: cores.textoSuave, fontWeight: 600 },
  numeroValor: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  anelBox: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60 },

  faixaEventos: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, scrollSnapType: 'x proximity' },
  proximo: { flexShrink: 0, width: 150, boxSizing: 'border-box', background: cores.superficie, border: '1px solid', borderRadius: raio, boxShadow: sombraSuave, padding: 12, scrollSnapAlign: 'start' },
  proximoTopo: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  proximoDia: { fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: -1 },
  proximoMes: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 },
  proximoIcone: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  proximoTitulo: { fontSize: 14, fontWeight: 700, color: cores.texto, marginTop: 12, letterSpacing: -0.2 },
  proximoSub: { fontSize: 12, color: cores.textoSuave, marginTop: 2 },
  proximoBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 10, padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 },
};

export default Objetivos;
