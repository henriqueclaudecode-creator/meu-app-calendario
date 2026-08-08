// Aniversário — cadastro de datas especiais de pessoas queridas.
//
// Guarda foto, nome, data de nascimento (com "não sei o ano"), grupo, lembretes,
// observações e se aparece na agenda. É salvo no mesmo armazém de eventos, com
// tipo 'aniversario' e repetição anual — então aparece todo ano no calendário.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { criarEvento, atualizarEvento, deletarEvento } from '../db/eventos';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

const GRUPOS = [
  { id: 'familia', rotulo: 'Família', cor: '#2563eb' },
  { id: 'amigos', rotulo: 'Amigos', cor: '#0f9d58' },
  { id: 'trabalho', rotulo: 'Trabalho', cor: '#f59e0b' },
  { id: 'parceiro', rotulo: 'Parceiro(a)', cor: '#e5484d' },
  { id: 'outro', rotulo: 'Outro', cor: '#64748b' },
];
const corDoGrupo = (id) => GRUPOS.find((g) => g.id === id)?.cor ?? '#64748b';

const OPCOES_LEMBRETE = [
  { id: '1sem', rotulo: '1 semana antes' },
  { id: '3dias', rotulo: '3 dias antes' },
  { id: '1dia', rotulo: '1 dia antes' },
  { id: 'nodia', rotulo: 'No dia' },
];
const rotuloLembrete = (id) => OPCOES_LEMBRETE.find((o) => o.id === id)?.rotulo ?? id;

const LEMBRETES_PADRAO = [
  { quando: '1sem', hora: '09:00' },
  { quando: '1dia', hora: '09:00' },
  { quando: 'nodia', hora: '09:00' },
];

// Mapeia o lembrete "mais próximo" ativo para o campo único que o sistema de
// notificações entende hoje (day-of às 09:00 etc.).
function lembretePrincipal(lembretes) {
  const ids = lembretes.map((l) => l.quando);
  if (ids.includes('nodia')) return 'no-horario';
  if (ids.includes('1dia')) return '1d';
  if (ids.length) return '1d';
  return 'nenhum';
}

function IconePessoa() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.textoApagado} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>;
}

function idadeEsteAno(dataNasc, anoNasc) {
  if (!anoNasc || !dataNasc) return null;
  const [, m, d] = dataNasc.split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - anoNasc;
  // Se o aniversário ainda não chegou este ano, a "idade este ano" é a que ele fará.
  const jaFez = (hoje.getMonth() + 1 > m) || (hoje.getMonth() + 1 === m && hoje.getDate() >= d);
  if (!jaFez) idade = idade; // completa ainda este ano
  return idade;
}

