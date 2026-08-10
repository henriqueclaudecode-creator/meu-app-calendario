// Onboarding — a primeira abertura. Em vez de jogar a pessoa numa agenda vazia,
// convida a "começar a construir a história": nascimento, alguns momentos que já
// aconteceram e, na hora, a linha do tempo montada como recompensa.
//
// Tudo é pulável. Os momentos criados aqui usam o db/momentos (Fase 1); o
// nascimento fica no perfil (lib/perfil) e alimentará o lembrete de aniversário.

import { useEffect, useState } from 'react';
import { salvarPerfil, marcarOnboardingFeito } from '../lib/perfil';
import { criarMomento, listarMomentos } from '../db/momentos';
import { agendarAniversario } from '../lib/notificacoes';
import { CATEGORIAS_MOMENTO } from '../lib/momentoCategorias';
import { usePremium } from '../lib/PremiumContext';
import SeletorData from '../components/SeletorData';
import { IconeCat } from '../components/IconeCat';
import { IconeMontanha } from '../components/IconeMontanha';
import { hojeISO } from '../lib/datas';
import { cores, sombra, raio, raioGrande } from '../lib/tema';

const COR_MOMENTO = '#bf9540';

// Sugestões de marcos por categoria (o usuário pode editar o título ao adicionar).
const SUGESTOES = {
  familia: ['Casamento', 'Nascimento de filho', 'Nascimento de irmão'],
  estudos: ['Início da escola', 'Formatura', 'Conclusão de curso'],
  carreira: ['Primeiro emprego', 'Novo emprego', 'Promoção', 'Aposentadoria'],
  conquistas: ['Primeiro carro', 'Primeira casa', 'Grande conquista'],
  viagens: ['Primeira viagem internacional', 'Mudança de cidade', 'Mudança de país', 'Lugar especial'],
  outro: [],
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const anoDe = (iso) => Number(iso.slice(0, 4));
function dataCurta(iso) { const [a, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${a}`; }

function Onboarding({ onConcluir }) {
  const { abrirPaywall } = usePremium() ?? {};
  const [passo, setPasso] = useState(0);
  const [nascimento, setNascimento] = useState(null);
  const [cidade, setCidade] = useState('');
  const [momentos, setMomentos] = useState([]); // já salvos no db
  const [rascunho, setRascunho] = useState(null); // { categoria, titulo, data } sendo adicionado

  async function recarregarMomentos() {
    try { setMomentos(await listarMomentos()); } catch { /* vazio */ }
  }
  useEffect(() => { recarregarMomentos(); }, []);

  function finalizar() {
    // Persiste o nascimento como um momento também, para viver na Minha História.
    if (nascimento) {
      criarMomento({ titulo: 'Meu nascimento', data: nascimento, categoria: 'familia', descricao: cidade ? `Nasci em ${cidade}.` : '' });
    }
    salvarPerfil({ nascimento: nascimento ?? null, cidade: cidade.trim() });
    if (nascimento) agendarAniversario(nascimento);
    marcarOnboardingFeito();
    onConcluir?.();
  }

  function pular() {
    salvarPerfil({ nascimento: nascimento ?? null, cidade: cidade.trim() });
    marcarOnboardingFeito();
    onConcluir?.();
  }

  async function adicionarRascunho() {
    const t = rascunho.titulo.trim();
    if (!t) return;
    await criarMomento({ titulo: t, data: rascunho.data, categoria: rascunho.categoria, descricao: '' });
    setRascunho(null);
    await recarregarMomentos();
  }

  // ---- Passo 0: boas-vindas ----
  if (passo === 0) {
    return (
      <Tela>
        <div style={estilos.centro}>
          <span style={estilos.montanhaGrande}><IconeMontanha tamanho={72} cor={COR_MOMENTO} /></span>
          <h1 style={estilos.tituloGrande}>Bem-vindo</h1>
          <p style={estilos.paragrafo}>
            Sua vida acontece todos os dias. Aqui você organiza o que ainda vai acontecer
            e guarda aquilo que já aconteceu.
          </p>
          <p style={{ ...estilos.paragrafo, fontWeight: 700, color: cores.texto }}>
            Vamos começar a construir sua história?
          </p>
        </div>
        <Rodape>
          <BotaoPrincipal onClick={() => setPasso(1)}>Começar minha história</BotaoPrincipal>
          <BotaoPular onClick={pular}>Pular por agora</BotaoPular>
        </Rodape>
      </Tela>
    );
  }

  // ---- Passo 1: nascimento ----
  if (passo === 1) {
    return (
      <Tela>
        <Progresso passo={1} />
        <div style={estilos.conteudo}>
          <h2 style={estilos.titulo}>Vamos começar pelo começo</h2>
          <p style={estilos.subtitulo}>Isso cria o primeiro ponto da sua linha da vida.</p>

          <div style={estilos.rotulo}>Quando você nasceu?</div>
          <div style={estilos.linhaData}>
            <span style={estilos.linhaDataValor}>{nascimento ? dataCurta(nascimento) : 'Escolher data'}</span>
            <SeletorData valor={nascimento ?? '2000-01-01'} onMudar={setNascimento} max={hojeISO()} />
          </div>

          <div style={estilos.rotulo}>Onde você nasceu? <span style={estilos.opcional}>(opcional)</span></div>
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" style={estilos.input} />
        </div>
        <Rodape>
          <BotaoPrincipal onClick={() => setPasso(2)}>Continuar</BotaoPrincipal>
          <BotaoPular onClick={() => setPasso(2)}>Fazer isso depois</BotaoPular>
        </Rodape>
      </Tela>
    );
  }

  // ---- Passo 2: momentos anteriores ----
  if (passo === 2) {
    return (
      <Tela>
        <Progresso passo={2} />
        <div style={estilos.conteudo}>
          <h2 style={estilos.titulo}>Momentos que já aconteceram</h2>
          <p style={estilos.subtitulo}>Você não precisa colocar tudo. Escolha só o que faz parte da sua história.</p>

          {momentos.length > 0 && (
            <div style={estilos.adicionados}>
              {momentos.map((m) => {
                const cat = CATEGORIAS_MOMENTO.find((c) => c.id === m.categoria) ?? CATEGORIAS_MOMENTO[5];
                return (
                  <div key={m.id} style={estilos.adicionadoItem}>
                    <span style={{ ...estilos.adicionadoIcone, background: cat.cor }}><IconeCat id={cat.icone} tamanho={15} cor="#fff" strokeWidth={2} /></span>
                    <span style={estilos.adicionadoTitulo}>{m.titulo}</span>
                    <span style={estilos.adicionadoAno}>{anoDe(m.data)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {rascunho ? (
            <div style={estilos.rascunho}>
              <input
                value={rascunho.titulo}
                onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
                placeholder="O que aconteceu?"
                style={estilos.input}
              />
              <div style={estilos.linhaData}>
                <span style={estilos.linhaDataValor}>{dataCurta(rascunho.data)}</span>
                <SeletorData valor={rascunho.data} onMudar={(d) => setRascunho({ ...rascunho, data: d })} max={hojeISO()} />
              </div>
              <div style={estilos.rascunhoAcoes}>
                <button style={estilos.cancelar} onClick={() => setRascunho(null)}>Cancelar</button>
                <button style={estilos.adicionar} onClick={adicionarRascunho}>Adicionar</button>
              </div>
            </div>
          ) : (
            <div style={estilos.categorias}>
              {CATEGORIAS_MOMENTO.map((c) => (
                <div key={c.id} style={estilos.catBloco}>
                  <div style={estilos.catCabecalho}>
                    <span style={{ ...estilos.catIcone, background: c.cor }}><IconeCat id={c.icone} tamanho={16} cor="#fff" strokeWidth={2} /></span>
                    {c.nome}
                  </div>
                  <div style={estilos.sugestoes}>
                    {(SUGESTOES[c.id].length ? SUGESTOES[c.id] : ['Adicionar']).map((s) => (
                      <button
                        key={s}
                        style={estilos.sugestao}
                        onClick={() => setRascunho({ categoria: c.id, titulo: s === 'Adicionar' ? '' : s, data: hojeISO() })}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Rodape>
          <BotaoPrincipal onClick={() => setPasso(3)}>
            {momentos.length ? 'Ver minha história' : 'Continuar'}
          </BotaoPrincipal>
          {momentos.length === 0 && <BotaoPular onClick={() => setPasso(3)}>Fazer isso depois</BotaoPular>}
        </Rodape>
      </Tela>
    );
  }

  // ---- Passo 3: recompensa (linha do tempo) + convite Premium ----
  const pontos = [];
  if (nascimento) pontos.push({ chave: 'nasc', data: nascimento, titulo: 'Seu nascimento', cor: COR_MOMENTO });
  for (const m of momentos) {
    const cat = CATEGORIAS_MOMENTO.find((c) => c.id === m.categoria);
    pontos.push({ chave: m.id, data: m.data, titulo: m.titulo, cor: cat?.cor ?? cores.textoApagado });
  }
  pontos.push({ chave: 'hoje', data: hojeISO(), titulo: 'Hoje', cor: cores.acento, hoje: true });
  pontos.sort((a, b) => a.data.localeCompare(b.data));

  const temHistoria = pontos.length > 1;

  return (
    <Tela>
      <div style={estilos.conteudo}>
        <div style={estilos.recompensaTopo}>
          <IconeMontanha tamanho={30} cor={COR_MOMENTO} />
          <h2 style={estilos.titulo}>{temHistoria ? 'Sua história começou' : 'Tudo pronto'}</h2>
        </div>
        <p style={estilos.subtitulo}>
          {temHistoria
            ? 'Você pode continuar adicionando momentos à medida que sua vida acontece.'
            : 'Comece a registrar momentos importantes quando quiser.'}
        </p>

        {temHistoria && (
          <div style={estilos.timeline}>
            {pontos.map((p) => (
              <div key={p.chave} style={estilos.tlItem}>
                <div style={estilos.tlAno}>{anoDe(p.data)}</div>
                <div style={estilos.tlTrilho}>
                  <span style={{ ...estilos.tlPonto, background: p.cor, ...(p.hoje ? estilos.tlPontoHoje : null) }} />
                </div>
                <div style={{ ...estilos.tlTitulo, ...(p.hoje ? { color: cores.acento, fontWeight: 800 } : null) }}>{p.titulo}</div>
              </div>
            ))}
          </div>
        )}

        <div style={estilos.convite}>
          <span style={estilos.conviteDiamante}><IconeMontanha tamanho={20} cor={COR_MOMENTO} /></span>
          <div style={estilos.conviteTexto}>
            <div style={estilos.conviteTitulo}>Continue com o Premium</div>
            <div style={estilos.conviteSub}>Sua linha do tempo completa e o Mapa da Vida — 7 dias grátis.</div>
          </div>
          <button style={estilos.conviteBtn} onClick={() => abrirPaywall?.()}>Ver</button>
        </div>
      </div>
      <Rodape>
        <BotaoPrincipal onClick={finalizar}>Entrar no app</BotaoPrincipal>
      </Rodape>
    </Tela>
  );
}

// ---- Peças reutilizáveis ----
function Tela({ children }) {
  return <div style={estilos.tela}><div style={estilos.coluna}>{children}</div></div>;
}
function Rodape({ children }) {
  return <div style={estilos.rodape}>{children}</div>;
}
function BotaoPrincipal({ children, onClick }) {
  return <button style={estilos.botaoPrincipal} onClick={onClick}>{children}</button>;
}
function BotaoPular({ children, onClick }) {
  return <button style={estilos.botaoPular} onClick={onClick}>{children}</button>;
}
function Progresso({ passo }) {
  return (
    <div style={estilos.progresso}>
      {[1, 2, 3].map((n) => (
        <span key={n} style={{ ...estilos.progressoPonto, ...(n <= passo ? estilos.progressoAtivo : null) }} />
      ))}
    </div>
  );
}

const estilos = {
  tela: { position: 'fixed', inset: 0, zIndex: 500, background: cores.bg, display: 'flex', justifyContent: 'center', overflowY: 'auto' },
  coluna: { width: '100%', maxWidth: 460, boxSizing: 'border-box', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 22px calc(24px + env(safe-area-inset-bottom))' },

  progresso: { display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 },
  progressoPonto: { width: 24, height: 5, borderRadius: 999, background: cores.borda },
  progressoAtivo: { background: COR_MOMENTO },

  centro: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  montanhaGrande: { marginBottom: 20 },
  tituloGrande: { fontSize: 32, fontWeight: 800, letterSpacing: -0.8, color: cores.texto, margin: '0 0 14px' },
  paragrafo: { fontSize: 16, color: cores.textoSuave, lineHeight: 1.55, margin: '0 0 14px', maxWidth: 340 },

  conteudo: { flex: 1 },
  titulo: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: cores.texto, margin: 0 },
  subtitulo: { fontSize: 14.5, color: cores.textoSuave, lineHeight: 1.5, margin: '8px 0 22px', fontWeight: 500 },

  rotulo: { fontSize: 13, fontWeight: 700, color: cores.texto, margin: '18px 0 8px' },
  opcional: { color: cores.textoApagado, fontWeight: 500 },
  input: { width: '100%', boxSizing: 'border-box', padding: '14px 15px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.texto, fontSize: 15.5, outline: 'none', fontFamily: 'inherit' },
  linhaData: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 15px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie },
  linhaDataValor: { fontSize: 15.5, fontWeight: 700, color: cores.texto },

  categorias: { display: 'flex', flexDirection: 'column', gap: 16 },
  catBloco: {},
  catCabecalho: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: cores.texto, marginBottom: 9 },
  catIcone: { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sugestoes: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  sugestao: { padding: '8px 13px', borderRadius: 999, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.textoSuave, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  adicionados: { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18, padding: 12, borderRadius: raio, background: cores.superficie2, border: `1px solid ${cores.borda}` },
  adicionadoItem: { display: 'flex', alignItems: 'center', gap: 10 },
  adicionadoIcone: { flexShrink: 0, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adicionadoTitulo: { flex: 1, fontSize: 14, fontWeight: 700, color: cores.texto, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  adicionadoAno: { fontSize: 13, fontWeight: 800, color: cores.textoApagado },

  rascunho: { display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: raioGrande, background: cores.superficie, border: `1.5px solid ${COR_MOMENTO}`, boxShadow: sombra },
  rascunhoAcoes: { display: 'flex', gap: 9 },
  cancelar: { flex: 1, padding: '12px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.textoSuave, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  adicionar: { flex: 2, padding: '12px', borderRadius: raio, border: 'none', background: COR_MOMENTO, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' },

  recompensaTopo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  timeline: { margin: '6px 0 22px', padding: '4px 0' },
  tlItem: { display: 'flex', alignItems: 'center', gap: 14, minHeight: 46 },
  tlAno: { width: 46, flexShrink: 0, textAlign: 'right', fontSize: 14, fontWeight: 800, color: cores.textoApagado },
  tlTrilho: { position: 'relative', width: 2, alignSelf: 'stretch', background: cores.borda, display: 'flex', justifyContent: 'center' },
  tlPonto: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, borderRadius: '50%', border: `2px solid ${cores.bg}`, boxSizing: 'content-box' },
  tlPontoHoje: { boxShadow: `0 0 0 3px ${cores.acentoBg}` },
  tlTitulo: { flex: 1, fontSize: 15, fontWeight: 700, color: cores.texto, padding: '10px 0' },

  convite: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: raioGrande, background: cores.superficie, border: `1px solid ${cores.borda}`, boxShadow: sombra },
  conviteDiamante: { flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: cores.acentoBg },
  conviteTexto: { flex: 1, minWidth: 0 },
  conviteTitulo: { fontSize: 15, fontWeight: 800, color: cores.texto },
  conviteSub: { fontSize: 12.5, color: cores.textoSuave, marginTop: 2, fontWeight: 500, lineHeight: 1.4 },
  conviteBtn: { flexShrink: 0, padding: '10px 18px', borderRadius: 999, border: 'none', background: cores.acento, color: cores.acentoTexto, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' },

  rodape: { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20 },
  botaoPrincipal: { width: '100%', padding: '15px', borderRadius: raio, border: 'none', background: cores.acento, color: cores.acentoTexto, fontSize: 15.5, fontWeight: 800, cursor: 'pointer' },
  botaoPular: { width: '100%', padding: '11px', border: 'none', background: 'transparent', color: cores.textoApagado, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
};

export default Onboarding;
