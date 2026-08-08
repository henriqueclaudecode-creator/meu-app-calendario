// Camada de billing (RevenueCat) — isola o resto do app da API de compras.
//
// Só funciona no APP INSTALADO (Android) e quando a chave pública do RevenueCat
// está configurada em VITE_REVENUECAT_ANDROID_KEY. No navegador/dev, ou sem a
// chave, `billingDisponivel()` é false e o premium.js cai no comportamento local
// (stub) — nada quebra.
//
// Modelo no RevenueCat:
//   • Entitlement: "premium"  → quem está ativo tem acesso Pro.
//   • Produtos (Play): assinaturas mensal e anual, expostas na "current offering"
//     como pacotes MONTHLY e ANNUAL.

import { Capacitor } from '@capacitor/core';

const NATIVO = Capacitor.isNativePlatform?.() ?? false;
const CHAVE = import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '';
export const ENTITLEMENT = 'premium';

let _api = null;        // módulo do plugin (carregado sob demanda)
let _configurado = false;
const ouvintes = new Set();

export function billingDisponivel() {
  return NATIVO && !!CHAVE;
}

async function api() {
  if (!_api) _api = await import('@revenuecat/purchases-capacitor');
  return _api;
}

// Configura o SDK uma única vez. Idempotente e seguro de chamar sempre no boot.
export async function iniciarBilling() {
  if (!billingDisponivel() || _configurado) return;
  const { Purchases, LOG_LEVEL } = await api();
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
  } catch { /* opcional */ }
  await Purchases.configure({ apiKey: CHAVE });
  _configurado = true;
  // Repassa qualquer atualização de assinatura para os ouvintes (premium.js).
  try {
    await Purchases.addCustomerInfoUpdateListener((info) => notificar(info));
  } catch { /* algumas versões entregam via evento; ignora se indisponível */ }
}

// Liga a conta do RevenueCat ao uid do Firebase (sincroniza compras entre
// aparelhos do mesmo usuário). Chamado após o login.
export async function identificarUsuario(uid) {
  if (!billingDisponivel() || !uid) return;
  try {
    await iniciarBilling();
    const { Purchases } = await api();
    await Purchases.logIn({ appUserID: uid });
  } catch { /* silencioso */ }
}

export async function esquecerUsuario() {
  if (!billingDisponivel()) return;
  try { const { Purchases } = await api(); await Purchases.logOut(); } catch { /* silencioso */ }
}

// Deriva 'mensal' | 'anual' | null do productIdentifier do entitlement ativo.
function planoDoProduto(prodId = '') {
  const p = prodId.toLowerCase();
  if (p.includes('anual') || p.includes('annual') || p.includes('year')) return 'anual';
  if (p.includes('mensal') || p.includes('month')) return 'mensal';
  return null;
}

function estadoDeCustomerInfo(info) {
  const ent = info?.entitlements?.active?.[ENTITLEMENT];
  if (!ent) return { ativo: false, plano: null };
  return { ativo: true, plano: planoDoProduto(ent.productIdentifier) };
}

// Estado atual da assinatura (consulta o RevenueCat). Sem billing → inativo.
export async function estadoAssinatura() {
  if (!billingDisponivel()) return { ativo: false, plano: null };
  try {
    await iniciarBilling();
    const { Purchases } = await api();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return estadoDeCustomerInfo(customerInfo);
  } catch {
    return { ativo: false, plano: null };
  }
}

// Compra o plano ('mensal' | 'anual'). Retorna { ativo, plano } atualizado.
// Lança { cancelado: true } se o usuário fechar o fluxo de compra.
export async function comprar(plano) {
  if (!billingDisponivel()) throw new Error('Billing indisponível.');
  await iniciarBilling();
  const { Purchases, PACKAGE_TYPE, PURCHASES_ERROR_CODE } = await api();

  const { current } = await Purchases.getOfferings();
  const pacotes = current?.availablePackages ?? [];
  const querAnual = plano === 'anual';
  const alvo =
    pacotes.find((p) => p.packageType === (querAnual ? PACKAGE_TYPE.ANNUAL : PACKAGE_TYPE.MONTHLY))
    ?? pacotes.find((p) => planoDoProduto(p.product?.identifier) === plano)
    ?? pacotes[0];
  if (!alvo) throw new Error('Nenhum plano disponível para compra.');

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: alvo });
    const estado = estadoDeCustomerInfo(customerInfo);
    notificar(customerInfo);
    return estado;
  } catch (e) {
    if (e?.code === PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR || e?.userCancelled) {
      throw { cancelado: true };
    }
    throw e;
  }
}

// Restaura compras (ex.: reinstalação / troca de aparelho).
export async function restaurar() {
  if (!billingDisponivel()) return { ativo: false, plano: null };
  await iniciarBilling();
  const { Purchases } = await api();
  const { customerInfo } = await Purchases.restorePurchases();
  const estado = estadoDeCustomerInfo(customerInfo);
  notificar(customerInfo);
  return estado;
}

export function observarBilling(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}

function notificar(info) {
  const estado = estadoDeCustomerInfo(info);
  for (const cb of ouvintes) cb(estado);
}
