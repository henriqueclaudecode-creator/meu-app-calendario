// Sistema de notificações (lembretes) do app.
//
// Cada evento guarda um campo `lembrete` ('nenhum' | 'no-horario' | '5min' | ...).
// Aqui a gente transforma isso em uma notificação local agendada pelo próprio
// aparelho (via @capacitor/local-notifications) — funciona offline e dispara
// mesmo com o app fechado.
//
// No navegador (dev/PWA sem Capacitor) as funções viram "no-op" seguras, então
// as telas podem chamar sem se preocupar com a plataforma.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NATIVO = Capacitor.isNativePlatform?.() ?? false;

// Quanto tempo ANTES do horário do evento a notificação dispara (em minutos).
const OFFSETS = {
  'no-horario': 0,
  '5min': 5,
  '10min': 10,
  '30min': 30,
  '1h': 60,
  '1d': 24 * 60,
};

// Horário padrão do lembrete para eventos "dia todo" (sem horário de início).
const HORA_DIA_TODO = { h: 9, min: 0 };

// Só age no app nativo; no navegador vira no-op (retorna null).
function plugin() {
  return NATIVO ? LocalNotifications : null;
}

// Gera um id numérico estável (int32 positivo) a partir do id textual do evento.
// O plugin exige ids inteiros; assim o mesmo evento sempre reusa o mesmo id,
// o que permite reagendar/cancelar sem duplicar.
function idNotificacao(eventoId) {
  let h = 0;
  for (let i = 0; i < eventoId.length; i++) {
    h = (h * 31 + eventoId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483000 || 1;
}

// Monta a data/hora em que a notificação deve disparar. Retorna Date ou null
// (quando não há lembrete ou não dá pra calcular).
function calcularDisparo(evento) {
  if (!evento?.lembrete || evento.lembrete === 'nenhum') return null;
  if (!evento.data) return null;

  const [ano, mes, dia] = evento.data.split('-').map(Number);
  let h = HORA_DIA_TODO.h;
  let min = HORA_DIA_TODO.min;
  if (evento.inicio) {
    const [hh, mm] = evento.inicio.split(':').map(Number);
    h = hh; min = mm;
  }

  const base = new Date(ano, mes - 1, dia, h, min, 0, 0);
  const offset = OFFSETS[evento.lembrete] ?? 0;
  return new Date(base.getTime() - offset * 60000);
}

// Repetição do evento -> intervalo nativo do plugin ('day'|'week'|'month'|'year').
// 'personalizado' não tem equivalente direto, então cai como não-repetível.
function intervaloNativo(evento) {
  switch (evento?.repetir) {
    case 'diario': return 'day';
    case 'semanal': return 'week';
    case 'mensal': return 'month';
    case 'anual': return 'year';
    default: return null;
  }
}

// Avança uma data repetível até cair no futuro (para eventos passados que se
// repetem). Mantém o mesmo horário do dia.
function proximaOcorrencia(dataBase, intervalo) {
  const agora = Date.now();
  const d = new Date(dataBase.getTime());
  let guarda = 0;
  while (d.getTime() <= agora && guarda < 1000) {
    if (intervalo === 'day') d.setDate(d.getDate() + 1);
    else if (intervalo === 'week') d.setDate(d.getDate() + 7);
    else if (intervalo === 'month') d.setMonth(d.getMonth() + 1);
    else if (intervalo === 'year') d.setFullYear(d.getFullYear() + 1);
    else break;
    guarda++;
  }
  return d;
}

// Pergunta o estado atual da permissão sem forçar o pop-up.
export async function permissaoConcedida() {
  const p = await plugin();
  if (!p) return false;
  try {
    const { display } = await p.checkPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

// Pede a permissão ao usuário (mostra o pop-up do sistema). Retorna true se ok.
export async function pedirPermissao() {
  const p = await plugin();
  if (!p) return false;
  try {
    let { display } = await p.checkPermissions();
    if (display !== 'granted') {
      ({ display } = await p.requestPermissions());
    }
    return display === 'granted';
  } catch {
    return false;
  }
}

// Versão detalhada do pedido de permissão, para a UI mostrar exatamente o que
// aconteceu (concedida / negada / sem-plugin / erro nativo). Útil para
// diagnosticar por que "não acontece nada" no aparelho.
// Corre uma promessa com tempo-limite, para uma chamada nativa travada não deixar
// o app pendurado sem feedback.
function comLimite(promessa, ms, rotulo) {
  return Promise.race([
    promessa,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`travou em ${rotulo} (${ms / 1000}s)`)), ms)),
  ]);
}

