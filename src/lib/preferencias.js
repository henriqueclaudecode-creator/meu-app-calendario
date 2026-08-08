// Preferências locais do app (por enquanto, a localidade dos feriados).
// Guardadas no localStorage; cada tela lê ao montar.

const CHAVE = 'calendario.local';

// { uf?: 'SP', municipio?: '3550308', municipioNome?: 'São Paulo' }
export function lerLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

export function salvarLocal(local) {
  localStorage.setItem(CHAVE, JSON.stringify(local || {}));
}
