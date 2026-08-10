// Novo Momento de Vida (bottom sheet). De propósito enxuto: um marco da vida é
// só QUANDO aconteceu e O QUE foi — sem horário, sem lembrete, sem repetição.
//
// Campos: título, data, categoria (conjunto fixo) e descrição opcional. Serve
// tanto para criar quanto para editar/excluir um momento existente.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { criarMomento, atualizarMomento, deletarMomento } from '../db/momentos';
import { CATEGORIAS_MOMENTO, CATEGORIA_MOMENTO_PADRAO } from '../lib/momentoCategorias';
import SeletorData from './SeletorData';
import { IconeCat } from './IconeCat';
import { hojeISO } from '../lib/datas';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function formatarData(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const dow = new Date(a, m - 1, d).getDay();
  return `${DIAS[dow].charAt(0).toUpperCase() + DIAS[dow].slice(1)}, ${d} de ${MESES[m - 1]} de ${a}`;
}

function NovoMomento({ momento, onSalvo, onFechar }) {
  const editando = !!momento;
  const [titulo, setTitulo] = useState(momento?.titulo ?? '');
  const [data, setData] = useState(momento?.data ?? hojeISO());
  const [categoria, setCategoria] = useState(momento?.categoria ?? CATEGORIA_MOMENTO_PADRAO);
  const [descricao, setDescricao] = useState(momento?.descricao ?? '');
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    const t = titulo.trim();
    if (!t) { setErro('Dê um título ao momento.'); return; }
    setSalvando(true);
    setErro('');
    const dados = { titulo: t, data, categoria, descricao: descricao.trim() };
    try {
      if (editando) await atualizarMomento(momento.id, dados);
      else await criarMomento(dados);
      await onSalvo?.(data);
      onFechar();
    } catch {
      setErro('Não deu para salvar. Tente de novo.');
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      await deletarMomento(momento.id);
      await onSalvo?.(momento.data);
      onFechar();
    } catch { setErro('Não deu para excluir.'); setSalvando(false); }
  }

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label={editando ? 'Editar momento' : 'Novo momento'}>
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />

        <div style={estilos.topo}>
          <span style={estilos.topoTitulo}>{editando ? 'Editar momento' : 'Novo momento'}</span>
          <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {!editando && <p style={estilos.intro}>Um marco que faz parte da sua história.</p>}

        {/* Título */}
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Casamento, Formatura, Primeiro emprego…"
          style={estilos.inputTitulo}
        />

        {/* Data */}
        <div style={estilos.rotulo}>Quando aconteceu</div>
        <div style={estilos.pill}>
          <span style={estilos.pillIcone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          </span>
          <div style={estilos.pillMeio}>
            <span style={estilos.pillRotulo}>Data</span>
            <span style={estilos.pillValor}>{formatarData(data)}</span>
          </div>
          <SeletorData valor={data} onMudar={setData} max={hojeISO()} />
        </div>

        {/* Categoria */}
        <div style={estilos.rotulo}>Categoria</div>
        <div style={estilos.chips}>
          {CATEGORIAS_MOMENTO.map((c) => {
            const ativo = categoria === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                style={{ ...estilos.chip, ...(ativo ? { borderColor: c.cor, background: cores.superficie2 } : null) }}
              >
                <span style={{ ...estilos.chipIcone, background: c.cor }}><IconeCat id={c.icone} tamanho={16} cor="#fff" strokeWidth={2} /></span>
                <span style={estilos.chipNome}>{c.nome}</span>
                {ativo && <span style={{ ...estilos.chipCheck, color: c.cor }} aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Descrição */}
        <div style={estilos.rotulo}>Descrição (opcional)</div>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Um detalhe que você não quer esquecer…" rows={3} style={estilos.textarea} />

        {erro && <div style={estilos.erro}>{erro}</div>}

        <button style={estilos.salvar} onClick={salvar} disabled={salvando}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
          {salvando ? 'Salvando…' : (editando ? 'Salvar' : 'Guardar momento')}
        </button>

        {editando && !confirmandoExcluir && (
          <button style={estilos.excluir} onClick={() => setConfirmandoExcluir(true)} disabled={salvando}>Excluir momento</button>
        )}
        {confirmandoExcluir && (
          <div style={estilos.confirma}>
            <span style={estilos.confirmaTexto}>Excluir este momento?</span>
            <div style={estilos.confirmaAcoes}>
              <button style={estilos.cancelarPeq} onClick={() => setConfirmandoExcluir(false)}>Não</button>
              <button style={estilos.excluirConfirma} onClick={excluir} disabled={salvando}>Sim, excluir</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '94vh', overflowY: 'auto', boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(20px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 8px' },
  topo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  topoTitulo: { fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  fechar: { width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginTop: 2 },
  intro: { fontSize: 13.5, color: cores.textoSuave, margin: '0 0 6px', fontWeight: 500 },

  inputTitulo: { width: '100%', boxSizing: 'border-box', padding: '4px 2px 12px', border: 'none', borderBottom: `2px solid ${cores.borda}`, background: 'transparent', color: cores.texto, fontSize: 22, fontWeight: 800, letterSpacing: -0.5, outline: 'none', fontFamily: 'inherit', marginBottom: 4 },

  rotulo: { fontSize: 12.5, fontWeight: 700, color: cores.texto, margin: '18px 0 8px' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, color: cores.texto, fontSize: 14.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical' },

  pill: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2 },
  pillIcone: { flexShrink: 0, display: 'flex' },
  pillMeio: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pillRotulo: { fontSize: 11, color: cores.textoApagado, fontWeight: 600 },
  pillValor: { fontSize: 14, fontWeight: 700, color: cores.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 8px', borderRadius: 999, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie, cursor: 'pointer' },
  chipIcone: { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chipNome: { fontSize: 13.5, fontWeight: 700, color: cores.texto },
  chipCheck: { fontWeight: 800, fontSize: 14 },

  erro: { marginTop: 14, padding: '10px 12px', borderRadius: raio, background: cores.acentoBg, color: cores.perigo, fontSize: 13, fontWeight: 600, textAlign: 'center' },
  salvar: { width: '100%', marginTop: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '14px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 15, fontWeight: 800, cursor: 'pointer' },
  excluir: { width: '100%', marginTop: 10, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.perigo, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  confirma: { marginTop: 16 },
  confirmaTexto: { display: 'block', fontSize: 14, fontWeight: 600, color: cores.texto, textAlign: 'center', marginBottom: 10 },
  confirmaAcoes: { display: 'flex', gap: 9 },
  cancelarPeq: { flex: 1, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  excluirConfirma: { flex: 1, padding: '11px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
};

export default NovoMomento;