function NovoAniversario({ evento, onSalvo, onFechar }) {
  const editando = !!evento;
  const [foto, setFoto] = useState(evento?.foto ?? null);
  const [nome, setNome] = useState(evento?.titulo ?? '');
  const [dataNasc, setDataNasc] = useState(evento?.data ?? '');
  const [semAno, setSemAno] = useState(editando ? evento?.anoNascimento == null : false);
  const [grupo, setGrupo] = useState(evento?.grupo ?? 'familia');
  const [destacar, setDestacar] = useState(evento?.favorito ?? false);
  const [lembretes, setLembretes] = useState(evento?.lembretes ?? LEMBRETES_PADRAO);
  const [notas, setNotas] = useState(evento?.notas ?? '');
  const [exibir, setExibir] = useState(evento?.exibirNaAgenda ?? true);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [erro, setErro] = useState('');

  const anoNasc = (!semAno && dataNasc) ? Number(dataNasc.split('-')[0]) : null;
  const idade = idadeEsteAno(dataNasc, anoNasc);

  function escolherFoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => setFoto(leitor.result);
    leitor.readAsDataURL(f);
    e.target.value = '';
  }

  function alternarLembrete(quando) {
    setLembretes((atual) => atual.some((l) => l.quando === quando)
      ? atual.filter((l) => l.quando !== quando)
      : [...atual, { quando, hora: '09:00' }]);
  }
  function mudarHora(quando, hora) {
    setLembretes((atual) => atual.map((l) => l.quando === quando ? { ...l, hora } : l));
  }
  function adicionarLembrete() {
    const usados = lembretes.map((l) => l.quando);
    const livre = OPCOES_LEMBRETE.find((o) => !usados.includes(o.id));
    if (livre) setLembretes((atual) => [...atual, { quando: livre.id, hora: '09:00' }]);
  }

  async function salvar() {
    const n = nome.trim();
    if (!n) { setErro('Diga de quem é o aniversário.'); return; }
    if (!dataNasc) { setErro('Escolha a data de nascimento.'); return; }
    setSalvando(true);
    setErro('');
    const dados = {
      data: dataNasc,
      titulo: n,
      tipo: 'aniversario',
      inicio: null,
      fim: null,
      repetir: 'anual',
      lembrete: lembretePrincipal(lembretes),
      lembretes,
      notas: notas.trim(),
      favorito: destacar,
      cor: corDoGrupo(grupo),
      grupo,
      foto,
      anoNascimento: anoNasc,
      exibirNaAgenda: exibir,
    };
    try {
      if (editando) await atualizarEvento(evento.id, dados);
      else await criarEvento(dados);
      await onSalvo?.(dataNasc);
      onFechar();
    } catch {
      setErro('Não deu para salvar. Tente de novo.');
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      await deletarEvento(evento.id);
      await onSalvo?.(evento.data);
      onFechar();
    } catch { setErro('Não deu para excluir.'); setSalvando(false); }
  }

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label="Aniversário">
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />

        <div style={estilos.topo}>
          <button style={estilos.voltar} onClick={onFechar} aria-label="Voltar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span style={estilos.topoTitulo}>🎁 Aniversário</span>
          <span style={{ width: 34 }} />
        </div>

        {/* Foto */}
        <label style={estilos.fotoWrap}>
          {foto ? (
            <img src={foto} alt="Foto" style={estilos.fotoImg} />
          ) : (
            <span style={estilos.fotoVazia}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={cores.acento} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </span>
          )}
          <input type="file" accept="image/*" onChange={escolherFoto} style={{ display: 'none' }} />
          <span style={estilos.fotoTexto}>{foto ? 'Trocar foto' : 'Adicionar foto'}</span>
        </label>

        {/* Nome */}
        <div style={estilos.rotulo}>Nome da pessoa</div>
        <div style={estilos.campoIcone}>
          <IconePessoa />
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Paula Silva" style={estilos.inputPlano} />
        </div>

        {/* Data de nascimento */}
        <div style={estilos.rotulo}>Data de nascimento</div>
        <div style={estilos.campoIcone}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.textoApagado} strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="3.5" /><path d="M3 10h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
          <input type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} style={estilos.inputPlano} />
        </div>
        <label style={estilos.checkLinha}>
          <input type="checkbox" checked={semAno} onChange={(e) => setSemAno(e.target.checked)} style={estilos.checkbox} />
          <span style={estilos.checkTexto}>Não sei o ano de nascimento</span>
        </label>

        {/* Idade este ano */}
        <div style={estilos.rotulo}>Idade este ano</div>
        <div style={estilos.idadeCampo}>{semAno || idade == null ? '—' : `${idade} anos`}</div>

        {/* Grupo + destacar */}
        <div style={estilos.grupoLinha}>
          <span style={estilos.rotuloInline}>Grupo</span>
          <button type="button" style={estilos.destacar} onClick={() => setDestacar((v) => !v)}>
            <span style={estilos.destacarTexto}>Destacar aniversário</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={destacar ? '#f59e0b' : 'none'} stroke={destacar ? '#f59e0b' : cores.textoApagado} strokeWidth="1.6" strokeLinejoin="round"><path d="M12 2.5c.35 4.9 1.7 6.65 6.6 7-4.9.35-6.25 2.1-6.6 7-.35-4.9-1.7-6.65-6.6-7 4.9-.35 6.25-2.1 6.6-7z" /></svg>
            <span style={{ ...estilos.toggle, ...(destacar ? estilos.toggleOn : null) }}>
              <span style={{ ...estilos.toggleBola, ...(destacar ? estilos.toggleBolaOn : null) }} />
            </span>
          </button>
        </div>
        <div style={estilos.grupos}>
          {GRUPOS.map((g) => {
            const ativo = grupo === g.id;
            return (
              <button key={g.id} type="button" style={{ ...estilos.grupoChip, ...(ativo ? { borderColor: g.cor, background: `${g.cor}14` } : null) }} onClick={() => setGrupo(g.id)}>
                <span style={{ ...estilos.grupoBola, background: ativo ? g.cor : cores.superficie2 }}>
                  <IconeGrupo id={g.id} cor={ativo ? '#fff' : cores.textoApagado} />
                </span>
                <span style={{ ...estilos.grupoRotulo, ...(ativo ? { color: g.cor, fontWeight: 800 } : null) }}>{g.rotulo}</span>
              </button>
            );
          })}
        </div>

        {/* Lembretes */}
        <div style={estilos.rotulo}>Lembretes</div>
        <div style={estilos.lembretesCartao}>
          {OPCOES_LEMBRETE.map((o) => {
            const item = lembretes.find((l) => l.quando === o.id);
            const ativo = !!item;
            return (
              <div key={o.id} style={estilos.lembreteLinha}>
                <button type="button" style={{ ...estilos.check, ...(ativo ? estilos.checkOn : null) }} onClick={() => alternarLembrete(o.id)} aria-label={o.rotulo}>
                  {ativo && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                </button>
                <span style={{ ...estilos.lembreteRotulo, ...(ativo ? { color: cores.texto } : null) }}>{o.rotulo}</span>
                <input type="time" value={item?.hora ?? '09:00'} disabled={!ativo} onChange={(e) => mudarHora(o.id, e.target.value)} style={{ ...estilos.horaInput, ...(ativo ? null : { opacity: 0.5 }) }} />
              </div>
            );
          })}
        </div>

        {/* Observações */}
        <div style={estilos.rotulo}>Observações <span style={estilos.opcional}>(opcional)</span></div>
        <div style={estilos.obsWrap}>
          <textarea value={notas} maxLength={200} onChange={(e) => setNotas(e.target.value)} placeholder="Ex.: Ela ama café e livros." rows={3} style={estilos.textarea} />
          <span style={estilos.contador}>{notas.length}/200</span>
        </div>

        {/* Repetição (fixa: todos os anos) */}
        <div style={estilos.rotulo}>Repetição</div>
        <div style={estilos.repeticao}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          <span style={estilos.repeticaoTexto}>Todos os anos</span>
        </div>

        {/* Exibir na agenda */}
        <div style={estilos.rotulo}>Exibir na agenda</div>
        <button type="button" style={estilos.exibirLinha} onClick={() => setExibir((v) => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="3.5" /><path d="M3 10h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
          <span style={estilos.exibirTexto}>Mostrar este aniversário na sua agenda</span>
          <span style={{ ...estilos.toggle, ...(exibir ? estilos.toggleOn : null) }}>
            <span style={{ ...estilos.toggleBola, ...(exibir ? estilos.toggleBolaOn : null) }} />
          </span>
        </button>

        {erro && <div style={estilos.erro}>{erro}</div>}

        <button style={estilos.salvar} onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>

        {editando && !confirmarExcluir && (
          <button style={estilos.excluir} onClick={() => setConfirmarExcluir(true)} disabled={salvando}>Excluir aniversário</button>
        )}
        {confirmarExcluir && (
          <div style={estilos.confirma}>
            <span style={estilos.confirmaTexto}>Excluir este aniversário?</span>
            <div style={estilos.confirmaAcoes}>
              <button style={estilos.cancelarPeq} onClick={() => setConfirmarExcluir(false)}>Não</button>
              <button style={estilos.excluirConfirma} onClick={excluir} disabled={salvando}>Sim, excluir</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function IconeGrupo({ id, cor }) {
  const c = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: cor, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'familia') return <svg {...c}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.2" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M15.5 14h1a4 4 0 0 1 4 4v2" /></svg>;
  if (id === 'amigos') return <svg {...c}><circle cx="9" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M3 20v-1a5 5 0 0 1 5-5M13 14a5 5 0 0 1 8 5v1" /></svg>;
  if (id === 'trabalho') return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
  if (id === 'parceiro') return <svg {...c} fill={cor === '#fff' ? '#fff' : 'none'}><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>;
  return <svg {...c}><circle cx="5" cy="12" r="1.5" fill={cor} /><circle cx="12" cy="12" r="1.5" fill={cor} /><circle cx="19" cy="12" r="1.5" fill={cor} /></svg>;
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '94vh', overflowY: 'auto', boxSizing: 'border-box', background: cores.superficie, borderRadius: `${raioGrande + 6}px ${raioGrande + 6}px 0 0`, boxShadow: sombraForte, padding: '10px 18px calc(20px + env(safe-area-inset-bottom))' },
  pegador: { width: 40, height: 5, borderRadius: 999, background: cores.bordaForte, margin: '4px auto 8px' },
  topo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  voltar: { width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },
  topoTitulo: { fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },

  fotoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', margin: '4px 0 8px' },
  fotoImg: { width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' },
  fotoVazia: { width: 84, height: 84, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cores.acentoBg, border: `2px dashed ${cores.acentoClaro}` },
  fotoTexto: { fontSize: 14, fontWeight: 700, color: cores.acento },

  rotulo: { fontSize: 13, fontWeight: 700, color: cores.texto, margin: '16px 0 8px' },
  rotuloInline: { fontSize: 13, fontWeight: 700, color: cores.texto },
  opcional: { fontWeight: 500, color: cores.textoApagado },
  campoIcone: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2 },
  inputPlano: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: cores.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' },

  checkLinha: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, cursor: 'pointer' },
  checkbox: { width: 18, height: 18, accentColor: cores.acento },
  checkTexto: { fontSize: 13.5, color: cores.textoSuave, fontWeight: 500 },
  idadeCampo: { padding: '12px 14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2, color: cores.textoSuave, fontSize: 15, fontWeight: 700 },

  grupoLinha: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' },
  destacar: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },
  destacarTexto: { fontSize: 12.5, fontWeight: 600, color: cores.textoSuave },
  grupos: { display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 },
  grupoChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie, cursor: 'pointer', minWidth: 74 },
  grupoBola: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  grupoRotulo: { fontSize: 12, fontWeight: 600, color: cores.textoSuave },

  lembretesCartao: { border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, overflow: 'hidden' },
  lembreteLinha: { display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: `1px solid ${cores.borda}` },
  check: { width: 22, height: 22, flexShrink: 0, borderRadius: 6, border: `2px solid ${cores.bordaForte}`, background: cores.superficie, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  checkOn: { background: cores.acento, borderColor: cores.acento },
  lembreteRotulo: { flex: 1, fontSize: 14.5, fontWeight: 600, color: cores.textoApagado },
  horaInput: { border: 'none', background: 'transparent', color: cores.textoSuave, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', outline: 'none' },

  obsWrap: { position: 'relative' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '13px 14px 24px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2, color: cores.texto, fontSize: 14.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  contador: { position: 'absolute', right: 12, bottom: 10, fontSize: 11.5, color: cores.textoApagado, fontWeight: 600 },

  repeticao: { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2 },
  repeticaoTexto: { fontSize: 15, fontWeight: 700, color: cores.texto },

  exibirLinha: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2, cursor: 'pointer' },
  exibirTexto: { flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 600, color: cores.texto },

  toggle: { width: 42, height: 24, borderRadius: 999, background: cores.bordaForte, position: 'relative', flexShrink: 0, transition: 'background 0.15s ease' },
  toggleOn: { background: cores.acento },
  toggleBola: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' },
  toggleBolaOn: { transform: 'translateX(18px)' },

  erro: { marginTop: 14, padding: '10px 12px', borderRadius: raio, background: cores.acentoBg, color: cores.perigo, fontSize: 13, fontWeight: 600, textAlign: 'center' },
  salvar: { width: '100%', marginTop: 20, padding: '15px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 16, fontWeight: 800, cursor: 'pointer' },
  excluir: { width: '100%', marginTop: 10, padding: '11px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.perigo, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  confirma: { marginTop: 14 },
  confirmaTexto: { display: 'block', fontSize: 14, fontWeight: 600, color: cores.texto, textAlign: 'center', marginBottom: 10 },
  confirmaAcoes: { display: 'flex', gap: 9 },
  cancelarPeq: { flex: 1, padding: '11px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  excluirConfirma: { flex: 1, padding: '11px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
};

export default NovoAniversario;
