// Ponte de dados para os widgets nativos (tela inicial do Android).
//
// Os widgets nativos não têm acesso ao localStorage do WebView. Então, sempre que
// os eventos mudam, publicamos um pequeno JSON com o "próximo evento" via Capacitor
// Preferences — que no Android grava em SharedPreferences("CapacitorStorage"),
// exatamente de onde o ProximoEventoWidget.kt lê.
//
// No navegador (fora do app nativo) isto grava no localStorage e é inofensivo.

import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';

// Plugin nativo local (definido em WidgetPlugin.kt) que manda os widgets se
// atualizarem na hora. Na web, a chamada simplesmente falha e é ignorada.
const WidgetBridge = registerPlugin('WidgetBridge');

const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTO_CAP = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function isoDe(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Mesma regra de recorrência usada nas telas (Agenda/Calendário).
function ocorreEm(e, dataIso) {
  const rep = e.repetir ?? 'nao';
  if (rep === 'nao' || !rep) return e.data === dataIso;
  if (dataIso < e.data) return false;
  const a = dataLocal(e.data);
  const b = dataLocal(dataIso);
  const diffDias = Math.round((b - a) / 86400000);
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (rep === 'diario') return true;
  if (rep === 'semanal') return a.getDay() === b.getDay();
  if (rep === 'mensal') return a.getDate() === b.getDate();
  if (rep === 'anual') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
  if (rep === 'personalizado') {
    const n = Math.max(1, e.repetirCada ?? 1);
    const u = e.repetirUnidade ?? 'semanas';
    if (u === 'dias') return diffDias % n === 0;
    if (u === 'semanas') return a.getDay() === b.getDay() && (diffDias / 7) % n === 0;
    if (u === 'meses') return a.getDate() === b.getDate() && meses % n === 0;
    if (u === 'anos') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && (b.getFullYear() - a.getFullYear()) % n === 0;
  }
  return false;
}

// Encontra a próxima ocorrência (a partir de agora) varrendo os próximos 365 dias.
function proximaOcorrencia(eventos) {
  const agora = new Date();
  for (let i = 0; i < 366; i++) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const iso = isoDe(dia);
    const doDia = eventos
      .filter((e) => ocorreEm(e, iso))
      .sort((a, b) => (a.inicio ?? '00:00').localeCompare(b.inicio ?? '00:00'));
    for (const e of doDia) {
      if (i === 0 && e.inicio) {
        // Hoje: só conta se o horário ainda não passou.
        const [h, m] = e.inicio.split(':').map(Number);
        const quando = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m);
        if (quando < agora) continue;
      }
      return { evento: e, iso };
    }
  }
  return null;
}