export async function pedirPermissaoDetalhado() {
  const p = plugin();
  if (!p) return { ok: false, motivo: 'sem plugin nativo (navegador/PWA)' };
  try {
    let { display } = await comLimite(p.checkPermissions(), 6000, 'checkPermissions');
    if (display !== 'granted') {
      ({ display } = await comLimite(p.requestPermissions(), 30000, 'requestPermissions'));
    }
    return { ok: display === 'granted', motivo: `permissão: ${display}` };
  } catch (e) {
    return { ok: false, motivo: e?.message || e?.code || String(e) };
  }
}

// Cancela a notificação de um evento (por id textual do evento).
export async function cancelarEvento(eventoId) {
  const p = plugin();
  if (!p || !eventoId) return;
  try {
    await comLimite(p.cancel({ notifications: [{ id: idNotificacao(eventoId) }] }), 5000, 'cancel');
  } catch { /* timeout/erro: não trava o fluxo */ }
}

// Agenda (ou reagenda) a notificação de um evento. Cancela a anterior antes,
// então pode ser chamada em toda criação/edição sem duplicar.
export async function agendarEvento(evento) {
  const p = plugin();
  if (!p || !evento?.id) return;

  // NÃO cancelamos antes: agendar com o mesmo id já substitui a notificação
  // anterior. Cancelar+agendar o mesmo id causava uma race no plugin nativo (o
  // cancelamento assíncrono às vezes apagava o agendamento recém-criado).

  const disparo = calcularDisparo(evento);
  if (!disparo) {
    // Sem lembrete (ou inválido): garante que não fique nada pendente.
    await cancelarEvento(evento.id);
    return;
  }

  const intervalo = intervaloNativo(evento);
  let quando = disparo;
  let repetivel = false;

  if (intervalo) {
    quando = proximaOcorrencia(disparo, intervalo);
    repetivel = true;
  } else if (disparo.getTime() <= Date.now()) {
    // Evento único que já passou: não agenda nada (e limpa o que houver).
    await cancelarEvento(evento.id);
    return;
  }

  const schedule = { at: quando, allowWhileIdle: true };
  if (repetivel) schedule.repeats = true;

  try {
    await comLimite(p.schedule({
      notifications: [{
        id: idNotificacao(evento.id),
        title: evento.titulo || 'Lembrete',
        body: corpoNotificacao(evento),
        schedule,
        extra: { eventoId: evento.id, data: evento.data },
      }],
    }), 5000, 'schedule');
  } catch { /* timeout/erro: pula este e segue os demais */ }
}

function corpoNotificacao(evento) {
  if (evento.inicio) {
    if (evento.lembrete === 'no-horario') return `Começa agora, às ${evento.inicio}.`;
    return `Está chegando — às ${evento.inicio}.`;
  }
  return 'Compromisso de hoje.';
}

// ---------- Aniversário do próprio usuário ----------
// Um agrado grátis (independe de Premium): todo ano, no dia do aniversário, o
// app manda uma notificação local. Id fixo (não vem de evento), para reagendar
// sem duplicar. Recorre anualmente via schedule.on (mês/dia).
const ID_ANIVERSARIO = 2000000001;

export async function cancelarAniversario() {
  const p = await plugin();
  if (!p) return;
  try { await p.cancel({ notifications: [{ id: ID_ANIVERSARIO }] }); } catch { /* silencioso */ }
}

// Agenda (ou reagenda) o lembrete anual de aniversário a partir da data de
// nascimento ('AAAA-MM-DD'). Sem data, apenas cancela o que houver.
export async function agendarAniversario(nascimentoISO) {
  const p = plugin();
  if (!p) return;
  await cancelarAniversario();
  if (!nascimentoISO) return;
  const partes = nascimentoISO.split('-').map(Number);
  const mes = partes[1];
  const dia = partes[2];
  if (!mes || !dia) return;
  try {
    await p.schedule({
      notifications: [{
        id: ID_ANIVERSARIO,
        title: '🎂 Feliz aniversário!',
        body: 'Mais um ano da sua história.',
        schedule: { on: { month: mes, day: dia, hour: 9, minute: 0 }, allowWhileIdle: true },
        extra: { aniversario: true },
      }],
    });
  } catch { /* silencioso */ }
}

// Reagenda TODOS os eventos (usado no início do app e depois de importar dados).
// Cancela tudo que estava pendente e recria a partir da lista atual.
export async function sincronizarTodos(eventos) {
  const p = plugin();
  if (!p) return;
  try {
    const pend = await comLimite(p.getPending(), 5000, 'getPending');
    if (pend?.notifications?.length) {
      await comLimite(p.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) }), 5000, 'cancelAll');
    }
  } catch { /* silencioso */ }

  // Em PARALELO e com tolerância a falha: um evento que trave (timeout interno do
  // agendarEvento) não impede os demais de serem agendados.
  await Promise.allSettled((eventos ?? []).map((ev) => agendarEvento(ev)));
}
