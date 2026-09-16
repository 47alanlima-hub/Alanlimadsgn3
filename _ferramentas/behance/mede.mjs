// A proporção que o Behance declara em cada módulo é só um espaço de exibição
// (muitas vezes 2:1) e não a da imagem: com ela, as peças largas e baixas saíam
// esticadas. Este script mede cada peça de verdade e corrige o projetos.json.
// Uso: node mede.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const req = createRequire('C:/Users/alanl/AppData/Local/Temp/claude/B--Downloads/7ecda43d-84d1-4543-a3b1-35d1dd188279/scratchpad/otimiza/');
const sharp = req('sharp');

const RAIZ = 'H:/Meu Drive/Design/Minha ID/Site/Nova/';
const JSON_PATH = RAIZ + 'assets/dados/projetos.json';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const d = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

async function medida(b) {
  try {
    if (b.t === 'anim') {                       // mede a capa do vídeo, que tem o mesmo quadro
      const capa = RAIZ + b.capa;
      if (!existsSync(capa)) return null;
      const m = await sharp(capa).metadata();
      return [m.width, m.height];
    }
    const buf = Buffer.from(await (await fetch(b.u, { headers: { 'user-agent': UA } })).arrayBuffer());
    const m = await sharp(buf).metadata();
    return m.width && m.height ? [m.width, m.height] : null;
  } catch { return null; }
}

const fila = [];
for (const chave of Object.keys(d)) {
  for (const b of d[chave].blocos) {
    if (b.t === 'img' || b.t === 'anim') fila.push([chave, b]);
    else if (b.t === 'galeria') b.itens.forEach(i => fila.push([chave, i]));
  }
}

let i = 0, trocadas = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < fila.length) {
    const [chave, b] = fila[i++];
    const p = await medida(b);
    if (!p) continue;
    const antes = b.p ? b.p[0] / b.p[1] : 0, agora = p[0] / p[1];
    if (!b.p || Math.abs(agora - antes) / agora > 0.01) {
      if (b.p) {
        trocadas++;
        console.log(chave.padEnd(9), b.p.join('x').padEnd(11), '→', p.join('x'),
          Math.abs(agora - antes) / agora > 0.25 ? '  (estava bem errada)' : '');
      }
      b.p = p;
    }
  }
}));

writeFileSync(JSON_PATH, JSON.stringify(d));
console.log('\n' + fila.length, 'peças medidas,', trocadas, 'proporções corrigidas');
