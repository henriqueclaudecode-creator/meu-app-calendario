// Tema de aparência: 'light' (Padrão), 'dark' (Escuro), 'blossom' (feminino),
// 'black' (preto absoluto, monocromático premium) ou 'natureza' (verde floresta).
// Guardado no localStorage e aplicado como data-theme na raiz — o CSS faz o resto.

const CHAVE = 'calendario.tema';
const VALIDOS = ['light', 'dark', 'blossom', 'black', 'natureza',
  'musgo', 'oceano', 'rose', 'areia'];

export function lerTema() {
  const v = localStorage.getItem(CHAVE);
  if (v === 'escuro') return 'dark'; // compatibilidade com valor antigo
  if (v === 'claro' || v === 'padrao') return 'light';
  return VALIDOS.includes(v) ? v : 'light';
}

export function aplicarTema(tema) {
  document.documentElement.dataset.theme = VALIDOS.includes(tema) ? tema : 'light';
}

export function salvarTema(tema) {
  localStorage.setItem(CHAVE, tema);
  aplicarTema(tema);
}
