// Identidade das categorias de evento do Calendário: cor, fundo claro e rótulo.
// Só dados e funções puras aqui; o ícone (que é componente) fica em
// components/EventoCategoria.jsx.

// O `bg` de cada categoria é uma variável CSS (fallback = o pastel claro), para
// no modo escuro virar um tom translúcido (ver index.css). O `cor` é fixo.
// `cor` e `bg` são variáveis CSS (fallback = valores originais claro/escuro), para
// o tema Blossom trocar por tons suaves. Ver index.css.
export const CATEGORIAS = {
  estudo: { cor: 'var(--cat-estudo-cor, #2563eb)', bg: 'var(--cat-estudo-bg, #eff6ff)', rotulo: 'Estudo' },
  simulado: { cor: 'var(--cat-simulado-cor, #f97316)', bg: 'var(--cat-simulado-bg, #fff3e9)', rotulo: 'Simulado' },
  prova: { cor: 'var(--cat-prova-cor, #e5484d)', bg: 'var(--cat-prova-bg, #fdeced)', rotulo: 'Prova' },
  aula: { cor: 'var(--cat-aula-cor, #7c3aed)', bg: 'var(--cat-aula-bg, #f3edfe)', rotulo: 'Aula' },
  revisao: { cor: 'var(--cat-revisao-cor, #9333ea)', bg: 'var(--cat-revisao-bg, #f6ecfe)', rotulo: 'Revisão' },
  evento: { cor: 'var(--cat-evento-cor, #94a3b8)', bg: 'var(--cat-evento-bg, #f1f5f9)', rotulo: 'Evento' },
  meta: { cor: 'var(--cat-meta-cor, #0f9d58)', bg: 'var(--cat-meta-bg, #e7f6ee)', rotulo: 'Meta' },
};

// A legenda do calendário mostra as cinco principais; revisão e meta existem
// para criar, mas não pesam a legenda.
export const ORDEM_LEGENDA = ['estudo', 'simulado', 'prova', 'aula', 'evento'];

// Todas as categorias que o botão + oferece, na ordem do formulário.
export const ORDEM_CRIAR = ['estudo', 'simulado', 'prova', 'aula', 'revisao', 'evento', 'meta'];

export function corDaCategoria(cat) {
  return (CATEGORIAS[cat] ?? CATEGORIAS.evento).cor;
}
