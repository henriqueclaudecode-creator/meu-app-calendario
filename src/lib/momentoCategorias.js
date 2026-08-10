// Categorias FIXAS dos Momentos de Vida.
//
// Diferente das etiquetas do calendário (db/categorias.js, criadas pelo usuário
// para organizar compromissos), estas são um conjunto fechado que classifica os
// marcos da trajetória de vida — casamento, formatura, primeiro emprego… O
// usuário não cria nem edita: só escolhe uma ao registrar um momento.
//
// Cada categoria reaproveita um ícone de IconeCat e uma cor terrosa da paleta
// do app (lib/coresCategoria).

export const CATEGORIAS_MOMENTO = [
  { id: 'familia',    nome: 'Família',            icone: 'coracao',   cor: '#b0563c' }, // terracota
  { id: 'estudos',    nome: 'Estudos',            icone: 'formatura', cor: '#35576b' }, // petróleo
  { id: 'carreira',   nome: 'Carreira',           icone: 'trabalho',  cor: '#8c6a43' }, // marrom
  { id: 'conquistas', nome: 'Conquistas',         icone: 'casa',      cor: '#bf9540' }, // dourado
  { id: 'viagens',    nome: 'Viagens e lugares',  icone: 'aviao',     cor: '#2f6b6b' }, // teal
  { id: 'outro',      nome: 'Outro',              icone: 'estrela',   cor: '#5b6472' }, // grafite
];

export const CATEGORIA_MOMENTO_PADRAO = 'outro';

// Resolve o id de categoria → objeto (cor/ícone/nome). Devolve a categoria
// "outro" como fallback, para nunca quebrar a renderização.
export function acharCategoriaMomento(id) {
  return CATEGORIAS_MOMENTO.find((c) => c.id === id)
    ?? CATEGORIAS_MOMENTO.find((c) => c.id === CATEGORIA_MOMENTO_PADRAO);
}
