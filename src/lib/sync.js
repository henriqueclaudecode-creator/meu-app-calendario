// Sincronização com a nuvem (Firestore) — SÓ para quem faz login com Google.
//
// Modelo (decisão de produto): UNIÃO SEGURA. Ao sincronizar, junta o que está
// no aparelho com o que está na nuvem, por id. Em conflito (mesmo id dos dois
// lados), vence o registro com `atualizado_em`/`criado_em` mais recente. Nada é
// apagado por causa da mescla — a prioridade é NUNCA perder a história do
// usuário.
//
// Consequência aceita: sem "tombstones", exclusões NÃO se propagam de forma
// confiável entre aparelhos (um item apagado num aparelho pode reaparecer numa
// próxima sincronização). Foi a troca escolhida a favor da proteção contra perda.
//
// Tudo aqui é no-op quando o Firebase está desligado (sem .env.local) ou quando
// não há usuário logado — então o app local/grátis não é afetado em nada.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseAtivo, db } from './firebase';
import { observarAuth, usuarioAtual } from './auth';
import { listarMomentos, substituirMomentos } from '../db/momentos';
import { listarEventos, substituirEventos } from '../db/eventos';
import { listarCategorias, substituirCategorias } from '../db/categorias';
import { listarObjetivos, substituirObjetivos } from '../db/objetivos';
import { lerPerfil, salvarPerfil } from './perfil';
import { sincronizarTodos } from './notificacoes';

// Ouvintes de "dados sincronizados" (as telas podem recarregar ao ouvir).
const ouvintes = new Set();
export function observarSync(cb) { ouvintes.add(cb); return () => ouvintes.delete(cb); }
function notificar() {
  for (const cb of ouvintes) { try { cb(); } catch { /* ignora */ } }
  try { window.dispatchEvent(new Event('dados-sincronizados')); } catch { /* ignora */ }
}

// Timestamp de um registro para desempate (mais recente vence).
function quando(item) {
  return item?.atualizado_em ?? item?.criado_em ?? 0;
}

// União por id: mantém todos os ids dos dois lados; em conflito, o mais recente.
function unirPorId(local, remoto) {
  const map = new Map();
  for (const item of Array.isArray(remoto) ? remoto : []) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of Array.isArray(local) ? local : []) {
    if (!item || !item.id) continue;
    const existente = map.get(item.id);
    if (!existente || quando(item) >= quando(existente)) map.set(item.id, item);
  }
  return [...map.values()];
}

// Perfil não tem id nem timestamp: mescla campo a campo, preferindo valores
// preenchidos e mantendo o onboarding como concluído se qualquer lado concluiu.
function unirPerfil(local, remoto) {
  const l = local || {};
  const r = remoto || {};
  return {
    ...r,
    ...l,
    nascimento: l.nascimento ?? r.nascimento ?? null,
    cidade: l.cidade || r.cidade || '',
    onboardingFeito: !!(l.onboardingFeito || r.onboardingFeito),
  };
}

let sincronizando = false;

// Executa uma sincronização completa (pull → mescla → grava local → push).
// Idempotente e à prova de erro: qualquer falha de rede apenas aborta sem tocar
// no que já está local.
export async function sincronizarAgora() {
  if (!firebaseAtivo || !db) return;
  const u = usuarioAtual();
  if (!u) return;
  if (sincronizando) return;
  sincronizando = true;
  try {
    // Guardamos os dados no PRÓPRIO documento do usuário (users/{uid}), que as
    // regras do Firestore já liberam para o dono — desde que não se toque no
    // campo `premium` (não tocamos). Assim não é preciso publicar regras novas.
    const ref = doc(db, 'users', u.uid);

    let remoto = {};
    try {
      const snap = await getDoc(ref);
      remoto = snap.exists() ? snap.data() : {};
    } catch {
      return; // sem leitura, não arrisca escrever
    }

    const [localMom, localEv, localCat, localObj] = await Promise.all([
      listarMomentos(), listarEventos(), listarCategorias(), listarObjetivos(),
    ]);
    const localPerfil = lerPerfil();

    const momentos = unirPorId(localMom, remoto.momentos);
    const eventos = unirPorId(localEv, remoto.eventos);
    const categorias = unirPorId(localCat, remoto.categorias);
    const objetivos = unirPorId(localObj, remoto.objetivos);
    const perfil = unirPerfil(localPerfil, remoto.perfil);

    // Grava o resultado no aparelho.
    await substituirMomentos(momentos);
    await substituirEventos(eventos);
    await substituirCategorias(categorias);
    await substituirObjetivos(objetivos);
    salvarPerfil(perfil);

    // Sobe o resultado para a nuvem. merge:true preserva nome/email/premium do
    // documento; não incluímos `premium`, então as regras permitem a escrita.
    try {
      await setDoc(ref, { momentos, eventos, categorias, objetivos, perfil, sincronizadoEm: Date.now() }, { merge: true });
    } catch { /* offline: o local já está mesclado; sobe na próxima vez */ }

    // Reagenda as notificações dos eventos que possam ter chegado da nuvem.
    try { await sincronizarTodos(eventos); } catch { /* ignora */ }

    notificar();
  } finally {
    sincronizando = false;
  }
}

// Push debounced — chamado após alterações locais, para propagar sem esperar o
// próximo login/foco. Só age logado.
let timer = null;
export function agendarSincronizacao(atrasoMs = 1500) {
  if (!firebaseAtivo || !usuarioAtual()) return;
  clearTimeout(timer);
  timer = setTimeout(() => { sincronizarAgora(); }, atrasoMs);
}

// Liga a sincronização automática: ao logar e ao trazer o app para frente.
// Chamada uma vez no boot (main.jsx).
export function iniciarSync() {
  if (!firebaseAtivo) return;
  observarAuth((u) => { if (u) sincronizarAgora(); });
  try {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && usuarioAtual()) sincronizarAgora();
    });
  } catch { /* ambiente sem document */ }
}
