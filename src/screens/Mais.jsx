// Aba Mais — ajustes e ações gerais. Por enquanto, o essencial do modo local:
// exportar/importar os dados e limpar tudo. Espaço para crescer (perfil, tema,
// notificações, sincronização na nuvem...).

import { useEffect, useState } from 'react';
import { lerLocal, salvarLocal } from '../lib/preferencias';
import { lerTema, salvarTema } from '../lib/aparencia';
import { UFS, CAPITAIS } from '../lib/localidades';
import { observarAuth, entrarComGoogle, sair, deletarConta } from '../lib/auth';
import { usePremium } from '../lib/PremiumContext';
import { assinar, cancelarAssinatura } from '../lib/premium';
import { permissaoConcedida, pedirPermissaoDetalhado, sincronizarTodos } from '../lib/notificacoes';
import { listarEventos } from '../db/eventos';
import PainelPro from '../components/PainelPro';
import { IconeOrbi } from '../components/IconeOrbi';
import { IconePro } from '../components/IconePro';
import { cores, sombra, sombraSuave, sombraForte, raio, raioGrande, raioPequeno } from '../lib/tema';

// Cada tema mostra um preview real das suas cores (fundo · superfície · acento)
// em vez de um emoji — leitura instantânea e visual mais sofisticado.
const TEMAS = [
  { id: 'light', nome: 'Padrão', desc: 'Tema claro', bg: '#f6f9fd', superficie: '#ffffff', acento: '#2563eb' },
  { id: 'dark', nome: 'Escuro', desc: 'Tema escuro', bg: '#0d1926', superficie: '#1e2c40', acento: '#3b82f6' },
  { id: 'blossom', nome: 'Corporativo', desc: 'Branco e azul marinho', bg: '#f4f6f9', superficie: '#eef2f7', acento: '#1f4e79' },
  { id: 'black', nome: 'Black', desc: 'Preto absoluto', bg: '#000000', superficie: '#1a1a1a', acento: '#d0d0d0' },
  { id: 'natureza', nome: 'Natureza', desc: 'Verde floresta', bg: '#f6f4ee', superficie: '#e8ede3', acento: '#2f6b3d' },
  { id: 'musgo', nome: 'Musgo', desc: 'Verde musgo', bg: '#f4f3ee', superficie: '#e8ecdd', acento: '#5f7238' },
  { id: 'oceano', nome: 'Oceano', desc: 'Azul vintage', bg: '#eff3f4', superficie: '#e0ebee', acento: '#488399' },
  { id: 'rose', nome: 'Blossom', desc: 'Coral suave', bg: '#fbf2f1', superficie: '#f7e3e3', acento: '#d97b7b' },
  { id: 'areia', nome: 'Areia', desc: 'Bege dourado', bg: '#f7f2e9', superficie: '#f0e7d5', acento: '#b79b6f' },
];

