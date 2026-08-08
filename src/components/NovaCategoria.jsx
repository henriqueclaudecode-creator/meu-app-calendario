// Formulário de etiqueta (categoria): cria uma nova ou edita uma existente.
// Nome, ícone e cor terrosa. Ao salvar, fecha e devolve a etiqueta criada para
// quem chamou (ex.: o formulário de compromisso já a seleciona).

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { criarCategoria, atualizarCategoria, deletarCategoria } from '../db/categorias';
import { CORES_CATEGORIA, COR_PADRAO } from '../lib/coresCategoria';
import { ICONES_CATEGORIA, IconeCat } from './IconeCat';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

const MAX_NOME = 30;
const VISIVEIS = 11; // ícones antes do "Mais ícones"

function NovaCategoria({ categoria, onSalvo, onFechar }) {
  const editando = !!categoria;
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [icone, setIcone] = useState(categoria?.icone ?? ICONES_CATEGORIA[0]);
  const [cor, setCor] = useState(categoria?.cor ?? COR_PADRAO);
  const [verTodos, setVerTodos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);

  const iconesMostrados = verTodos ? ICONES_CATEGORIA : ICONES_CATEGORIA.slice(0, VISIVEIS);

  async function salvar() {
    const n = nome.trim();
    if (!n || salvando) return;
    setSalvando(true);
    try {
      if (editando) {
        await atualizarCategoria(categoria.id, { nome: n, icone, cor });
        await onSalvo?.({ ...categoria, nome: n, icone, cor });
      } else {
        const nova = await criarCategoria({ nome: n, icone, cor });
        await onSalvo?.(nova);
      }
      onFechar();
    } catch {
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      await deletarCategoria(categoria.id);
      await onSalvo?.(null);
      onFechar();
    } catch {
      setSalvando(false);
    }
  }

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label={editando ? 'Editar categoria' : 'Nova categoria'}>
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />
        <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div style={estilos.cabecalho}>
          <div style={estilos.titulo}>{editando ? 'Editar categoria' : 'Nova categoria'}</div>
          <div style={estilos.subtitulo}>Crie uma categoria para organizar seus compromissos.</div>
        </div>

        <div style={estilos.conteudo}>
          {/* Nome */}
          <div style={estilos.rotuloLinha}>
            <span style={estilos.rotulo}>Nome</span>
            <span style={estilos.contador}>{nome.length}/{MAX_NOME}</span>
          </div>
          <input
            value={nome}
            autoFocus
            maxLength={MAX_NOME}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
            placeholder="Ex.: Estudos, Trabalho, Saúde..."
            style={estilos.input}
          />

          {/* Ícone */}
          <div style={{ ...estilos.rotulo, marginTop: 20, marginBottom: 12 }}>Ícone</div>
          <div style={estilos.gradeIcones}>
            {iconesMostrados.map((ic) => {
              const ativo = ic === icone;
              return (
                <button key={ic} style={{ ...estilos.iconeBtn, ...(ativo ? { borderColor: cor, background: cor + '22' } : null) }} onClick={() => setIcone(ic)} aria-pressed={ativo}>
                  <IconeCat id={ic} tamanho={22} cor={ativo ? cor : cores.texto} />
                </button>
              );
            })}
            {!verTodos && ICONES_CATEGORIA.length > VISIVEIS && (
              <button style={estilos.iconeBtn} onClick={() => setVerTodos(true)} aria-label="Mais ícones">
                <svg width="22" height="22" viewBox="0 0 24 24" fill={cores.texto}><circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" /></svg>
              </button>
            )}
          </div>
          {!verTodos && ICONES_CATEGORIA.length > VISIVEIS && (
            <button style={estilos.maisIcones} onClick={() => setVerTodos(true)}>
              Mais ícones <span aria-hidden="true">›</span>
            </button>
          )}

          {/* Cor */}
          <div style={{ ...estilos.rotulo, marginTop: 20, marginBottom: 12 }}>Cor</div>
          <div style={estilos.gradeCores}>
            {CORES_CATEGORIA.map((c) => {
              const ativo = c.hex === cor;
              return (
                <button key={c.id} style={{ ...estilos.corBtn, ...(ativo ? { boxShadow: `0 0 0 2px ${cores.superficie}, 0 0 0 4px ${c.hex}` } : null) }} onClick={() => setCor(c.hex)} aria-label={c.nome} aria-pressed={ativo} title={c.nome}>
                  <span style={{ ...estilos.corBola, background: c.hex }}>
                    {ativo && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>

          {editando && !confirmandoExcluir && (
            <button style={estilos.excluir} onClick={() => setConfirmandoExcluir(true)} disabled={salvando}>Excluir categoria</button>
          )}
          {confirmandoExcluir && (
            <div style={estilos.confirma}>
              <span style={estilos.confirmaTexto}>Excluir esta categoria? Os compromissos ficam sem etiqueta.</span>
              <div style={estilos.confirmaAcoes}>
                <button style={estilos.cancelarPeq} onClick={() => setConfirmandoExcluir(false)}>Não</button>
                <button style={estilos.excluirConfirma} onClick={excluir} disabled={salvando}>Sim, excluir</button>
              </div>
            </div>
          )}
        </div>

        <button style={{ ...estilos.criar, background: nome.trim() ? cor : cores.bordaForte }} onClick={salvar} disabled={!nome.trim() || salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar categoria' : 'Criar categoria'}
        </button>
      </div>
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { position: 'relative', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(18px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 6px' },
  fechar: { position: 'absolute', top: 14, left: 14, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },
  cabecalho: { textAlign: 'center', margin: '6px 0 20px' },
  titulo: { fontSize: 21, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  subtitulo: { fontSize: 13.5, color: cores.textoSuave, marginTop: 4, fontWeight: 500, lineHeight: 1.4 },
  conteudo: {},
  rotuloLinha: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  rotulo: { fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: cores.textoApagado },
  contador: { fontSize: 12, fontWeight: 600, color: cores.textoApagado },
  input: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, color: cores.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  gradeIcones: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 },
  iconeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', borderRadius: '50%', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  maisIcones: { display: 'block', margin: '12px auto 0', border: 'none', background: 'transparent', color: cores.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  gradeCores: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  corBtn: { width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  corBola: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  excluir: { width: '100%', marginTop: 22, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.perigo, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  confirma: { marginTop: 18 },
  confirmaTexto: { display: 'block', fontSize: 13.5, fontWeight: 600, color: cores.texto, textAlign: 'center', marginBottom: 10, lineHeight: 1.4 },
  confirmaAcoes: { display: 'flex', gap: 9 },
  cancelarPeq: { flex: 1, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  excluirConfirma: { flex: 1, padding: '11px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  criar: { width: '100%', marginTop: 24, padding: '15px', border: 'none', borderRadius: 999, color: '#fff', fontSize: 15.5, fontWeight: 800, cursor: 'pointer' },
};

export default NovaCategoria;
