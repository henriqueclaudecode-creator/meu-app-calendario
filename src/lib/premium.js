// Assinatura Premium do Orbi — teste grátis de 7 dias + planos.
//
// Regras (ver conceito do produto):
//   • Ao abrir o app pela 1ª vez começa o teste grátis de 7 dias.
//   • Durante o teste: acesso total (sem cadeados).
//   • Depois do teste: recursos Premium continuam VISÍVEIS, só que com um selo
//     e, ao tocar, abrem o paywall (bottom sheet). Nada é escondido.
//   • Assinando (mensal/anual): volta a ser Premium.
//
// A cobrança real é feita pelo RevenueCat (ver ./billing.js). Quando o billing
// está disponível (app instalado + chave configurada), o estado de "assinante"
// vem do entitlement "premium" do RevenueCat. Sem billing (navegador/dev), cai
// no modo LOCAL (stub em localStorage) para o app continuar utilizável.

import * as Billing from './billing';

const CHAVE_INICIO = 'orbi.trialInicio';    // ISO de quando o teste começou
const CHAVE_PLANO = 'orbi.plano';           // null | 'mensal' | 'anual' (stub local)
const CHAVE_MSG_FIM = 'orbi.trialFimVisto';  // '1' depois de mostrar a msg única

export const DIAS_TRIAL = 7;

export const PLANOS = {
  mensal: { id: 'mensal', rotulo: 'Mensal', preco: 'R$ 12,90', periodo: '/mês' },
  anual: {
    id: 'anual', rotulo: 'Anual', preco: 'R$ 89,90', periodo: '/ano',
    equivalente: 'Apenas R$ 7,49/mês', economia: 'Economize 42%', popular: true,
  },
};

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

function garantirInicio() {
  if (!localStorage.getItem(CHAVE_INICIO)) {
    localStorage.setItem(CHAVE_INICIO, new Date().toISOString());
  }
}

// Chamado no boot para marcar o começo do teste.
export function iniciarTrialSeNecessario() {
  garantirInicio();
}

export function diasRestantes() {
  garantirInicio();
  const inicio = new Date(localStorage.getItem(CHAVE_INICIO));
  const passados = Math.floor((Date.now() - inicio.getTime()) / 86400000);
  return Math.max(0, DIAS_TRIAL - passados);
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

// É Premium se tem assinatura ativa (billing OU stub) OU ainda está no teste.
export function ehPremium() {
  return billing.ativo || !!planoLocal() || diasRestantes() > 0;
}

// 'assinante' | 'trial' | 'expirado'
export function estado() {
  if (billing.ativo || planoLocal()) return 'assinante';
  return diasRestantes() > 0 ? 'trial' : 'expirado';
}

// Assina o plano. Assíncrona: no app dispara a compra real (RevenueCat); no
// navegador/dev grava o stub local. Retorna { ok, cancelado? }.
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

// Mensagem única "Você aproveitou o Orbi Premium por 7 dias" — só quando o teste
// acabou e ainda não foi mostrada.
export function deveMostrarBoasVindasFim() {
  return estado() === 'expirado' && localStorage.getItem(CHAVE_MSG_FIM) !== '1';
}
export function marcarBoasVindasFimVista() {
  localStorage.setItem(CHAVE_MSG_FIM, '1');
}

export function observar(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}
