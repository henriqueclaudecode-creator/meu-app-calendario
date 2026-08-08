// Ícone de um objetivo, no traço do app. A cor vem do próprio objetivo.

export const ICONES_OBJETIVO = ['predio', 'livro', 'balanca', 'alvo'];

export function ObjetivoIcone({ icone = 'alvo', tamanho = 26, cor = '#fff' }) {
  const comum = {
    width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (icone === 'predio') {
    return (
      <svg {...comum}>
        <path d="M3 21h18M4 21V10l8-5 8 5v11" />
        <path d="M9 21v-6h6v6M8 10v0M12 10v0M16 10v0" />
      </svg>
    );
  }
  if (icone === 'livro') {
    return (
      <svg {...comum}>
        <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" />
        <path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (icone === 'balanca') {
    return (
      <svg {...comum}>
        <path d="M12 3v18M7 21h10M5 7h14M12 3l-7 4 2.5 5a2.5 2.5 0 0 1-5 0L9 7M12 3l7 4-2.5 5a2.5 2.5 0 0 0 5 0L15 7" />
      </svg>
    );
  }
  // alvo
  return (
    <svg {...comum}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.7" fill={cor} stroke="none" />
    </svg>
  );
}
