// Paleta das etiquetas (categorias criadas pelo usuário). Só tons terrosos e
// dessaturados, para combinar com a identidade do app — nada de neon, rosa
// choque ou amarelo canário. Servem apenas como identificação visual discreta.

export const CORES_CATEGORIA = [
  { id: 'marrom', nome: 'Marrom café', hex: '#8c6a43' },
  { id: 'petroleo', nome: 'Azul petróleo', hex: '#35576b' },
  { id: 'oliva', nome: 'Verde oliva', hex: '#4c5d38' },
  { id: 'terracota', nome: 'Terracota', hex: '#b0563c' },
  { id: 'dourado', nome: 'Dourado fosco', hex: '#bf9540' },
  { id: 'teal', nome: 'Verde petróleo', hex: '#2f6b6b' },
  { id: 'vinho', nome: 'Vinho escuro', hex: '#7c3143' },
  { id: 'grafite', nome: 'Grafite', hex: '#5b6472' },
];

export const COR_PADRAO = CORES_CATEGORIA[0].hex;
