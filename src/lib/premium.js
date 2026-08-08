// Assinatura Premium do Orbi.
//
// Modelo (decisão de produto):
//   • O usuário começa no nível GRÁTIS (recursos Pro visíveis, mas bloqueados).
//   • O teste grátis de 7 dias faz parte da ASSINATURA (oferta de free trial da
//     Google Play): ao assinar, os 7 primeiros dias não são cobrados; se não
//     cancelar, renova automaticamente no preço do plano.
//   • Não existe mais "teste automático" liberando tudo na 1ª abertura.
//
// A cobrança real é feita pelo RevenueCat (ver ./billing.js). Quando o billing
// está disponível (app instalado + chave configurada), o estado de "assinante"
// vem do entitlement "premium". Sem billing (navegador/dev), cai no modo LOCAL
// (stub em localStorage) só para conseguir testar a UI desbloqueada.

import * as Billing from './billing';

const CHAVE_PLANO = 'orbi.plano';           // null | 'mensal' | 'anual' (stub local)

export const PLANOS = {
  mensal: { id: 'mensal', rotulo: 'Mensal', preco: 'R$ 12,90', periodo: '/mês' },
  anual: {
    id: 'anual', rotulo: 'Anual', preco: 'R$ 89,90', periodo: '/ano',
    equivalente: 'Apenas R$ 7,49/mês', economia: 'Economize 42%', popular: true,
  },
};

// Dias do teste grátis (oferta de free trial da assinatura na Play).
export const DIAS_TRIAL = 7;

export const BENEFICIOS = ['Todos os temas', 'Minha História', 'Mapa da Vida'];

// URL para gerenciar/cancelar a assinatura na Google Play.
const URL_GERENCIAR = 'https://play.google.com/store/account/subscriptions';

const ouvintes = new Set();
function notificar() { for (const cb of ouvintes) cb(); }

// Estado do billing real (RevenueCat), atualizado de forma assíncrona.
let billing = { ativo: false, plano: null };

// Boot do billing: configura o SDK e busca o estado atual; reage a mudanças.
export async function iniciarBillingSeNecessario() {
  if (!Billing.billingDisponivel()) return;
  try {
    await Billing.iniciarBilling();
    Billing.observarBilling((estadoNovo) => { billing = estadoNovo; notificar(); });
    billing = await Billing.estadoAssinatura();
    notificar();
  } catch { /* silencioso — mantém stub local */ }
}

// Plano do stub local (só quando não há billing real).
function planoLocal() {
  return localStorage.getItem(CHAVE_PLANO) || null;
}

// Plano ativo: billing real tem prioridade; senão, o stub local.
export function planoAtual() {
  if (billing.ativo) return billing.plano || 'anual';
  return planoLocal();
}

// É Premium se há assinatura ativa (billing real OU stub local de dev).
// Durante o período de teste da assinatura, o entitlement já fica ativo.
export function ehPremium() {
  return billing.ativo || !!planoLocal();
}

// 'assinante' | 'gratis'
export function estado() {
  return ehPremium() ? 'assinante' : 'gratis';
}

// Assina o plano. Assíncrona: no app dispara a compra real (RevenueCat, já com
// o teste grátis da oferta); no navegador/dev grava o stub local. Retorna
// { ok, cancelado? }.
export async function assinar(plano) {
  const pl = plano === 'mensal' ? 'mensal' : 'anual';
  if (Billing.billingDisponivel()) {
    try {
      billing = await Billing.comprar(pl);
      notificar();
      return { ok: billing.ativo };
    } catch (e) {
      if (e?.cancelado) return { ok: false, cancelado: true };
      return { ok: false, erro: e };
    }
  }
  // Stub local (dev/web).
  localStorage.setItem(CHAVE_PLANO, pl);
  notificar();
  return { ok: true };
}

// Restaura compras (reinstalação/troca de aparelho).
export async function restaurar() {
  if (!Billing.billingDisponivel()) return { ok: false };
  try {
    billing = await Billing.restaurar();
    notificar();
    return { ok: billing.ativo };
  } catch { return { ok: false }; }
}

// "Gerenciar assinatura": no app real abre a página de assinaturas da Play;
// no stub local apenas remove o plano de teste.
export function cancelarAssinatura() {
  if (Billing.billingDisponivel()) {
    try { window.open(URL_GERENCIAR, '_blank'); } catch { /* ignora */ }
    return;
  }
  localStorage.removeItem(CHAVE_PLANO);
  notificar();
}

export function observar(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}
