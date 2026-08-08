// Ícones dos períodos do dia (manhã, tarde, noite, madrugada), em traço, no
// estilo da referência: nascer do sol, sol com nuvem, lua com brilho e lua com
// estrelas. A cor vem de quem usa (o badge colorido fica na Agenda).

export function IconePeriodo({ id, tamanho = 16, cor = '#0f2547' }) {
  const comum = {
    width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none',
    stroke: cor, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  if (id === 'manha') {
    // Nascer do sol: meia-cúpula sobre o horizonte, com raios.
    return (
      <svg {...comum}>
        <path d="M7 17a5 5 0 0 1 10 0" />
        <line x1="3" y1="20" x2="21" y2="20" />
        <line x1="12" y1="3" x2="12" y2="6" />
        <line x1="4.6" y1="8.2" x2="6.2" y2="9.6" />
        <line x1="19.4" y1="8.2" x2="17.8" y2="9.6" />
      </svg>
    );
  }

  if (id === 'tarde') {
    // Sol com nuvem.
    return (
      <svg {...comum}>
        <circle cx="8.5" cy="8" r="3" />
        <line x1="8.5" y1="2" x2="8.5" y2="3.3" />
        <line x1="3" y1="8" x2="4.3" y2="8" />
        <line x1="13" y1="8" x2="14.3" y2="8" />
        <line x1="4.6" y1="4.1" x2="5.5" y2="5" />
        <line x1="12.4" y1="4.1" x2="11.5" y2="5" />
        <path d="M8.5 20h8a3.2 3.2 0 0 0 .1-6.4 4.4 4.4 0 0 0-8.4-1A3.3 3.3 0 0 0 8.5 20z" />
      </svg>
    );
  }

  if (id === 'noite') {
    // Lua crescente com um brilho e um pontinho.
    return (
      <svg {...comum}>
        <path d="M20 13.8A7.5 7.5 0 0 1 10.2 4 6 6 0 1 0 20 13.8z" />
        <path d="M18.4 3.2l.55 1.55 1.55.55-1.55.55-.55 1.55-.55-1.55-1.55-.55 1.55-.55z" />
        <circle cx="16.6" cy="10.4" r="0.7" fill={cor} stroke="none" />
      </svg>
    );
  }

  // madrugada: lua crescente com estrelas espalhadas.
  return (
    <svg {...comum}>
      <path d="M20 13.8A7.5 7.5 0 0 1 10.2 4 6 6 0 1 0 20 13.8z" />
      <circle cx="17.8" cy="4.6" r="0.75" fill={cor} stroke="none" />
      <circle cx="20.2" cy="8.6" r="0.55" fill={cor} stroke="none" />
      <circle cx="15" cy="3.4" r="0.5" fill={cor} stroke="none" />
    </svg>
  );
}