function Mais() {
  const [aviso, setAviso] = useState('');
  const [confirmandoDelete, setConfirmandoDelete] = useState(false);
  const [tema, setTema] = useState(lerTema());
  const [usuario, setUsuario] = useState(null);
  const { premium, estado, plano, abrirPaywall } = usePremium() ?? {};

  const [notif, setNotif] = useState(null); // null = checando | true | false

  useEffect(() => observarAuth(setUsuario), []);
  useEffect(() => { permissaoConcedida().then(setNotif); }, []);
  // Some sozinho depois de alguns segundos (mensagens mais longas ficam mais tempo).
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), aviso.length > 60 ? 8000 : 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  async function ativarNotificacoes() {
    const { ok, motivo } = await pedirPermissaoDetalhado();
    setNotif(ok);
    if (ok) {
      await sincronizarTodos(await listarEventos());
      setAviso('Notificações ativadas! Seus lembretes vão avisar na hora certa.');
    } else {
      setAviso(`Não foi possível ativar (${motivo}). Ative as notificações do Orbi nos ajustes do aparelho.`);
    }
  }

  function trocarTema(novo) {
    // Fora do Premium, só o tema Padrão pode ser aplicado.
    if (novo !== 'light' && !premium) { abrirPaywall?.(); return; }
    setTema(novo);
    salvarTema(novo);
  }

  async function fazerLogin() {
    try {
      await entrarComGoogle();
      setAviso('Login realizado! Seus dados serão sincronizados na nuvem.');
    } catch (e) {
      setAviso(`Não deu para entrar: ${e?.message || e?.code || String(e)}`);
    }
  }

  async function fazerLogout() {
    await sair();
    setAviso('Você saiu da sua conta.');
  }

  async function confirmarDelecao() {
    await deletarConta();
    setConfirmandoDelete(false);
    setAviso('Conta deletada.');
  }

  const localSalvo = lerLocal();
  const [uf, setUf] = useState(localSalvo.uf ?? '');
  const [incluirCapital, setIncluirCapital] = useState(!!localSalvo.municipio);
  const capital = uf ? CAPITAIS[uf] : null;

  function salvarLocalidade() {
    const usarCapital = incluirCapital && capital;
    salvarLocal({
      uf: uf || undefined,
      municipio: usarCapital ? capital.ibge : undefined,
      municipioNome: usarCapital ? capital.nome : undefined,
    });
    setAviso(uf ? 'Localidade salva! Abra o Calendário para ver os feriados.' : 'Voltou a mostrar só os feriados nacionais.');
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.cabecalhoMais}>
        <h1 style={estilos.tituloMais}>Configurações</h1>
      </div>

      {/* Conta — login com Google (preparado para o Firebase) */}
      <div style={estilos.cartao}>
        <div style={estilos.grupoTitulo}>Conta</div>
        {usuario ? (
          <div style={estilos.contaBox}>
            <span style={estilos.contaAvatar}>{(usuario.nome ?? '?').charAt(0).toUpperCase()}</span>
            <div style={estilos.contaInfo}>
              <div style={estilos.contaNome}>{usuario.nome}</div>
              <div style={estilos.contaEmail}>{usuario.email}</div>
            </div>
          </div>
        ) : (
          <>
            <p style={estilos.info}>Entre com sua conta Google para salvar seus eventos e objetivos na nuvem e acessá-los de qualquer aparelho.</p>
            <button style={estilos.googleBtn} onClick={fazerLogin}>
              <span style={estilos.googleIcone} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
                  <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
                  <path fill="#FBBC05" d="M11.6 28.1c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z" />
                  <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7C13.4 14.7 18.2 10.8 24 10.8z" />
                </svg>
              </span>
              Entrar com Google
            </button>
          </>
        )}
      </div>

      {/* Seja Pro — vitrine do Orbi Pro / status */}
      {estado === 'assinante' ? (
        <div style={estilos.cartaoPro}>
          <div style={estilos.assinanteTopo}>
            <span style={estilos.assinanteIcone}><IconeOrbi tamanho={26} /></span>
            <div style={estilos.assinanteInfo}>
              <div style={estilos.assinanteTitulo}>Orbi <span style={estilos.assinantePro}>Pro</span></div>
              <div style={estilos.assinanteStatus}>
                <span style={estilos.selinho}>ATIVO</span>
                Plano {plano === 'anual' ? 'Anual' : 'Mensal'}
              </div>
            </div>
          </div>
          <p style={estilos.assinanteDesc}>Todos os recursos liberados. Obrigado por apoiar o Orbi.</p>
          <button style={estilos.proCancelar} onClick={() => cancelarAssinatura()}>Gerenciar assinatura</button>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <PainelPro onAssinar={(pl) => assinar(pl)} />
        </div>
      )}

      <div style={estilos.cartao}>
        <div style={estilos.aparenciaCabecalho}>
          <span style={estilos.aparenciaIcone} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <div>
            <div style={estilos.aparenciaTitulo}>Aparência</div>
            <div style={estilos.aparenciaSub}>Escolha o tema que combina com você.</div>
          </div>
        </div>

        <div style={estilos.temaGrade}>
          {TEMAS.map((t) => {
            const ativo = tema === t.id;
            const bloqueado = t.id !== 'light' && !premium;
            return (
              <button
                key={t.id}
                style={{ ...estilos.temaCard, ...(ativo ? estilos.temaCardAtivo : null) }}
                onClick={() => trocarTema(t.id)}
                aria-pressed={ativo}
                aria-label={bloqueado ? `${t.nome} (Premium)` : t.nome}
              >
                <span style={estilos.temaTopo}>
                  <span style={{ ...estilos.temaSwatch, background: t.bg, ...(bloqueado ? estilos.temaSwatchBloq : null) }} aria-hidden="true">
                    <span style={{ ...estilos.temaSwatchSup, background: t.superficie }} />
                    <span style={{ ...estilos.temaSwatchAcento, background: t.acento }} />
                  </span>
                  {bloqueado ? (
                    <span style={estilos.temaCoroa} aria-hidden="true"><IconePro tamanho={15} cor={cores.acento} /></span>
                  ) : (
                    <span style={{ ...estilos.temaRadio, ...(ativo ? estilos.temaRadioAtivo : null) }}>
                      {ativo && <span style={estilos.temaRadioPonto} />}
                    </span>
                  )}
                </span>
                <span style={{ ...estilos.temaNome, ...(bloqueado ? { opacity: 0.7 } : null) }}>{t.nome}</span>
                <span style={estilos.temaDesc}>{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={estilos.cartao}>
        <div style={estilos.aparenciaCabecalho}>
          <span style={estilos.aparenciaIcone} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <div>
            <div style={estilos.aparenciaTitulo}>Notificações</div>
            <div style={estilos.aparenciaSub}>Lembretes dos seus compromissos na hora certa.</div>
          </div>
        </div>
        {notif === true ? (
          <p style={estilos.info}>
            <span style={estilos.selinho}>ATIVAS</span>{' '}
            Os lembretes definidos em cada evento vão avisar você automaticamente.
          </p>
        ) : (
          <>
            <p style={estilos.info}>
              {notif === false
                ? 'As notificações estão desativadas. Ative para receber os lembretes dos seus eventos.'
                : 'Verificando permissão de notificações…'}
            </p>
            <button style={estilos.salvarLocal} onClick={ativarNotificacoes}>Ativar notificações</button>
          </>
        )}
      </div>

      <div style={estilos.cartao}>
        <div style={estilos.grupoTitulo}>Feriados</div>
        <p style={estilos.info}>Os feriados nacionais aparecem sempre (offline). Escolha um estado para incluir os estaduais e, opcionalmente, os da capital.</p>

        <label style={estilos.rotuloCampo}>Estado (UF)</label>
        <select value={uf} onChange={(e) => { setUf(e.target.value); setIncluirCapital(false); }} style={estilos.select}>
          <option value="">Só feriados nacionais</option>
          {UFS.map((u) => (
            <option key={u.sigla} value={u.sigla}>{u.nome} ({u.sigla})</option>
          ))}
        </select>

        {capital && (
          <label style={estilos.linhaCheck}>
            <input type="checkbox" checked={incluirCapital} onChange={(e) => setIncluirCapital(e.target.checked)} />
            Incluir feriados da capital · {capital.nome}
          </label>
        )}

        <button style={estilos.salvarLocal} onClick={salvarLocalidade}>Salvar localidade</button>
        <p style={estilos.infoPeq}>
          {localSalvo.municipio
            ? `Atual: ${localSalvo.municipioNome} (${localSalvo.uf}) — nacionais + estaduais + municipais.`
            : localSalvo.uf
              ? `Atual: ${localSalvo.uf} — nacionais + estaduais.`
              : 'Atual: só nacionais.'}
        </p>
      </div>

      <div style={estilos.cartao}>
        {confirmandoDelete ? (
          <div>
            <p style={estilos.info}>Isso apaga sua conta e todos os seus dados. Não dá para desfazer.</p>
            <div style={estilos.acoes}>
              <button style={estilos.cancelar} onClick={() => setConfirmandoDelete(false)}>Cancelar</button>
              <button style={estilos.perigo} onClick={confirmarDelecao}>Sim, deletar conta</button>
            </div>
          </div>
        ) : (
          <div style={estilos.acoes}>
            <button style={estilos.sairBtn} onClick={fazerLogout}>Sair</button>
            <button style={estilos.deletarBtn} onClick={() => setConfirmandoDelete(true)}>Deletar conta</button>
          </div>
        )}
      </div>

      {aviso && (
        <div style={estilos.avisoToast} className="bottomSheet" onClick={() => setAviso('')} role="status">
          {aviso}
        </div>
      )}

      <p style={estilos.versao}>Calendário · versão local 1.0</p>
    </div>
  );
}

const estilos = {
  pagina: { width: '100%', maxWidth: 'var(--app-max, 560px)', boxSizing: 'border-box', margin: '0 auto', padding: '0 14px 24px' },
  cabecalhoMais: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 0 10px' },
  tituloMais: { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: cores.texto, fontFamily: 'var(--fonte-titulo, inherit)' },
  cabecalho: { padding: '4px 2px 16px' },
  titulo: { fontSize: 30, fontWeight: 800, letterSpacing: -0.6, color: cores.texto, margin: 0 },
  subtitulo: { fontSize: 14, color: cores.textoSuave, margin: '4px 0 0', fontWeight: 500 },
  cartao: { background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande, boxShadow: sombra, padding: 16, marginBottom: 14 },
  cartaoPro: { background: cores.superficie, border: `1px solid ${cores.acento}`, borderRadius: raioGrande, boxShadow: sombra, padding: 16, marginBottom: 14 },
  proTitulo: { fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: cores.texto },
  proTrial: { display: 'inline-block', marginTop: 8, padding: '4px 10px', borderRadius: 999, background: 'var(--fav-bg, #fff9ec)', color: '#8a5a00', fontSize: 12.5, fontWeight: 800 },
  proSub: { fontSize: 13.5, color: cores.textoSuave, margin: '8px 0 14px', lineHeight: 1.5 },
  proAssinar: { width: '100%', marginTop: 14, padding: '14px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 15, fontWeight: 800, cursor: 'pointer' },
  proCancelar: { marginTop: 14, padding: '11px 14px', width: '100%', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' },
  assinanteTopo: { display: 'flex', alignItems: 'center', gap: 12 },
  assinanteIcone: { flexShrink: 0, width: 44, height: 44, borderRadius: 13, background: '#ffffff', border: `1px solid ${cores.borda}`, boxShadow: sombraSuave, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  assinanteInfo: { minWidth: 0 },
  assinanteTitulo: { fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: cores.texto },
  assinantePro: { color: cores.acento },
  assinanteStatus: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: cores.textoSuave, marginTop: 2 },
  selinho: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'rgba(15,157,88,0.14)', color: '#0f9d58', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4 },
  assinanteDesc: { fontSize: 13, color: cores.textoSuave, margin: '13px 0 0', fontWeight: 500, lineHeight: 1.5 },
  temaSwatchBloq: { opacity: 0.35 },
  temaCoroa: { fontSize: 16, lineHeight: 1 },
  grupoTitulo: { fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: cores.textoApagado, marginBottom: 10 },
  segmento: { display: 'flex', gap: 6, padding: 4, background: cores.superficie2, borderRadius: raio },
  segBotao: { flex: 1, padding: '9px 4px', border: 'none', borderRadius: raioPequeno, background: 'transparent', color: cores.textoSuave, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  segAtivo: { background: cores.superficie, color: cores.acento, boxShadow: sombraSuave },

  // ---- Seletor de tema (cards) — bordas em longhand p/ resolver var() por tema ----
  aparenciaCabecalho: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  aparenciaIcone: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0, borderRadius: '50%', background: cores.acentoBg, color: cores.acento },
  aparenciaTitulo: { fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: cores.texto },
  aparenciaSub: { fontSize: 12, color: cores.textoSuave, marginTop: 1, fontWeight: 500 },
  temaGrade: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  temaCard: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, padding: 10, textAlign: 'left', borderWidth: 1, borderStyle: 'solid', borderColor: cores.borda, borderRadius: raio, background: cores.superficie, cursor: 'pointer', transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease' },
  temaCardAtivo: { borderColor: cores.acento, boxShadow: `inset 0 0 0 1px ${cores.acento}` },
  temaTopo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  // Preview do tema: fundo + "card" (superfície) + ponto de acento — como uma mini-UI.
  temaSwatch: { position: 'relative', width: 34, height: 34, borderRadius: 10, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' },
  temaSwatchSup: { position: 'absolute', left: 5, bottom: 5, width: 20, height: 15, borderRadius: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.12)' },
  temaSwatchAcento: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: '50%', boxShadow: '0 0 0 2px rgba(255,255,255,0.55)' },
  temaRadio: { width: 17, height: 17, borderRadius: '50%', borderWidth: 2, borderStyle: 'solid', borderColor: cores.bordaForte, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flexShrink: 0 },
  temaRadioAtivo: { borderColor: cores.acento },
  temaRadioPonto: { width: 8, height: 8, borderRadius: '50%', background: cores.acento },
  temaNome: { fontSize: 13.5, fontWeight: 700, letterSpacing: -0.2, color: cores.texto },
  temaDesc: { fontSize: 11.5, fontWeight: 500, color: cores.textoSuave },
  aparenciaRodape: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cores.borda}`, fontSize: 12.5, color: cores.textoApagado, fontWeight: 600 },
  aparenciaRodapeIcone: { color: cores.acento, fontSize: 13 },
  premium: { color: cores.acento, fontWeight: 800 },
  info: { fontSize: 13.5, color: cores.textoSuave, margin: '0 0 12px', lineHeight: 1.5 },
  infoPeq: { fontSize: 12.5, color: cores.textoApagado, margin: '10px 0 0', fontWeight: 600 },
  rotuloCampo: { display: 'block', fontSize: 12, fontWeight: 700, color: cores.textoSuave, marginBottom: 6 },
  select: { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: raio, border: `1px solid ${cores.borda}`, background: cores.superficie, color: cores.texto, fontSize: 14.5, fontFamily: 'inherit', cursor: 'pointer' },
  linhaCheck: { display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 0', fontSize: 14, fontWeight: 600, color: cores.textoSuave, cursor: 'pointer' },
  salvarLocal: { width: '100%', marginTop: 14, padding: '11px', border: 'none', borderRadius: raio, background: cores.acento, color: cores.acentoTexto, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  linha: { width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 12px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, boxShadow: sombraSuave, cursor: 'pointer', marginBottom: 8, color: cores.texto },
  linhaTexto: { fontSize: 14.5, fontWeight: 600 },
  seta: { color: cores.textoApagado, fontSize: 20 },
  acoes: { display: 'flex', gap: 9 },
  cancelar: { flex: 1, padding: '12px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.textoSuave, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  perigo: { flex: 1, padding: '12px', border: 'none', borderRadius: raio, background: cores.perigo, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  // Conta / login
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.texto, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: sombraSuave },
  googleIcone: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  contaBox: { display: 'flex', alignItems: 'center', gap: 12 },
  contaAvatar: { flexShrink: 0, width: 44, height: 44, borderRadius: '50%', background: cores.acento, color: cores.textoClaro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 },
  contaInfo: { minWidth: 0 },
  contaNome: { fontSize: 15, fontWeight: 700, color: cores.texto },
  contaEmail: { fontSize: 13, color: cores.textoSuave, marginTop: 1 },
  sairBtn: { flex: 1, padding: '12px', border: `1px solid ${cores.borda}`, borderRadius: raio, background: cores.superficie, color: cores.texto, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  deletarBtn: { flex: 1, padding: '12px', border: `1px solid ${cores.perigo}`, borderRadius: raio, background: 'transparent', color: cores.perigo, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  avisoToast: {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)',
    bottom: 'calc(72px + env(safe-area-inset-bottom))', zIndex: 60,
    width: 'calc(100% - 32px)', maxWidth: 'calc(var(--app-max, 560px) - 32px)', boxSizing: 'border-box',
    padding: '12px 16px', borderRadius: raio, background: cores.acento, color: cores.acentoTexto,
    fontSize: 13.5, fontWeight: 600, textAlign: 'center', boxShadow: sombraForte, cursor: 'pointer',
  },
  versao: { textAlign: 'center', fontSize: 12, color: cores.textoFraco, fontWeight: 600, marginTop: 8 },
};

export default Mais;
