// Ícone do Orbi — anel com um ponto orbitando (como no logotipo). Cores fixas
// (anel navy + ponto azul) porque ele mora num "quadradinho" branco, igual a um
// ícone de app, e fica igual em todos os temas.

export function IconeOrbi({ tamanho = 40 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="23" cy="25" r="13.5" fill="none" stroke="#0f2547" strokeWidth="3" />
      <circle cx="33.4" cy="15.6" r="5" fill="#2563eb" />
    </svg>
  );
}
