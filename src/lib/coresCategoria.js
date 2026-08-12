// Paleta das etiquetas (categorias criadas pelo usuário). Tons pastel suaves e
// harmônicos (inspirados numa paleta "soft") para identificar os compromissos
// sem pesar no visual. Inclui dois cinzas — um bem escuro (aparece no tema
// escuro/preto) e um cinza neutro.

export const CORES_CATEGORIA = [
  { id: 'sage', nome: 'Verde sálvia', hex: '#9dae6b' },
  { id: 'sereno', nome: 'Azul sereno', hex: '#8db3b4' },
  { id: 'ambar', nome: 'Âmbar', hex: '#edb94e' },
  { id: 'terracota', nome: 'Terracota', hex: '#e38c5a' },
  { id: 'coral', nome: 'Coral', hex: '#e17e8b' },
  { id: 'malva', nome: 'Malva', hex: '#a98cb2' },
  { id: 'aco', nome: 'Azul aço', hex: '#5f7b98' },
  { id: 'areia', nome: 'Areia', hex: '#cdbba0' },
  // Tons mais vibrantes (destaque forte), incluindo um azul vivo.
  { id: 'azul', nome: 'Azul vivo', hex: '#2f6fd6' },
  { id: 'verde', nome: 'Verde vivo', hex: '#22a559' },
  { id: 'vermelho', nome: 'Vermelho vivo', hex: '#e34d4d' },
  { id: 'violeta', nome: 'Violeta vivo', hex: '#8250e0' },
  // Cinzas por último.
  { id: 'chumbo', nome: 'Chumbo', hex: '#454b54' },
  { id: 'cinza', nome: 'Cinza', hex: '#9096a0' },
];

export const COR_PADRAO = CORES_CATEGORIA[0].hex;
