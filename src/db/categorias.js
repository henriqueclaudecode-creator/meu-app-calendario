// Etiquetas (categorias criadas pelo usuário). Servem só para organizar os
// compromissos visualmente — não criam telas nem menus. Guardadas no
// localStorage, mesma interface de listar/criar/atualizar/deletar dos eventos.
//
// Campos de uma etiqueta:
//   id        gerado
//   nome      'Estudos'
//   icone     id de IconeCat ('livro', 'trabalho'...)
//   cor       hex terroso (ver lib/coresCategoria)
//   criado_em timestamp

import { COR_PADRAO } from '../lib/coresCategoria';

const CHAVE = 'calendario.categorias';

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
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listarCategorias() {
  return lerTudo();
}

// Versão síncrona: útil para telas que já têm a lista em mãos e só querem
// resolver o id → etiqueta (cor/ícone) sem async.
export function lerCategoriasSync() {
  return lerTudo();
}

export async function criarCategoria(dados) {
  const lista = lerTudo();
  const categoria = {
    id: novoId(),
    nome: dados.nome,
    icone: dados.icone ?? 'livro',
    cor: dados.cor ?? COR_PADRAO,
    criado_em: Date.now(),
  };
  lista.push(categoria);
  gravarTudo(lista);
  return categoria;
}

export async function atualizarCategoria(id, mudancas) {
  const lista = lerTudo();
  const i = lista.findIndex((c) => c.id === id);
  if (i !== -1) {
    lista[i] = { ...lista[i], ...mudancas, atualizado_em: Date.now() };
    gravarTudo(lista);
  }
}

export async function deletarCategoria(id) {
  gravarTudo(lerTudo().filter((c) => c.id !== id));
}

// Substitui a lista inteira de uma vez (usado pela sincronização com a nuvem).
export async function substituirCategorias(lista) {
  gravarTudo(Array.isArray(lista) ? lista : []);
}

// Resolve uma etiqueta pelo id a partir de uma lista já carregada (ou do
// storage). Devolve null se não existir (compromisso "sem etiqueta").
export function acharCategoria(id, lista) {
  if (!id) return null;
  const fonte = lista ?? lerTudo();
  return fonte.find((c) => c.id === id) ?? null;
}
