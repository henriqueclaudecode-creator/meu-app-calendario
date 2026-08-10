// Momentos de Vida — os marcos da trajetória do usuário (nascimento, casamento,
// primeiro emprego, formatura, viagens…). São diferentes dos compromissos do
// calendário: não têm horário nem lembrete, e aparecem em DESTAQUE na Minha
// História (e, mais adiante, no Mapa da Vida).
//
// Versão LOCAL: ficam no localStorage do próprio aparelho. Sem foto, sem local,
// sem anexo — só texto, então ocupam pouquíssimo espaço. A interface (listar/
// criar/atualizar/deletar) é a mesma que o resto do app espera, então dá para
// trocar por uma camada de nuvem depois (sincronização com login) sem mexer nas
// telas.

const CHAVE = 'calendario.momentos';

function lerTudo() {
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? JSON.parse(cru) : [];
  } catch {
    return [];
  }
}

function gravarTudo(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

function novoId() {
  return `mom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Cria um momento. Campos:
//   titulo    texto (obrigatório) — 'Casamento'
//   data      'AAAA-MM-DD' (obrigatório)
//   categoria id de CATEGORIAS_MOMENTO ('familia', 'estudos'…)
//   descricao texto livre (opcional)
export async function criarMomento(dados) {
  const lista = lerTudo();
  const momento = {
    id: novoId(),
    titulo: dados.titulo,
    data: dados.data,
    categoria: dados.categoria ?? 'outro',
    descricao: dados.descricao ?? '',
    criado_em: Date.now(),
  };
  lista.push(momento);
  gravarTudo(lista);
  return momento.id;
}

export async function listarMomentos() {
  return lerTudo();
}

export async function atualizarMomento(id, mudancas) {
  const lista = lerTudo();
  const i = lista.findIndex((m) => m.id === id);
  if (i !== -1) {
    lista[i] = { ...lista[i], ...mudancas, atualizado_em: Date.now() };
    gravarTudo(lista);
  }
}

export async function deletarMomento(id) {
  gravarTudo(lerTudo().filter((m) => m.id !== id));
}

// Substitui a lista inteira de uma vez (usado pela sincronização com a nuvem
// após mesclar local + remoto). Não dispara efeitos colaterais.
export async function substituirMomentos(lista) {
  gravarTudo(Array.isArray(lista) ? lista : []);
}
