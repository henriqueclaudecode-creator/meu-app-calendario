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

// Carrega o plugin só quando precisa (evita quebrar o build web).
let _plugin = null;
async function plugin() {
  if (!NATIVO) return null;
  if (!_plugin) {
    const mod = await import('@capacitor/local-notifications');
    _plugin = mod.LocalNotifications;
  }
  return _plugin;
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

// Cancela a notificação de um evento (por id textual do evento).
export async function cancelarEvento(eventoId) {
  const p = await plugin();
  if (!p || !eventoId) return;
  try {
    await p.cancel({ notifications: [{ id: idNotificacao(eventoId) }] });
  } catch { /* silencioso */ }
}

// Agenda (ou reagenda) a notificação de um evento. Cancela a anterior antes,
// então pode ser chamada em toda criação/edição sem duplicar.
export async function agendarEvento(evento) {
  const p = await plugin();
  if (!p || !evento?.id) return;

  await cancelarEvento(evento.id);

  const disparo = calcularDisparo(evento);
  if (!disparo) return;

  const intervalo = intervaloNativo(evento);
  let quando = disparo;
  let repetivel = false;

  if (intervalo) {
    quando = proximaOcorrencia(disparo, intervalo);
    repetivel = true;
  } else if (disparo.getTime() <= Date.now()) {
    // Evento único que já passou: não agenda nada.
    return;
  }

  const schedule = { at: quando, allowWhileIdle: true };
  if (repetivel) schedule.repeats = true;

  try {
    await p.schedule({
      notifications: [{
        id: idNotificacao(evento.id),
        title: evento.titulo || 'Lembrete',
        body: corpoNotificacao(evento),
        schedule,
        extra: { eventoId: evento.id, data: evento.data },
      }],
    });
  } catch { /* silencioso */ }
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
  const p = await plugin();
  if (!p) return;
  if (!(await permissaoConcedida())) return;
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
  const p = await plugin();
  if (!p) return;
  if (!(await permissaoConcedida())) return;
  try {
    const pend = await p.getPending();
    if (pend?.notifications?.length) {
      await p.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    }
  } catch { /* silencioso */ }

  for (const ev of eventos ?? []) {
    await agendarEvento(ev);
  }
}
