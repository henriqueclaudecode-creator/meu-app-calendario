// Paleta central do app. Agora cada cor aponta para uma variável CSS (com a cor
// clara como fallback), para o app inteiro trocar entre claro e escuro só mudando
// o atributo data-theme na raiz (ver index.css e lib/aparencia.js). Nenhum
// componente precisa saber do tema: continua usando cores.xxx.

const v = (nome, claro) => `var(--cor-${nome}, ${claro})`;

export const cores = {
  bg: v('bg', '#f6f9fd'),
  superficie: v('superficie', '#ffffff'),
  superficie2: v('superficie2', '#f0f5fb'),

  primaria: v('primaria', '#0f2547'),
  primariaSuave: v('primariaSuave', '#1c3a63'),

  acento: v('acento', '#2563eb'),
  acentoForte: v('acentoForte', '#1d4ed8'),
  acentoClaro: v('acentoClaro', '#60a5fa'),
  acentoBg: v('acentoBg', '#eff6ff'),
  // Cor de texto/ícone que fica SOBRE o acento (branco por padrão; escuro nos
  // temas de acento claro, como o Black — senão fica branco sobre cinza claro).
  acentoTexto: v('acentoTexto', '#ffffff'),

  texto: v('texto', '#0f2547'),
  textoSuave: v('textoSuave', '#64748b'),
  textoClaro: v('textoClaro', '#ffffff'),

  borda: v('borda', '#e4ecf6'),
  bordaForte: v('bordaForte', '#cfdcec'),

  textoApagado: v('textoApagado', '#8798ac'),
  textoFraco: v('textoFraco', '#b3bece'),
  pontinho: v('pontinho', '#b6c3d4'),

  grade: v('grade', '#dbe6f3'),

  sucesso: v('sucesso', '#0f9d58'),
  perigo: v('perigo', '#e5484d'),
  atencaoBg: v('atencaoBg', '#fff8e8'),
  atencaoBorda: v('atencaoBorda', '#f3d18a'),
  atencaoTexto: v('atencaoTexto', '#8a5a00'),
};

// Sombras — mantidas com tinta navy (discretas no claro, quase invisíveis no
// escuro, sem atrapalhar).
export const sombraSuave = '0 1px 2px rgba(15, 37, 71, 0.04)';
export const sombra = '0 1px 2px rgba(15, 37, 71, 0.04), 0 4px 14px rgba(15, 37, 71, 0.06)';
export const sombraForte = '0 2px 4px rgba(15, 37, 71, 0.06), 0 12px 28px rgba(15, 37, 71, 0.10)';
export const sombraAcento = '0 4px 14px rgba(37, 99, 235, 0.30)';

// Suaviza uma cor (hex #rrggbb) nos temas escuro e black: as cores dos objetivos
// vêm de uma paleta vibrante fixa (guardada nos dados) e ficam berrantes sobre o
// fundo quase preto. Aqui reduzimos a saturação e ajustamos a luminosidade para
// um tom mais sóbrio, mantendo os objetivos distinguíveis entre si. Nos temas
// claros (light/blossom) devolve a cor original.
function hexParaRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbParaHex(r, g, b) {
  const c = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslParaRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

export function suavizarCor(hex, tema = typeof document !== 'undefined' ? document.documentElement.dataset.theme : '') {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const [h, s, l] = rgbParaHsl(...hexParaRgb(hex));

  // Natureza: a paleta vibrante dos objetivos (azul, roxo...) briga com o verde.
  // Puxamos todas para o verde floresta, variando só a luminosidade pela cor
  // original, para os objetivos continuarem distinguíveis entre si.
  if (tema === 'natureza') {
    return rgbParaHex(...hslParaRgb(0.34, 0.34, Math.min(Math.max(l, 0.28), 0.44)));
  }

  if (tema !== 'dark' && tema !== 'black') return hex;
  const alvo = tema === 'black'
    ? { s: s * 0.30, l: Math.min(Math.max(l, 0.60), 0.72) } // quase cinza, claro o bastante p/ o preto puro
    : { s: s * 0.55, l: Math.min(Math.max(l, 0.48), 0.62) }; // sóbrio mas ainda com cor
  return rgbParaHex(...hslParaRgb(h, alvo.s, alvo.l));
}

export const raio = 12;
export const raioGrande = 16;
export const raioPequeno = 9;

export const transicao = 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease';