function rotuloData(iso) {
  const d = dataLocal(iso);
  const hoje = new Date();
  const diff = Math.round((d - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
  const base = `${d.getDate()} de ${MESES_CURTO[d.getMonth()]}.`;
  if (diff === 0) return `Hoje, ${base}`;
  if (diff === 1) return `Amanhã, ${base}`;
  return base;
}

function rotuloContagem(iso, inicio) {
  const hoje = new Date();
  const d = dataLocal(iso);
  const diffDias = Math.round((d - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
  if (diffDias === 0 && inicio) {
    const [h, m] = inicio.split(':').map(Number);
    const quando = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
    const min = Math.round((quando - hoje) / 60000);
    if (min <= 0) return 'Agora';
    if (min < 60) return `Em ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
    const horas = Math.round(min / 60);
    return `Em ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Amanhã';
  return `Em ${diffDias} dias`;
}

// ---- Contagem regressiva ---------------------------------------------------
// Usa os eventos favoritos futuros (como no mockup: "Prova em 39 dias"…). Sem
// favoritos, cai para os próximos eventos. Publica até 2 cartões.
function montarContagem(eventos, categorias, premium) {
  const catDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const hoje = new Date();
  const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diasAte = (iso) => Math.round((dataLocal(iso) - hojeZero) / 86400000);

  let base = eventos.filter((e) => e.favorito && diasAte(e.data) >= 0);
  if (base.length === 0) base = eventos.filter((e) => diasAte(e.data) >= 0);
  base = base.sort((a, b) => a.data.localeCompare(b.data)).slice(0, 2);

  const itens = base.map((e) => {
    const d = dataLocal(e.data);
    const dias = diasAte(e.data);
    const cat = catDe(e);
    return {
      titulo: e.titulo ?? 'Evento',
      dias,
      unidade: dias === 1 ? 'dia' : 'dias',
      data: `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`,
      cor: e.cor ?? cat?.cor ?? '',
    };
  });
  return { itens, premium: !premium };
}

// ---- Calendário mensal -----------------------------------------------------
// Monta a grade do mês atual (42 células) com os chips de evento por dia.
function montarCalendario(eventos, categorias, premium) {
  const catDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const corDe = (e) => e.cor ?? catDe(e)?.cor ?? '#9AA6B2';
  const hoje = new Date();
  const hojeIso = isoDe(hoje);
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiro = new Date(ano, mes, 1);
  const desloc = primeiro.getDay(); // 0 = domingo (semana começa no domingo)
  const cursor = new Date(ano, mes, 1 - desloc);

  const celulas = [];
  for (let i = 0; i < 42; i++) {
    const iso = isoDe(cursor);
    const noMes = cursor.getMonth() === mes;
    const dom = cursor.getDay() === 0;
    let chips = [];
    let extra = 0;
    if (noMes) {
      const doDia = eventos
        .filter((e) => ocorreEm(e, iso))
        .sort((a, b) => (a.inicio ?? '00:00').localeCompare(b.inicio ?? '00:00'));
      chips = doDia.slice(0, 2).map((e) => ({ t: e.titulo ?? '', cor: corDe(e) }));
      extra = Math.max(0, doDia.length - chips.length);
    }
    celulas.push({ dia: cursor.getDate(), noMes, dom, hoje: iso === hojeIso, chips, extra });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { mes: `${MESES_CURTO_CAP[mes]} ${ano}`, celulas, premium: !premium };
}

// ---- Agenda de Hoje (widget GRÁTIS) ----------------------------------------
// Lista os eventos de hoje, em ordem de horário. Sem trava premium.
function montarAgenda(eventos, categorias) {
  const catDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const hoje = new Date();
  const iso = isoDe(hoje);
  const doDia = eventos
    .filter((e) => ocorreEm(e, iso))
    .sort((a, b) => (a.inicio ?? '99:99').localeCompare(b.inicio ?? '99:99'));

  const itens = doDia.map((e) => {
    const cat = catDe(e);
    return {
      hora: e.inicio ?? '',
      titulo: e.titulo ?? 'Evento',
      sub: cat?.nome ?? (e.notas ? e.notas : ''),
      cor: e.cor ?? cat?.cor ?? '#9AA6B2',
    };
  });

  const n = itens.length;
  return {
    data: `${hoje.getDate()} de ${MESES_CURTO[hoje.getMonth()]} • ${DIAS_CURTO[hoje.getDay()]}`,
    rodape: n === 0 ? 'Nada marcado hoje' : `${n} ${n === 1 ? 'evento' : 'eventos'} hoje`,
    itens,
  };
}

// Publica os dados de todos os widgets nativos. Chame após carregar/alterar
// eventos. `opcoes.premium` indica se o usuário é assinante (controla o selo).
export async function publicarWidget(eventos, categorias = [], opcoes = {}) {
  try {
    const evs = eventos ?? [];
    const catDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;

    // 1) Próximo evento
    const prox = proximaOcorrencia(evs);
    let proximo;
    if (!prox) {
      proximo = { vazio: true, premium: !opcoes.premium };
    } else {
      const e = prox.evento;
      const cat = catDe(e);
      proximo = {
        vazio: false,
        hora: e.inicio ?? '',
        titulo: e.titulo ?? 'Evento',
        local: cat?.nome ?? '',
        cor: e.cor ?? cat?.cor ?? '',
        contagem: rotuloContagem(prox.iso, e.inicio),
        data: rotuloData(prox.iso),
        premium: !opcoes.premium,
      };
    }

    await Preferences.set({ key: 'widget_proximo', value: JSON.stringify(proximo) });
    await Preferences.set({ key: 'widget_contagem', value: JSON.stringify(montarContagem(evs, categorias, opcoes.premium)) });
    await Preferences.set({ key: 'widget_calendario', value: JSON.stringify(montarCalendario(evs, categorias, opcoes.premium)) });
    await Preferences.set({ key: 'widget_agenda', value: JSON.stringify(montarAgenda(evs, categorias)) });

    // Pede aos widgets nativos que se atualizem já (no-op fora do app nativo).
    try { await WidgetBridge.refresh(); } catch { /* web / indisponível */ }
  } catch {
    // Fora do app nativo, ou Preferences indisponível: ignora silenciosamente.
  }
}
