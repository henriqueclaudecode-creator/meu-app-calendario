// Perfil do próprio usuário — dados leves da vida dele, separados dos
// compromissos e momentos. Guardado no localStorage (custo zero, offline).
//
// Campos:
//   nascimento      'AAAA-MM-DD' | null  — data de nascimento (alimenta o
//                   lembrete de aniversário, mais adiante)
//   cidade          texto | ''           — cidade natal (opcional)
//   onboardingFeito bool                 — true depois que o usuário passa
//                   (ou pula) a primeira abertura; controla o gate no App.

const CHAVE = 'calendario.perfil';

export function lerPerfil() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

export function salvarPerfil(mudancas) {
  const atual = lerPerfil();
  const novo = { ...atual, ...mudancas };
  localStorage.setItem(CHAVE, JSON.stringify(novo));
  return novo;
}

// Já passou pela primeira abertura? (Também é true se o usuário pulou.)
export function onboardingConcluido() {
  return !!lerPerfil().onboardingFeito;
}

export function marcarOnboardingFeito() {
  salvarPerfil({ onboardingFeito: true });
}
