// Eventos do Calendário (estudos, simulados, provas, aulas, revisões, metas).
//
// Versão LOCAL: os eventos ficam no localStorage do próprio aparelho. Sem login,
// sem nuvem, funciona offline. A interface é a mesma que o resto do app espera
// (listarEventos, criarEvento, atualizarEvento, deletarEvento), então dá para
// trocar por uma camada de nuvem depois sem mexer nas telas.

import { agendarEvento, cancelarEvento } from '../lib/notificacoes';

const CHAVE = 'calendario.eventos';

function lerTudo() {
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? JSON.parse(cru) : [];
  } catch {
    return [];
  }
}

function gravarTudo(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch (e) {
    // Ex.: QuotaExceeded (fotos grandes). Sem isto, uma gravação falha em
    // silêncio e a exclusão/edição "não pega" (o item reaparece ao recarregar).
    console.error('[eventos] falha ao gravar no localStorage:', e?.name || e);
    throw e;
  }
}

function novoId() {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Cria um compromisso. Campos:
//   data        'AAAA-MM-DD' (obrigatório)
//   categoriaId id da etiqueta (opcional — 'sem etiqueta')
//   titulo      texto
//   inicio      'HH:MM' (opcional) — sem horário, é "o dia todo"
//   fim         'HH:MM' (opcional)
//   lembrete    'nenhum' | 'no-horario' | '5min' | '10min' | '30min' | '1h' | '1d'
//   notas       texto livre (opcional)
// Monta o objeto de evento a partir dos dados do formulário, com uma data
// específica (usada tanto na criação simples quanto na duplicação em vários dias).
function montarEvento(dados, data) {
  return {
    id: novoId(),
    data,
    categoriaId: dados.categoriaId ?? null,
    titulo: dados.titulo,
    // Tipo: 'compromisso' (padrão) | 'evento' | 'aniversario'. Eventos têm
    // campos extras (participantes, local, anexos).
    tipo: dados.tipo ?? 'compromisso',
    inicio: dados.inicio ?? null,
    fim: dados.fim ?? null,
    lembrete: dados.lembrete ?? '10min',
    notas: dados.notas ?? '',
    favorito: dados.favorito ?? false,
    // Repetição: 'nao' | 'diario' | 'semanal' | 'mensal' | 'anual' | 'personalizado'.
    // Quando 'personalizado', usa repetirCada (nº) + repetirUnidade ('dias'|'semanas'|'meses'|'anos').
    repetir: dados.repetir ?? 'nao',
    repetirCada: dados.repetirCada ?? 1,
    repetirUnidade: dados.repetirUnidade ?? 'semanas',
    // Datas 'AAAA-MM-DD' onde uma ocorrência do repetido foi excluída avulsa.
    datasExcluidas: dados.datasExcluidas ?? [],
    // Vínculo dos que foram criados juntos ("criar em vários dias"). Mesmo grupoId
    // = mesma leva; permite excluir todos de uma vez. null = criado sozinho.
    grupoId: dados.grupoId ?? null,
    // Cor escolhida para o evento (sobrepõe a cor da etiqueta). null = usa a etiqueta.
    cor: dados.cor ?? null,
    // Campos extras de "Evento" (opcionais).
    participantes: dados.participantes ?? [], // lista de e-mails de convidados
    local: dados.local ?? null,               // { nome, endereco, cidade, lat, lng } | null
    anexos: dados.anexos ?? [],               // lista de { nome, tipo, url|dados }
    // Campos extras de "Aniversário" (quando tipo === 'aniversario').
    anoNascimento: dados.anoNascimento ?? null, // número ou null ("não sei o ano")
    grupo: dados.grupo ?? null,                 // 'familia' | 'amigos' | 'trabalho' | 'parceiro' | 'outro'
    foto: dados.foto ?? null,                   // dataURL da foto | null
    lembretes: dados.lembretes ?? null,         // [{ quando, hora }] (aniversário)
    exibirNaAgenda: dados.exibirNaAgenda ?? true,
    criado_em: Date.now(),
  };
}

export async function criarEvento(dados) {
  const lista = lerTudo();
  const evento = montarEvento(dados, dados.data);
  lista.push(evento);
  gravarTudo(lista);
  agendarEvento(evento);
  return evento.id;
}

// Cria uma cópia do compromisso em cada uma das datas informadas.
// Retorna os ids criados. Não herda o "favorito". Todas as cópias recebem o
// mesmo grupoId (quando há mais de uma data), permitindo excluir a leva inteira.
export async function criarEventoEmDatas(dados, datas) {
  const lista = lerTudo();
  const ids = [];
  const grupoId = datas.length > 1 ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null;
  for (const data of datas) {
    const evento = montarEvento({ ...dados, favorito: false, grupoId }, data);
    lista.push(evento);
    agendarEvento(evento);
    ids.push(evento.id);
  }
  gravarTudo(lista);
  return ids;
}

// Exclui a leva inteira criada junto (mesmo grupoId).
export async function deletarGrupo(grupoId) {
  if (!grupoId) return;
  const lista = lerTudo();
  for (const e of lista) if (e.grupoId === grupoId) cancelarEvento(e.id);
  gravarTudo(lista.filter((e) => e.grupoId !== grupoId));
}

// Exclui apenas UMA ocorrência de um evento repetido (marca a data como excluída).
export async function excluirOcorrencia(id, dataIso) {
  const lista = lerTudo();
  const i = lista.findIndex((e) => e.id === id);
  if (i === -1) return;
  const atuais = lista[i].datasExcluidas ?? [];
  if (!atuais.includes(dataIso)) {
    lista[i] = { ...lista[i], datasExcluidas: [...atuais, dataIso] };
    gravarTudo(lista);
  }
}

export async function listarEventos() {
  return lerTudo();
}

// Máximo de eventos que podem ser favoritados ao mesmo tempo.
export const MAX_FAVORITOS = 4;

// Conta quantos eventos estão marcados como favoritos hoje.
export async function contarFavoritos() {
  return lerTudo().filter((e) => e.favorito).length;
}

export async function atualizarEvento(id, mudancas) {
  const lista = lerTudo();
  const i = lista.findIndex((e) => e.id === id);
  if (i !== -1) {
    lista[i] = { ...lista[i], ...mudancas, atualizado_em: Date.now() };
    gravarTudo(lista);
    agendarEvento(lista[i]);
  }
}

// Substitui a lista inteira de uma vez (usado pela sincronização com a nuvem
// após mesclar local + remoto). Quem chama cuida de reagendar as notificações.
export async function substituirEventos(lista) {
  gravarTudo(Array.isArray(lista) ? lista : []);
}

export async function deletarEvento(id) {
  gravarTudo(lerTudo().filter((e) => e.id !== id));
  cancelarEvento(id);
}
