// Novo compromisso (bottom sheet). Neutro, no estilo Apple Calendar: o usuário
// só diz QUAL é o compromisso; a organização (etiqueta) é opcional e discreta.
//
// Campos: título, data e horário (com "dia todo"), etiqueta (categoria criada
// pelo usuário — dá para criar uma na hora), lembrete e notas.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { criarEvento, atualizarEvento, deletarEvento, deletarGrupo, excluirOcorrencia, criarEventoEmDatas, contarFavoritos, MAX_FAVORITOS } from '../db/eventos';
import { listarCategorias } from '../db/categorias';
import SeletorData from './SeletorData';
import SeletorHora from './SeletorHora';
import NovaCategoria from './NovaCategoria';
import { IconeCat } from './IconeCat';
import { buscarLocais, buscaLocalDisponivel, urlMapa } from '../lib/mapas';
import { compartilharConvite, abrirAnexo } from '../lib/convites';
import { cores, sombraForte, raio, raioGrande } from '../lib/tema';

const LEMBRETES = [
  { id: 'nenhum', rotulo: 'Nenhum' },
  { id: 'no-horario', rotulo: 'No horário' },
  { id: '5min', rotulo: '5 minutos antes' },
  { id: '10min', rotulo: '10 minutos antes' },
  { id: '30min', rotulo: '30 minutos antes' },
  { id: '1h', rotulo: '1 hora antes' },
  { id: '1d', rotulo: '1 dia antes' },
];
const rotuloLembrete = (id) => LEMBRETES.find((l) => l.id === id)?.rotulo ?? 'Nenhum';

const REPETICOES = [
  { id: 'nao', rotulo: 'Não repetir' },
  { id: 'diario', rotulo: 'Todos os dias' },
  { id: 'semanal', rotulo: 'Todas as semanas' },
  { id: 'mensal', rotulo: 'Todos os meses' },
  { id: 'anual', rotulo: 'Todos os anos' },
  { id: 'personalizado', rotulo: 'Personalizar' },
];
const rotuloRepeticao = (id) => REPETICOES.find((r) => r.id === id)?.rotulo ?? 'Não repetir';

const UNIDADES = [
  { id: 'dias', rotulo: 'dias' },
  { id: 'semanas', rotulo: 'semanas' },
  { id: 'meses', rotulo: 'meses' },
  { id: 'anos', rotulo: 'anos' },
];

// Paleta para colorir o compromisso (sobrepõe a cor da etiqueta).
const CORES_EVENTO = ['#2563eb', '#0891b2', '#0f9d58', '#f59e0b', '#f97316', '#e5484d', '#7c3aed', '#e58c8c'];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function formatarData(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const dow = new Date(a, m - 1, d).getDay();
  return `${DIAS[dow].charAt(0).toUpperCase() + DIAS[dow].slice(1)}, ${d} de ${MESES[m - 1]}`;
}

