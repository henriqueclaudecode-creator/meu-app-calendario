// Conjunto de ícones das etiquetas, no traço do app. Cada ícone é só o conteúdo
// interno de um <svg> (24x24). Renderize com <IconeCat id="livro" .../>.
// A lista ICONES_CATEGORIA define a ordem que aparece no seletor.

export const ICONES_CATEGORIA = [
  'livro', 'trabalho', 'casa', 'coracao', 'academia', 'carro',
  'compras', 'formatura', 'aviao', 'pet', 'musica', 'estrela',
  'bandeira', 'calendario', 'cafe', 'planta', 'financeiro', 'lazer',
];

const DESENHOS = {
  livro: <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" />,
  trabalho: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" /></>,
  casa: <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" />,
  coracao: <path d="M12 20s-7-4.3-9.2-8.4A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.2 5.6C19 15.7 12 20 12 20z" />,
  academia: <path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" />,
  carro: <><path d="M3 12l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 7l2 5v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M6.5 15h.01M17.5 15h.01M3 12h18" /></>,
  compras: <path d="M4 6h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7zM9 10a3 3 0 0 0 6 0" />,
  formatura: <path d="M12 4L2 9l10 5 10-5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />,
  aviao: <path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4.2v2.3L13.5 13v4l2 1.5V20L12 19l-3.5 1v-1.5L10.5 17v-4L3.5 15.5v-2.3L10.5 9z" />,
  pet: <><circle cx="6.5" cy="10" r="1.6" /><circle cx="10.5" cy="6.5" r="1.6" /><circle cx="14.5" cy="6.5" r="1.6" /><circle cx="18" cy="10" r="1.6" /><path d="M8 16.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5c0 1.6-1.3 2.7-4 2.7s-4-1.1-4-2.7z" /></>,
  musica: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>,
  estrela: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8-4.3-4.1 5.9-.9z" />,
  bandeira: <path d="M5 21V4M5 4h11l-1.5 4L16 12H5" />,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  cafe: <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2" />,
  planta: <path d="M12 21v-8M12 13c0-3-2.5-5-6-5 0 3.5 2.5 5 6 5zM12 12c0-3.5 2.5-6 6-6 0 4-2.5 6-6 6z" />,
  financeiro: <><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.2c-.6-.8-1.6-1.2-2.7-1.2-1.6 0-2.8.9-2.8 2.1 0 3 5.6 1.5 5.6 4.2 0 1.3-1.3 2.2-3 2.2-1.3 0-2.4-.5-3-1.4M12 6v2M12 16v2" /></>,
  lazer: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M12 12l4.5-4.5" /></>,
  bolo: <><path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M4 16c1.2 0 1.2 1 2.4 1s1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1M12 12V8" /><circle cx="12" cy="5.5" r="1" /></>,
};

export function IconeCat({ id = 'livro', tamanho = 22, cor = 'currentColor', strokeWidth = 1.9 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {DESENHOS[id] ?? DESENHOS.livro}
    </svg>
  );
}
