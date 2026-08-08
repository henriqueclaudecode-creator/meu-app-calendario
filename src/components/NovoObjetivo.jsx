// Formulário de objetivo: cria, edita ou exclui uma meta (concurso, exame...).
//
// Escolhe cor e ícone, título, data da prova, e os números que aparecem nos
// cards (disciplinas/áreas, eventos, simulados, progresso). Grava no
// localStorage e devolve o controle para a tela recarregar.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { criarObjetivo, atualizarObjetivo, deletarObjetivo } from '../db/objetivos';
import { ObjetivoIcone, ICONES_OBJETIVO } from './ObjetivoIcone';
import SeletorData from './SeletorData';
import { hojeISO } from '../lib/datas';
import { cores, sombraForte, raio, raioGrande, raioPequeno } from '../lib/tema';

const CORES = [
  { cor: '#2563eb', bg: '#eff6ff' },
  { cor: '#16a34a', bg: '#e7f6ee' },
  { cor: '#7c3aed', bg: '#f3edfe' },
  { cor: '#e5484d', bg: '#fdeced' },
  { cor: '#f97316', bg: '#fff3e9' },
  { cor: '#0891b2', bg: '#e6f6fb' },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function formatarData(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}. de ${a}`;
}

function NovoObjetivo({ objetivo, onSalvo, onFechar }) {
  const editando = !!objetivo;
  const [titulo, setTitulo] = useState(objetivo?.titulo ?? '');
  const [subtitulo, setSubtitulo] = useState(objetivo?.subtitulo ?? '');
  const [dataProva, setDataProva] = useState(objetivo?.dataProva ?? hojeISO());
  const [paleta, setPaleta] = useState(() => {
    const achado = CORES.find((c) => c.cor === objetivo?.cor);
    return achado ?? CORES[0];
  });
  const [icone, setIcone] = useState(objetivo?.icone ?? 'alvo');
  const [rotuloDisc, setRotuloDisc] = useState(objetivo?.rotuloDisc ?? 'Disciplinas');
  const [disciplinas, setDisciplinas] = useState(String(objetivo?.disciplinas ?? ''));
  const [eventos, setEventos] = useState(String(objetivo?.eventos ?? ''));
  const [simulados, setSimulados] = useState(String(objetivo?.simulados ?? ''));
  const [progresso, setProgresso] = useState(Number(objetivo?.progresso ?? 0));
  const [principal, setPrincipal] = useState(!!objetivo?.principal);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    const t = titulo.trim();
    if (!t) { setErro('Dê um nome ao objetivo.'); return; }
    setSalvando(true);
    setErro('');
    const dados = {
      titulo: t, subtitulo: subtitulo.trim(), dataProva,
      cor: paleta.cor, bg: paleta.bg, icone, rotuloDisc,
      disciplinas, eventos, simulados, progresso, principal,
    };
    try {
      if (editando) await atualizarObjetivo(objetivo.id, dados);
      else await criarObjetivo(dados);
      await onSalvo?.();
      onFechar();
    } catch {
      setErro('Não deu para salvar. Tente de novo.');
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      await deletarObjetivo(objetivo.id);
      await onSalvo?.();
      onFechar();
    } catch {
      setErro('Não deu para excluir. Tente de novo.');
      setSalvando(false);
    }
  }

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true">
      <div style={estilos.painel} className="modalPainel" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.titulo}>{editando ? 'Editar objetivo' : 'Novo objetivo'}</div>

        <div style={estilos.rotulo}>Cor e ícone</div>
        <div style={estilos.linhaVisual}>
          <span style={{ ...estilos.previa, background: paleta.cor }}>
            <ObjetivoIcone icone={icone} tamanho={28} cor="#fff" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={estilos.cores}>
              {CORES.map((c) => (
                <button key={c.cor} onClick={() => setPaleta(c)}
                  style={{ ...estilos.bolinhaCor, background: c.cor, outline: c.cor === paleta.cor ? `2px solid ${cores.texto}` : 'none', outlineOffset: 2 }}
                  aria-label={`Cor ${c.cor}`} />
              ))}
            </div>
            <div style={estilos.icones}>
              {ICONES_OBJETIVO.map((ic) => (
                <button key={ic} onClick={() => setIcone(ic)}
                  style={{ ...estilos.botaoIcone, ...(ic === icone ? { borderColor: paleta.cor, background: paleta.bg } : null) }}
                  aria-label={ic}>
                  <ObjetivoIcone icone={ic} tamanho={20} cor={ic === icone ? paleta.cor : cores.textoApagado} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={estilos.rotulo}>Nome</div>
        <input value={titulo} autoFocus onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Câmara dos Deputados" style={estilos.input} />

        <div style={estilos.rotulo}>Cargo / descrição</div>
        <input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Ex.: Analista Legislativo" style={estilos.input} />

        <div style={estilos.rotulo}>Data da prova</div>
        <div style={estilos.linhaData}>
          <span style={estilos.dataTexto}>{formatarData(dataProva)}</span>
          <SeletorData valor={dataProva} onMudar={setDataProva} />
        </div>

        <div style={estilos.rotulo}>Números dos cards</div>
        <div style={estilos.numeros}>
          <CampoNum rotulo={rotuloDisc} valor={disciplinas} onMudar={setDisciplinas} onAlternarRotulo={() => setRotuloDisc((r) => (r === 'Disciplinas' ? 'Áreas' : 'Disciplinas'))} alternavel />
          <CampoNum rotulo="Eventos" valor={eventos} onMudar={setEventos} />
          <CampoNum rotulo="Simulados" valor={simulados} onMudar={setSimulados} />
        </div>

        <div style={estilos.rotulo}>Progresso: {progresso}%</div>
        <input type="range" min="0" max="100" value={progresso} onChange={(e) => setProgresso(Number(e.target.value))} style={{ width: '100%', accentColor: paleta.cor }} />

        <label style={estilos.linhaCheck}>
          <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} />
          Marcar como objetivo principal (destaque no topo)
        </label>

        {erro && <div style={estilos.erro}>{erro}</div>}

        {editando && !confirmando && (
          <button onClick={() => setConfirmando(true)} style={estilos.excluir} disabled={salvando}>Excluir objetivo</button>
        )}

        {confirmando ? (
          <div style={{ marginTop: 16 }}>
            <span style={estilos.confirmaTexto}>Excluir este objetivo?</span>
            <div style={estilos.acoes}>
              <button onClick={() => setConfirmando(false)} style={estilos.cancelar}>Não</button>
              <button onClick={excluir} disabled={salvando} style={estilos.salvarPerigo}>{salvando ? 'Excluindo...' : 'Sim, excluir'}</button>
            </div>
          </div>
        ) : (
          <div style={estilos.acoes}>
            <button onClick={onFechar} style={estilos.cancelar}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} style={{ ...estilos.salvar, background: paleta.cor }}>{salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CampoNum({ rotulo, valor, onMudar, alternavel, onAlternarRotulo }) {
  return (
    <div style={estilos.campoNum}>
      <button type="button" onClick={alternavel ? onAlternarRotulo : undefined}
        style={{ ...estilos.rotuloNum, cursor: alternavel ? 'pointer' : 'default' }}
        title={alternavel ? 'Alternar entre Disciplinas e Áreas' : undefined}>
        {rotulo}{alternavel ? ' ⇄' : ''}
      </button>
      <input type="number" min="0" value={valor} onChange={(e) => onMudar(e.target.value)} placeholder="0" style={estilos.inputNum} />
    </div>
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15, 37, 71, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 18, overflowY: 'auto' },
  painel: { width: '100%', maxWidth: 440, marginTop: 'min(5vh, 40px)', marginBottom: 40, boxSizing: 'border-box', background: cores.superficie, borderRadius: raioGrande, boxShadow: sombraForte, padding: '20px 20px 18px' },
  titulo: { fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: cores.texto, marginBottom: 6 },
  rotulo: { fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: cores.textoApagado, margin: '14px 0 7px' },
  linhaVisual: { display: 'flex', gap: 12, alignItems: 'center' },
  previa: { flexShrink: 0, width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cores: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  bolinhaCor: { width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 },
  icones: { display: 'flex', gap: 6 },
  botaoIcone: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${cores.borda}`, background: cores.superficie, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  input: { width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  linhaData: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '4px 4px 4px 13px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie },
  dataTexto: { fontSize: 14.5, fontWeight: 600, color: cores.texto },
  numeros: { display: 'flex', gap: 8 },
  campoNum: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  rotuloNum: { fontSize: 11, fontWeight: 700, color: cores.textoSuave, border: 'none', background: 'transparent', textAlign: 'left', padding: 0 },
  inputNum: { width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: raioPequeno, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  linhaCheck: { display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 0', fontSize: 13.5, fontWeight: 600, color: cores.textoSuave, cursor: 'pointer' },
  erro: { marginTop: 12, padding: '9px 12px', borderRadius: raioPequeno, background: '#fdeced', border: `1px solid ${cores.perigo}`, color: '#9b1c20', fontSize: 12.5, fontWeight: 600 },
  excluir: { width: '100%', marginTop: 16, padding: '10px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.perigo, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  confirmaTexto: { display: 'block', fontSize: 14, fontWeight: 600, color: cores.texto, textAlign: 'center', marginBottom: 10 },
  acoes: { display: 'flex', gap: 9, marginTop: 18 },
  cancelar: { flex: 1, padding: '12px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  salvar: { flex: 1, padding: '12px', border: 'none', borderRadius: raio, color: cores.textoClaro, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  salvarPerigo: { flex: 1, padding: '12px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};

export default NovoObjetivo;
