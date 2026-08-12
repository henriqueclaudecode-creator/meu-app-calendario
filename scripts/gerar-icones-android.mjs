// Regera os ícones de launcher do Android a partir do ícone limpo full-bleed
// (public/512x512.png). Corrige o problema de estarem com o ícone padrão do
// Capacitor (o "X" azul) e o artefato da versão com margem.
//
// Gera, para cada densidade:
//   - ic_launcher.png / ic_launcher_round.png  (ícone legado, Android 7)
//   - ic_launcher_foreground.png               (camada da adaptive icon, Android 8+)
//
// O fundo da adaptive icon é branco (values/ic_launcher_background.xml). Para a
// camada de frente, o calendário é reduzido para caber na "zona de segurança"
// (centro ~72%) e nunca ser cortado pela máscara do launcher.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fonte = resolve(raiz, 'public/512x512.png');
const resDir = resolve(raiz, 'android/app/src/main/res');

const densidades = {
  mdpi: { legado: 48, fg: 108 },
  hdpi: { legado: 72, fg: 162 },
  xhdpi: { legado: 96, fg: 216 },
  xxhdpi: { legado: 144, fg: 324 },
  xxxhdpi: { legado: 192, fg: 432 },
};

const ESCALA_FG = 0.60; // quanto do canvas o calendário ocupa (zona segura — menor p/ não cortar)

for (const [dens, { legado, fg }] of Object.entries(densidades)) {
  const dir = resolve(resDir, `mipmap-${dens}`);
  await mkdir(dir, { recursive: true });

  // Ícone legado (full-bleed) e a versão "round" — a fonte já tem cantos
  // arredondados/transparentes, então o launcher antigo mostra bonito.
  const legadoPng = await sharp(fonte).resize(legado, legado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp(legadoPng).toFile(resolve(dir, 'ic_launcher.png'));
  await sharp(legadoPng).toFile(resolve(dir, 'ic_launcher_round.png'));

  // Camada de frente da adaptive icon: calendário centralizado na zona segura,
  // sobre canvas transparente (o fundo branco vem do recurso de cor).
  const conteudo = Math.round(fg * ESCALA_FG);
  const calendario = await sharp(fonte).resize(conteudo, conteudo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: fg, height: fg, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: calendario, gravity: 'center' }])
    .png()
    .toFile(resolve(dir, 'ic_launcher_foreground.png'));

  console.log(`${dens}: legado ${legado}px, foreground ${fg}px (conteúdo ${conteudo}px)`);
}

console.log('Ícones do Android regenerados a partir de public/512x512.png');
