// Marcador "clean" de recurso Premium — um diamante em contorno. Substitui as
// antigas estrelinhas (✨). Usa currentColor, então herda a cor de onde for
// colocado (basta definir `color` no elemento pai ou passar `cor`).

export function IconePro({ tamanho = 14, cor = 'currentColor', preenchido = false }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? cor : 'none'}
      stroke={cor}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9l3-5h8l3 5-7 11L5 9z" />
      <path d="M5 9h14M9.5 4 8 9l4 11 4-11-1.5-5" />
    </svg>
  );
}

export default IconePro;