// Lista de dias a partir do dia SEGUINTE à data base (para o seletor de duplicação).
function proximosDias(baseIso, quantos) {
  const [a, m, d] = baseIso.split('-').map(Number);
  const inicio = new Date(a, m - 1, d);
  const dias = [];
  for (let i = 1; i <= quantos; i++) {
    const x = new Date(inicio);
    x.setDate(inicio.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    dias.push({ iso, dia: x.getDate(), dow: DIAS[x.getDay()], mes: MESES[x.getMonth()] });
  }
  return dias;
}

function NovoEvento({ evento, tipo, dataInicial, presetInicio, ocorrencia, onSalvo, onFechar }) {
  const editando = !!evento;
  // Tipo do item: 'compromisso' (padrão) ou 'evento' (com convidados/local/anexos).
  const tipoItem = evento?.tipo ?? tipo ?? 'compromisso';
  const ehEvento = tipoItem === 'evento';
  // Para a exclusão: repetido (uma ocorrência x todas) ou parte de uma leva
  // criada em vários dias (só este x todos os criados juntos).
  const ehRepetido = editando && !!evento.repetir && evento.repetir !== 'nao';
  const temGrupo = editando && !!evento.grupoId;
  const diaOcorrencia = ocorrencia ?? evento?.data;
  const [titulo, setTitulo] = useState(evento?.titulo ?? '');
  const [data, setData] = useState(evento?.data ?? dataInicial);
  const [diaTodo, setDiaTodo] = useState(editando ? !evento.inicio : !presetInicio && false);
  const [inicio, setInicio] = useState(evento?.inicio ?? presetInicio ?? '09:00');
  const [fim, setFim] = useState(evento?.fim ?? '11:00');
  const [categoriaId, setCategoriaId] = useState(evento?.categoriaId ?? null);
  const [lembrete, setLembrete] = useState(evento?.lembrete ?? '10min');
  const [notas, setNotas] = useState(evento?.notas ?? '');
  const [favorito, setFavorito] = useState(evento?.favorito ?? false);
  const [repetir, setRepetir] = useState(evento?.repetir ?? 'nao');
  const [repetirCada, setRepetirCada] = useState(evento?.repetirCada ?? 1);
  const [repetirUnidade, setRepetirUnidade] = useState(evento?.repetirUnidade ?? 'semanas');
  const [cor, setCor] = useState(evento?.cor ?? null);

  // Campos extras de "Evento".
  const [participantes, setParticipantes] = useState(evento?.participantes ?? []);
  const [emailNovo, setEmailNovo] = useState('');
  const [local, setLocal] = useState(evento?.local ?? null);
  const [buscaLocal, setBuscaLocal] = useState('');
  const [sugestoesLocal, setSugestoesLocal] = useState([]);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [anexos, setAnexos] = useState(evento?.anexos ?? []);
  const [maisOpcoes, setMaisOpcoes] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [painel, setPainel] = useState(null); // null | 'etiqueta' | 'lembrete' | 'repetir'
  const [criandoEtiqueta, setCriandoEtiqueta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);
  const [duplicando, setDuplicando] = useState(false); // mostra o seletor de dias
  const [diasDuplicar, setDiasDuplicar] = useState([]); // datas ISO extras escolhidas
  const [erro, setErro] = useState('');

  async function carregarCategorias() {
    try { setCategorias(await listarCategorias()); } catch { setCategorias([]); }
  }
  useEffect(() => { carregarCategorias(); }, []);

  // Busca de locais (com "debounce") enquanto o usuário digita.
  useEffect(() => {
    if (!ehEvento || !buscaLocalDisponivel()) return;
    const q = buscaLocal.trim();
    if (q.length < 3) { setSugestoesLocal([]); return; }
    setBuscandoLocal(true);
    const t = setTimeout(async () => {
      const r = await buscarLocais(q);
      setSugestoesLocal(r);
      setBuscandoLocal(false);
    }, 350);
    return () => clearTimeout(t);
  }, [buscaLocal, ehEvento]);

  const etiqueta = categorias.find((c) => c.id === categoriaId) ?? null;

  async function salvar() {
    const t = titulo.trim();
    if (!t) { setErro('Dê um título ao compromisso.'); return; }
    setSalvando(true);
    setErro('');
    const dados = {
      data,
      titulo: t,
      tipo: tipoItem,
      categoriaId,
      inicio: diaTodo ? null : inicio,
      fim: diaTodo ? null : (fim || null),
      lembrete,
      notas: notas.trim(),
      favorito,
      repetir,
      repetirCada: Math.max(1, parseInt(repetirCada, 10) || 1),
      repetirUnidade,
      cor,
      participantes,
      local,
      anexos,
    };
    try {
      if (editando) await atualizarEvento(evento.id, dados);
      else await criarEvento(dados);
      await onSalvo?.(data);
      onFechar();
    } catch {
      setErro('Não deu para salvar. Tente de novo.');
      setSalvando(false);
    }
  }

  // Gera o convite (.ics) e abre a tela de compartilhar do celular.
  async function compartilhar() {
    const t = titulo.trim();
    if (!t) { setErro('Dê um título ao evento primeiro.'); return; }
    setErro('');
    try {
      await compartilharConvite({
        id: evento?.id,
        titulo: t,
        data,
        inicio: diaTodo ? null : inicio,
        fim: diaTodo ? null : (fim || null),
        notas: notas.trim(),
        local,
        participantes,
        anexos,
      });
    } catch {
      setErro('Não deu para compartilhar o convite.');
    }
  }

  async function alternarFavorito() {
    setErro('');
    if (!favorito) {
      // Vai marcar como favorito: respeitar o limite (sem contar este evento).
      const total = await contarFavoritos();
      const jaConta = editando && evento.favorito ? 1 : 0;
      if (total - jaConta >= MAX_FAVORITOS) {
        setErro(`Você já tem ${MAX_FAVORITOS} favoritos. Desmarque um antes.`);
        return;
      }
    }
    setFavorito((v) => !v);
  }

  // Confirma a duplicação nos dias escolhidos (um ou vários).
  async function confirmarDuplicar() {
    const t = titulo.trim();
    if (!t) { setErro('Dê um título ao compromisso.'); return; }
    if (diasDuplicar.length === 0) { setErro('Escolha ao menos um dia para duplicar.'); return; }
    setSalvando(true);
    setErro('');
    const dados = {
      titulo: t,
      tipo: tipoItem,
      categoriaId,
      inicio: diaTodo ? null : inicio,
      fim: diaTodo ? null : (fim || null),
      lembrete,
      notas: notas.trim(),
      repetir,
      repetirCada: Math.max(1, parseInt(repetirCada, 10) || 1),
      repetirUnidade,
      cor,
      participantes,
      local,
      anexos,
    };
    // Na criação, inclui o dia principal (escolhido no formulário) + os dias
    // marcados. Na edição, só os dias extras (o original já existe nesse dia).
    const datas = editando ? diasDuplicar : [data, ...diasDuplicar];
    try {
      await criarEventoEmDatas(dados, datas);
      await onSalvo?.(datas[0]);
      onFechar();
    } catch {
      setErro('Não deu para duplicar. Tente de novo.');
      setSalvando(false);
    }
  }

  function alternarDiaDuplicar(iso) {
    setErro('');
    setDiasDuplicar((atual) => atual.includes(iso) ? atual.filter((d) => d !== iso) : [...atual, iso]);
  }

  // E-mails dos convidados (Evento).
  function adicionarEmail() {
    const e = emailNovo.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErro('E-mail inválido.'); return; }
    if (participantes.includes(e)) { setEmailNovo(''); return; }
    setParticipantes((p) => [...p, e]);
    setEmailNovo('');
    setErro('');
  }
  function removerEmail(e) { setParticipantes((p) => p.filter((x) => x !== e)); }

  // Local (Evento). Com backend, escolhe-se uma sugestão da busca; sem backend,
  // guarda o texto digitado como nome (o mapa abre pela busca por texto).
  function definirLocalTexto() {
    const q = buscaLocal.trim();
    if (!q) return;
    setLocal({ nome: q, endereco: '', cidade: '' });
    setBuscaLocal('');
    setSugestoesLocal([]);
  }
  function escolherLocal(l) {
    setLocal(l);
    setBuscaLocal('');
    setSugestoesLocal([]);
  }
  function abrirNoMapa() {
    const url = urlMapa(local);
    if (url) window.open(url, '_blank', 'noopener');
  }

  // Anexos (Evento). Guarda nome e tipo; o conteúdo fica como data URL (leve).
  function aoEscolherAnexos(e) {
    const arquivos = Array.from(e.target.files ?? []);
    arquivos.forEach((f) => {
      const leitor = new FileReader();
      leitor.onload = () => setAnexos((a) => [...a, { nome: f.name, tipo: f.type, dados: leitor.result }]);
      leitor.readAsDataURL(f);
    });
    e.target.value = '';
  }
  function removerAnexo(i) { setAnexos((a) => a.filter((_, idx) => idx !== i)); }

  // modo: 'este' (só a ocorrência/este item) | 'todos' (repetição inteira ou leva)
  async function excluirCom(modo) {
    setSalvando(true);
    try {
      if (ehRepetido && modo === 'este') {
        await excluirOcorrencia(evento.id, diaOcorrencia);
      } else if (temGrupo && modo === 'todos') {
        await deletarGrupo(evento.grupoId);
      } else {
        await deletarEvento(evento.id);
      }
      await onSalvo?.(evento.data);
      onFechar();
    } catch { setErro('Não deu para excluir.'); setSalvando(false); }
  }

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" onClick={onFechar} role="dialog" aria-modal="true" aria-label={editando ? 'Editar compromisso' : 'Novo compromisso'}>
      <div style={estilos.sheet} className="bottomSheet" onClick={(e) => e.stopPropagation()}>
        <div style={estilos.pegador} />

        {/* Cabeçalho: nome da tela + X para fechar. */}
        <div style={estilos.topo}>
          <span style={estilos.topoTitulo}>
            {editando ? 'Editar' : 'Novo'} {ehEvento ? 'evento' : 'compromisso'}
          </span>
          <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Título — campo em destaque. Sem autoFocus (não abre o teclado sozinho). */}
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={ehEvento ? 'Nome do evento' : 'Adicionar título'}
          style={estilos.inputTitulo}
        />

        {/* Destacar evento — aparece em destaque acima do calendário */}
        <button type="button" style={estilos.favLinha} onClick={alternarFavorito}>
          <span style={estilos.favIcone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={favorito ? cores.acento : 'none'} stroke={favorito ? cores.acento : cores.textoApagado} strokeWidth="1.6" strokeLinejoin="round"><path d="M12 2.5c.35 4.9 1.7 6.65 6.6 7-4.9.35-6.25 2.1-6.6 7-.35-4.9-1.7-6.65-6.6-7 4.9-.35 6.25-2.1 6.6-7z" /></svg>
          </span>
          <div style={estilos.linhaMeio}>
            <span style={estilos.linhaTitulo}>Destacar evento</span>
            <span style={estilos.linhaSub}>{favorito ? 'Aparece em destaque acima do calendário' : `Destaque acima do calendário (até ${MAX_FAVORITOS})`}</span>
          </div>
          <span style={{ ...estilos.toggle, ...(favorito ? estilos.toggleOn : null) }}>
            <span style={{ ...estilos.toggleBola, ...(favorito ? estilos.toggleBolaOn : null) }} />
          </span>
        </button>

        {/* Data e horário */}
        <div style={estilos.rotulo}>Data e horário</div>
        <div style={estilos.linhaDataHora}>
          <div style={estilos.pill}>
            <span style={estilos.pillIcone}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            </span>
            <div style={estilos.pillMeio}>
              <span style={estilos.pillRotulo}>Data</span>
              <span style={estilos.pillValor}>{formatarData(data)}</span>
            </div>
            <SeletorData valor={data} onMudar={setData} />
          </div>

          {!diaTodo && (
            <div style={{ ...estilos.pill, flexBasis: '100%' }}>
              <span style={estilos.pillIcone}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              </span>
              <span style={{ ...estilos.pillRotulo, flexShrink: 0 }}>Horário</span>
              <div style={estilos.horas}>
                <SeletorHora valor={inicio} onMudar={setInicio} />
                <span style={estilos.horaSep}>–</span>
                <SeletorHora valor={fim} onMudar={setFim} placeholder="fim" />
              </div>
            </div>
          )}

          <button style={estilos.pillDiaTodo} onClick={() => setDiaTodo((v) => !v)}>
            <span style={estilos.pillRotulo}>Dia todo</span>
            <span style={{ ...estilos.toggle, ...(diaTodo ? estilos.toggleOn : null) }}>
              <span style={{ ...estilos.toggleBola, ...(diaTodo ? estilos.toggleBolaOn : null) }} />
            </span>
          </button>
        </div>

        {/* Cor */}
        <div style={estilos.rotulo}>Cor</div>
        <div style={estilos.coresLinha}>
          <button type="button" style={{ ...estilos.corSwatch, ...estilos.corAuto, ...(cor === null ? estilos.corSwatchAtivo : null) }} onClick={() => setCor(null)} title="Usar a cor da etiqueta">Auto</button>
          {CORES_EVENTO.map((c) => (
            <button key={c} type="button" style={{ ...estilos.corSwatch, background: c, ...(cor === c ? estilos.corSwatchAtivo : null) }} onClick={() => setCor(c)} aria-label={`Cor ${c}`}>
              {cor === c && <span style={estilos.corCheck} aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>

        {/* Etiqueta */}
        <div style={estilos.rotulo}>Etiqueta (categoria)</div>
        <button style={estilos.seletor} onClick={() => setPainel(painel === 'etiqueta' ? null : 'etiqueta')}>
          {etiqueta ? (
            <>
              <span style={{ ...estilos.etiquetaIcone, background: etiqueta.cor }}><IconeCat id={etiqueta.icone} tamanho={18} cor="#fff" strokeWidth={2} /></span>
              <span style={estilos.seletorTexto}>{etiqueta.nome}</span>
            </>
          ) : (
            <>
              <span style={{ ...estilos.etiquetaIcone, background: cores.superficie2, border: `1px solid ${cores.borda}` }}><IconeCat id="livro" tamanho={18} cor={cores.textoApagado} /></span>
              <span style={{ ...estilos.seletorTexto, color: cores.textoApagado }}>Sem etiqueta</span>
            </>
          )}
          <span style={estilos.chevron} aria-hidden="true">⌄</span>
        </button>
        {painel === 'etiqueta' && (
          <div style={estilos.painel}>
            <button style={estilos.opcaoLista} onClick={() => { setCategoriaId(null); setPainel(null); }}>
              <span style={{ ...estilos.etiquetaIconePeq, background: cores.superficie2, border: `1px solid ${cores.borda}` }} />
              <span style={estilos.opcaoTexto}>Sem etiqueta</span>
            </button>
            {categorias.map((c) => (
              <button key={c.id} style={estilos.opcaoLista} onClick={() => { setCategoriaId(c.id); setPainel(null); }}>
                <span style={{ ...estilos.etiquetaIconePeq, background: c.cor }}><IconeCat id={c.icone} tamanho={15} cor="#fff" strokeWidth={2} /></span>
                <span style={estilos.opcaoTexto}>{c.nome}</span>
                {categoriaId === c.id && <span style={estilos.check} aria-hidden="true">✓</span>}
              </button>
            ))}
            <button style={estilos.novaEtiqueta} onClick={() => setCriandoEtiqueta(true)}>+ Nova etiqueta</button>
          </div>
        )}

        {/* Lembrete */}
        <button style={{ ...estilos.linhaSimples, marginTop: 14 }} onClick={() => setPainel(painel === 'lembrete' ? null : 'lembrete')}>
          <span style={estilos.linhaIcone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M10.5 21a1.8 1.8 0 0 0 3 0" /></svg>
          </span>
          <div style={estilos.linhaMeio}>
            <span style={estilos.linhaTitulo}>Lembrete</span>
            <span style={estilos.linhaSub}>{rotuloLembrete(lembrete)}</span>
          </div>
          <span style={estilos.chevron} aria-hidden="true">›</span>
        </button>
        {painel === 'lembrete' && (
          <div style={estilos.painel}>
            {LEMBRETES.map((l) => (
              <button key={l.id} style={estilos.opcaoLista} onClick={() => { setLembrete(l.id); setPainel(null); }}>
                <span style={estilos.opcaoTexto}>{l.rotulo}</span>
                {lembrete === l.id && <span style={estilos.check} aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Evento: funções extras escondidas em "Mais opções". */}
        {ehEvento && (
          <>
            <button style={{ ...estilos.linhaSimples, marginTop: 14 }} onClick={() => setMaisOpcoes((v) => !v)}>
              <span style={estilos.linhaIcone}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
              </span>
              <div style={estilos.linhaMeio}>
                <span style={estilos.linhaTitulo}>Mais opções</span>
                <span style={estilos.linhaSub}>Convidados, local e anexos</span>
              </div>
              <span style={{ ...estilos.chevron, transform: maisOpcoes ? 'rotate(90deg)' : 'none' }} aria-hidden="true">›</span>
            </button>

            {maisOpcoes && (
              <>
                {/* Participantes */}
                <div style={estilos.rotulo}>Convidados</div>
                <div style={estilos.emailLinha}>
                  <input
                    value={emailNovo}
                    onChange={(e) => setEmailNovo(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarEmail(); } }}
                    type="email"
                    inputMode="email"
                    placeholder="email@exemplo.com"
                    style={{ ...estilos.input, flex: 1 }}
                  />
                  <button type="button" style={estilos.addBtn} onClick={adicionarEmail} aria-label="Adicionar convidado">+</button>
                </div>
                {participantes.length > 0 && (
                  <div style={estilos.chipsConvidados}>
                    {participantes.map((e) => (
                      <span key={e} style={estilos.chipConvidado}>
                        {e}
                        <button type="button" style={estilos.chipRemover} onClick={() => removerEmail(e)} aria-label={`Remover ${e}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Local */}
                <div style={estilos.rotulo}>Local</div>
                {local ? (
                  <div style={estilos.localCard}>
                    <div style={estilos.localInfo}>
                      <span style={estilos.localNome}>📍 {local.nome}</span>
                      {local.endereco && <span style={estilos.localEndereco}>{local.endereco}</span>}
                      {local.cidade && <span style={estilos.localEndereco}>{local.cidade}</span>}
                    </div>
                    <div style={estilos.localAcoes}>
                      <button type="button" style={estilos.localMapa} onClick={abrirNoMapa}>🗺️ Abrir no mapa</button>
                      <button type="button" style={estilos.localTrocar} onClick={() => setLocal(null)}>Trocar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={estilos.emailLinha}>
                      <input
                        value={buscaLocal}
                        onChange={(e) => setBuscaLocal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); definirLocalTexto(); } }}
                        placeholder="Estabelecimento, endereço, shopping…"
                        style={{ ...estilos.input, flex: 1 }}
                      />
                      <button type="button" style={estilos.addBtn} onClick={definirLocalTexto} aria-label="Usar este local">+</button>
                    </div>
                    {buscandoLocal && <div style={estilos.dica}>Procurando…</div>}
                    {sugestoesLocal.length > 0 && (
                      <div style={estilos.sugestoes}>
                        {sugestoesLocal.map((l) => (
                          <button key={l.placeId ?? l.nome} type="button" style={estilos.sugestao} onClick={() => escolherLocal(l)}>
                            <span style={estilos.sugestaoNome}>📍 {l.nome}</span>
                            {l.endereco && <span style={estilos.sugestaoEndereco}>{l.endereco}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Anexos */}
                <div style={estilos.rotulo}>Anexos</div>
                <label style={estilos.anexoBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cores.acento} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49" /></svg>
                  Adicionar anexo
                  <input type="file" multiple onChange={aoEscolherAnexos} style={{ display: 'none' }} />
                </label>
                {anexos.length > 0 && (
                  <div style={estilos.anexosLista}>
                    {anexos.map((a, i) => (
                      <div key={i} style={estilos.anexoItem}>
                        <button type="button" style={estilos.anexoAbrir} onClick={() => abrirAnexo(a)} title="Abrir anexo">📎 {a.nome}</button>
                        <button type="button" style={estilos.chipRemover} onClick={() => removerAnexo(i)} aria-label={`Remover ${a.nome}`}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={estilos.dica}>Os anexos vão junto quando você tocar em “Compartilhar convite”. Toque num anexo para abri-lo.</div>
              </>
            )}
          </>
        )}

        {/* Notas */}
        <div style={estilos.rotulo}>Notas (opcional)</div>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ex.: Revisar capítulos 1 a 3" rows={3} style={estilos.textarea} />

        {/* Repetir */}
        <button style={{ ...estilos.linhaSimples, marginTop: 14 }} onClick={() => setPainel(painel === 'repetir' ? null : 'repetir')}>
          <span style={estilos.linhaIcone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          </span>
          <div style={estilos.linhaMeio}>
            <span style={estilos.linhaTitulo}>Repetir</span>
            <span style={estilos.linhaSub}>{rotuloRepeticao(repetir)}{repetir === 'personalizado' ? ` · a cada ${repetirCada} ${repetirUnidade}` : ''}</span>
          </div>
          <span style={estilos.chevron} aria-hidden="true">›</span>
        </button>
        {painel === 'repetir' && (
          <div style={estilos.painel}>
            {REPETICOES.map((r) => (
              <button key={r.id} style={estilos.opcaoLista} onClick={() => { setRepetir(r.id); if (r.id !== 'personalizado') setPainel(null); }}>
                <span style={estilos.opcaoTexto}>{r.rotulo}</span>
                {repetir === r.id && <span style={estilos.check} aria-hidden="true">✓</span>}
              </button>
            ))}
            {repetir === 'personalizado' && (
              <div style={estilos.personalizado}>
                <span style={estilos.personalizadoRotulo}>A cada</span>
                <input type="number" min="1" value={repetirCada} onChange={(e) => setRepetirCada(e.target.value)} style={estilos.personalizadoNum} />
                <select value={repetirUnidade} onChange={(e) => setRepetirUnidade(e.target.value)} style={estilos.personalizadoSelect}>
                  {UNIDADES.map((u) => <option key={u.id} value={u.id}>{u.rotulo}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {erro && <div style={estilos.erro}>{erro}</div>}

        {/* Salvar — no rodapé. */}
        <button style={estilos.salvar} onClick={salvar} disabled={salvando}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>

        {ehEvento && (
          <>
            <button type="button" style={estilos.compartilhar} onClick={compartilhar}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
              Compartilhar convite
            </button>
            <div style={estilos.dica}>Gera um convite (.ics) e abre a tela de compartilhar (WhatsApp, e-mail…). Quem receber toca no arquivo e ele entra na agenda.</div>
          </>
        )}

        {!confirmandoExcluir && !duplicando && (
          <button style={estilos.duplicar} onClick={() => { setDuplicando(true); setDiasDuplicar([]); setErro(''); }} disabled={salvando}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
            {editando ? `Duplicar ${ehEvento ? 'evento' : 'compromisso'}` : 'Criar em vários dias'}
          </button>
        )}

        {duplicando && (
          <div style={estilos.dupPainel}>
            <div style={estilos.dupTitulo}>{editando ? 'Duplicar para quais dias?' : 'Criar também em quais dias?'}</div>
            <div style={estilos.dupSub}>{editando ? 'Toque nos dias em que quer repetir. Você pode escolher vários.' : 'Será criado no dia escolhido acima e também nos dias que você marcar aqui.'}</div>
            <div style={estilos.dupGrade}>
              {proximosDias(data, 42).map((d) => {
                const sel = diasDuplicar.includes(d.iso);
                return (
                  <button
                    key={d.iso}
                    type="button"
                    style={{ ...estilos.dupDia, ...(sel ? estilos.dupDiaSel : null) }}
                    onClick={() => alternarDiaDuplicar(d.iso)}
                  >
                    <span style={{ ...estilos.dupDow, ...(sel ? { color: 'rgba(255,255,255,0.85)' } : null) }}>{d.dow}</span>
                    <span style={{ ...estilos.dupNum, ...(sel ? { color: cores.acentoTexto } : null) }}>{d.dia}</span>
                    <span style={{ ...estilos.dupMes, ...(sel ? { color: 'rgba(255,255,255,0.85)' } : null) }}>{d.mes}</span>
                  </button>
                );
              })}
            </div>
            <div style={estilos.dupAcoes}>
              <button type="button" style={estilos.cancelarPeq} onClick={() => { setDuplicando(false); setDiasDuplicar([]); }}>Cancelar</button>
              <button type="button" style={estilos.dupConfirma} onClick={confirmarDuplicar} disabled={salvando || diasDuplicar.length === 0}>
                {editando
                  ? `Duplicar${diasDuplicar.length ? ` (${diasDuplicar.length})` : ''}`
                  : `Criar${diasDuplicar.length ? ` (${diasDuplicar.length + 1})` : ''}`}
              </button>
            </div>
          </div>
        )}

        {editando && !confirmandoExcluir && !duplicando && (
          <button style={estilos.excluir} onClick={() => setConfirmandoExcluir(true)} disabled={salvando}>Excluir {ehEvento ? 'evento' : 'compromisso'}</button>
        )}
        {confirmandoExcluir && (
          <div style={estilos.confirma}>
            {ehRepetido ? (
              <>
                <span style={estilos.confirmaTexto}>Este compromisso se repete. O que você quer excluir?</span>
                <div style={estilos.confirmaCol}>
                  <button style={estilos.excluirConfirma} onClick={() => excluirCom('este')} disabled={salvando}>Excluir só este dia</button>
                  <button style={estilos.excluirConfirma} onClick={() => excluirCom('todos')} disabled={salvando}>Excluir todos os dias</button>
                  <button style={estilos.cancelarPeq} onClick={() => setConfirmandoExcluir(false)}>Cancelar</button>
                </div>
              </>
            ) : temGrupo ? (
              <>
                <span style={estilos.confirmaTexto}>Este foi criado em vários dias. O que você quer excluir?</span>
                <div style={estilos.confirmaCol}>
                  <button style={estilos.excluirConfirma} onClick={() => excluirCom('este')} disabled={salvando}>Excluir só este dia</button>
                  <button style={estilos.excluirConfirma} onClick={() => excluirCom('todos')} disabled={salvando}>Excluir todos os criados juntos</button>
                  <button style={estilos.cancelarPeq} onClick={() => setConfirmandoExcluir(false)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <span style={estilos.confirmaTexto}>Excluir este compromisso?</span>
                <div style={estilos.confirmaAcoes}>
                  <button style={estilos.cancelarPeq} onClick={() => setConfirmandoExcluir(false)}>Não</button>
                  <button style={estilos.excluirConfirma} onClick={() => excluirCom('todos')} disabled={salvando}>Sim, excluir</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {criandoEtiqueta && (
        <NovaCategoria
          onSalvo={async (nova) => { await carregarCategorias(); if (nova) setCategoriaId(nova.id); }}
          onFechar={() => setCriandoEtiqueta(false)}
        />
      )}
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
  inputTitulo: { width: '100%', boxSizing: 'border-box', padding: '4px 2px 12px', border: 'none', borderBottom: `2px solid ${cores.borda}`, background: 'transparent', color: cores.texto, fontSize: 24, fontWeight: 800, letterSpacing: -0.5, outline: 'none', fontFamily: 'inherit', marginBottom: 4 },
  cabecalho: { flex: 1, textAlign: 'center', minWidth: 0 },
  titulo: { fontSize: 19, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  subtitulo: { fontSize: 12.5, color: cores.textoSuave, marginTop: 3, fontWeight: 500 },
  salvar: { width: '100%', marginTop: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '14px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 15, fontWeight: 800, cursor: 'pointer' },

  rotulo: { fontSize: 12.5, fontWeight: 700, color: cores.texto, margin: '18px 0 8px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, color: cores.texto, fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, color: cores.texto, fontSize: 14.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical' },

  linhaDataHora: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  pill: { flex: '1 1 45%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2 },
  pillIcone: { flexShrink: 0, display: 'flex' },
  pillMeio: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pillRotulo: { fontSize: 11, color: cores.textoApagado, fontWeight: 600 },
  pillValor: { fontSize: 14, fontWeight: 700, color: cores.texto, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  horas: { flex: 1, display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
  horaSep: { color: cores.textoApagado, fontWeight: 700 },
  pillDiaTodo: { flex: '1 1 30%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  toggle: { width: 42, height: 24, borderRadius: 999, background: cores.bordaForte, position: 'relative', transition: 'background 0.15s ease', flexShrink: 0 },
  toggleOn: { background: cores.acento },
  toggleBola: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' },
  toggleBolaOn: { transform: 'translateX(18px)' },

  seletor: { width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  seletorTexto: { flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 700, color: cores.texto },
  etiquetaIcone: { flexShrink: 0, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' },
  etiquetaIconePeq: { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' },
  chevron: { color: cores.textoApagado, fontSize: 18, flexShrink: 0 },

  painel: { marginTop: 8, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, overflow: 'hidden' },
  opcaoLista: { width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', border: 'none', borderBottom: `1px solid ${cores.borda}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' },
  opcaoTexto: { flex: 1, fontSize: 14.5, fontWeight: 600, color: cores.texto },
  check: { color: cores.acento, fontWeight: 800, fontSize: 15 },
  novaEtiqueta: { width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', color: cores.acento, fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' },

  favLinha: { width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginTop: 12, borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  favLinhaOn: { borderColor: '#f5c469', background: 'var(--fav-bg, #fff9ec)' },
  favIcone: { flexShrink: 0, display: 'flex' },

  personalizado: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderTop: `1px solid ${cores.borda}` },
  personalizadoRotulo: { fontSize: 14, fontWeight: 600, color: cores.textoSuave },
  personalizadoNum: { width: 58, boxSizing: 'border-box', padding: '8px 10px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2, color: cores.texto, fontSize: 14.5, fontFamily: 'inherit', outline: 'none' },
  personalizadoSelect: { flex: 1, padding: '8px 10px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2, color: cores.texto, fontSize: 14.5, fontFamily: 'inherit', cursor: 'pointer' },

  coresLinha: { display: 'flex', flexWrap: 'wrap', gap: 9 },
  corSwatch: { width: 34, height: 34, borderRadius: '50%', border: '2px solid transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  corSwatchAtivo: { boxShadow: `0 0 0 2px ${cores.superficie}, 0 0 0 4px ${cores.acento}` },
  corAuto: { background: cores.superficie2, borderColor: cores.borda, color: cores.textoSuave, fontSize: 11, fontWeight: 700 },
  corCheck: { color: '#fff', fontSize: 15, fontWeight: 800 },

  linhaSimples: { width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: raio, borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, background: cores.superficie2, cursor: 'pointer' },
  linhaIcone: { flexShrink: 0, display: 'flex' },
  linhaMeio: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' },
  linhaTitulo: { fontSize: 14.5, fontWeight: 700, color: cores.texto },
  linhaSub: { fontSize: 12.5, color: cores.textoSuave, fontWeight: 500 },

  erro: { marginTop: 14, padding: '10px 12px', borderRadius: raio, background: cores.acentoBg, color: cores.perigo, fontSize: 13, fontWeight: 600, textAlign: 'center' },
  duplicar: { width: '100%', marginTop: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  excluir: { width: '100%', marginTop: 10, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.perigo, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  confirma: { marginTop: 16 },
  confirmaTexto: { display: 'block', fontSize: 14, fontWeight: 600, color: cores.texto, textAlign: 'center', marginBottom: 10 },
  confirmaAcoes: { display: 'flex', gap: 9 },
  confirmaCol: { display: 'flex', flexDirection: 'column', gap: 8 },
  cancelarPeq: { flex: 1, padding: '11px', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  excluirConfirma: { flex: 1, padding: '11px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },

  // Evento — convidados, local, anexos.
  emailLinha: { display: 'flex', gap: 8, alignItems: 'stretch' },
  addBtn: { flexShrink: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 24, fontWeight: 700, cursor: 'pointer', lineHeight: 1 },
  chipsConvidados: { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  chipConvidado: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 11px', borderRadius: 999, background: cores.superficie2, border: `1px solid ${cores.borda}`, fontSize: 13, fontWeight: 600, color: cores.texto },
  chipRemover: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', border: 'none', background: cores.bordaForte, color: cores.superficie, fontSize: 14, lineHeight: 1, cursor: 'pointer', padding: 0 },
  dica: { fontSize: 12, color: cores.textoSuave, marginTop: 7, fontWeight: 500 },
  compartilhar: { width: '100%', marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', border: `1px solid ${cores.acentoClaro}`, borderRadius: raio, background: cores.acentoBg, color: cores.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  sugestoes: { marginTop: 8, border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, overflow: 'hidden' },
  sugestao: { width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', padding: '10px 13px', border: 'none', borderBottom: `1px solid ${cores.borda}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' },
  sugestaoNome: { fontSize: 14, fontWeight: 700, color: cores.texto },
  sugestaoEndereco: { fontSize: 12.5, color: cores.textoSuave, fontWeight: 500 },
  localCard: { display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2 },
  localInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  localNome: { fontSize: 15, fontWeight: 700, color: cores.texto },
  localEndereco: { fontSize: 13, color: cores.textoSuave, fontWeight: 500 },
  localAcoes: { display: 'flex', gap: 8 },
  localMapa: { flex: 1, padding: '9px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  localTrocar: { padding: '9px 14px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  anexoBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', border: `1px dashed ${cores.bordaForte}`, borderRadius: raio, background: cores.superficie2, color: cores.acento, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  anexosLista: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 9 },
  anexoItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: raio, background: cores.superficie2, border: `1px solid ${cores.borda}` },
  anexoNome: { fontSize: 13, fontWeight: 600, color: cores.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  anexoAbrir: { flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: cores.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Duplicar em vários dias.
  dupPainel: { marginTop: 16, padding: '14px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie2 },
  dupTitulo: { fontSize: 15, fontWeight: 800, color: cores.texto },
  dupSub: { fontSize: 12.5, color: cores.textoSuave, marginTop: 3, marginBottom: 12, fontWeight: 500 },
  dupGrade: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 2 },
  dupDia: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '6px 0', border: `1px solid ${cores.borda}`, borderRadius: 10, background: cores.superficie, cursor: 'pointer' },
  dupDiaSel: { background: cores.acento, borderColor: cores.acento },
  dupDow: { fontSize: 9, fontWeight: 700, color: cores.textoApagado, textTransform: 'uppercase' },
  dupNum: { fontSize: 15, fontWeight: 800, color: cores.texto },
  dupMes: { fontSize: 8.5, fontWeight: 600, color: cores.textoApagado },
  dupAcoes: { display: 'flex', gap: 9, marginTop: 14 },
  dupConfirma: { flex: 2, padding: '11px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' },
};

export default NovoEvento;
