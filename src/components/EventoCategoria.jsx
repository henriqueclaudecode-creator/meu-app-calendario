// Ícone de cada categoria de evento, no traço do app. Os dados das categorias
// (cor, rótulo) ficam em lib/eventoCategorias.js.

import { corDaCategoria } from '../lib/eventoCategorias';

export function IconeCategoria({ categoria, tamanho = 18, cor: corProp }) {
  const cor = corProp ?? corDaCategoria(categoria);
  const comum = {
    width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (categoria === 'simulado') {
    return (
      <svg {...comum}>
        <rect x="5" y="3" width="14" height="18" rx="2.5" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }
  if (categoria === 'prova') {
    return (
      <svg {...comum}>
        <path d="M3 21h18M5 21V10l7-4 7 4v11M9 21v-5h6v5" />
      </svg>
    );
  }
  if (categoria === 'aula') {
    return (
      <svg {...comum}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M10.5 21a1.8 1.8 0 0 0 3 0" />
      </svg>
    );
  }
  if (categoria === 'revisao') {
    return (
      <svg {...comum}>
        <path d="M3 5.5v5.2h5.2" />
        <path d="M5.6 15a7.5 7.5 0 1 0 .9-7.1L3 10.7" />
      </svg>
    );
  }
  if (categoria === 'meta') {
    return (
      <svg {...comum}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.6" fill={cor} stroke="none" />
      </svg>
    );
  }
  if (categoria === 'evento') {
    return (
      <svg {...comum}>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  // estudo (livro)
  return (
    <svg {...comum}>
      <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" />
      <path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" />
    </svg>
  );
}
