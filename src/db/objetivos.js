// Objetivos do estudante (concursos, exames, metas).
//
// Cada objetivo é uma meta com data de prova e um progresso. Guardados no
// localStorage, mesma interface de listar/criar/atualizar/deletar dos eventos,
// para dar para migrar para nuvem depois sem mexer nas telas.
//
// Campos:
//   id           gerado
//   titulo       'Câmara dos Deputados'
//   subtitulo    'Analista Legislativo'
//   dataProva    'AAAA-MM-DD' (obrigatório)
//   cor / bg     identidade visual (do seletor de cores)
//   icone        'predio' | 'livro' | 'balanca' | 'alvo'
//   rotuloDisc   'Disciplinas' | 'Áreas'
//   disciplinas  número
//   eventos      número
//   simulados    número
//   progresso    0–100
//   principal    destaca no topo
//   arquivado    some da lista principal

const CHAVE = 'calendario.objetivos';

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
  return `ob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listarObjetivos() {
  return lerTudo();
}

export async function criarObjetivo(dados) {
  const lista = lerTudo();
  const objetivo = {
    id: novoId(),
    titulo: dados.titulo,
    subtitulo: dados.subtitulo ?? '',
    dataProva: dados.dataProva,
    cor: dados.cor ?? '#2563eb',
    bg: dados.bg ?? '#eff6ff',
    icone: dados.icone ?? 'alvo',
    rotuloDisc: dados.rotuloDisc ?? 'Disciplinas',
    disciplinas: Number(dados.disciplinas) || 0,
    eventos: Number(dados.eventos) || 0,
    simulados: Number(dados.simulados) || 0,
    progresso: Number(dados.progresso) || 0,
    principal: !!dados.principal,
    arquivado: false,
    criado_em: Date.now(),
  };
  const lista2 = objetivo.principal ? lista.map((o) => ({ ...o, principal: false })) : lista;
  lista2.push(objetivo);
  gravarTudo(lista2);
  return objetivo.id;
}

export async function atualizarObjetivo(id, mudancas) {
  let lista = lerTudo();
  // Só um objetivo pode ser o principal.
  if (mudancas.principal) {
    lista = lista.map((o) => ({ ...o, principal: false }));
  }
  const i = lista.findIndex((o) => o.id === id);
  if (i !== -1) {
    lista[i] = { ...lista[i], ...mudancas, atualizado_em: Date.now() };
    gravarTudo(lista);
  }
}

export async function deletarObjetivo(id) {
  gravarTudo(lerTudo().filter((o) => o.id !== id));
}

// Substitui a lista inteira de uma vez (usado pela sincronização com a nuvem).
export async function substituirObjetivos(lista) {
  gravarTudo(Array.isArray(lista) ? lista : []);
}
