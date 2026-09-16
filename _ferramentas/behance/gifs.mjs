// Os GIFs animados dos projetos pesam dezenas de MB no CDN do Behance.
// Este script baixa cada um, converte para MP4 leve (sem áudio, em laço) com
// uma capa WebP, guarda em assets/video/projetos e troca o bloco no
// projetos.json para o tipo "anim". As imagens paradas continuam vindo do CDN.
// Uso: node gifs.mjs
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const req = createRequire('C:/Users/alanl/AppData/Local/Temp/claude/B--Downloads/7ecda43d-84d1-4543-a3b1-35d1dd188279/scratchpad/otimiza/');
const FF = req('ffmpeg-static');
const sharp = req('sharp');

const RAIZ = 'H:/Meu Drive/Design/Minha ID/Site/Nova/';
const DESTINO = RAIZ + 'assets/video/projetos/';
const JSON_PATH = RAIZ + 'assets/dados/projetos.json';
const TMP = 'C:/Users/alanl/AppData/Local/Temp/claude/B--Downloads/7ecda43d-84d1-4543-a3b1-35d1dd188279/scratchpad/gif-tmp/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
mkdirSync(DESTINO, { recursive: true });
mkdirSync(TMP, { recursive: true });

const d = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const ehGif = u => /\.gif(\?|$)/i.test(u);
let n = 0, antes = 0, depois = 0;

async function converte(chave, bloco, indice) {
  const nome = chave + '-' + indice;
  const entrada = TMP + nome + '.gif';
  const buf = Buffer.from(await (await fetch(bloco.u, { headers: { 'user-agent': UA } })).arrayBuffer());
  writeFileSync(entrada, buf);
  antes += buf.length;
  const mp4 = DESTINO + nome + '.mp4', capa = DESTINO + nome + '.webp';
  // largura par, no máximo 1280; H.264 sem áudio, para tocar em laço como um GIF
  execFileSync(FF, ['-v', 'error', '-i', entrada, '-an',
    '-vf', "scale='min(1280,iw)':-2:flags=lanczos,fps=24", '-c:v', 'libx264', '-preset', 'slow',
    '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', mp4]);
  execFileSync(FF, ['-v', 'error', '-i', mp4, '-frames:v', '1', '-y', TMP + nome + '.png']);
  await sharp(TMP + nome + '.png').webp({ quality: 74 }).toFile(capa);
  const tam = statSync(mp4).size;
  depois += tam;
  n++;
  console.log(nome.padEnd(12), (buf.length / 1048576).toFixed(1) + ' MB → ' + (tam / 1048576).toFixed(2) + ' MB');
  return { t: 'anim', u: 'assets/video/projetos/' + nome + '.mp4', capa: 'assets/video/projetos/' + nome + '.webp', p: bloco.p };
}

for (const chave of Object.keys(d)) {
  const blocos = d[chave].blocos;
  for (let i = 0; i < blocos.length; i++) {
    const b = blocos[i];
    if (b.t === 'img' && ehGif(b.u)) blocos[i] = await converte(chave, b, i);
    else if (b.t === 'galeria') {
      for (let j = 0; j < b.itens.length; j++) {
        if (ehGif(b.itens[j].u)) {
          const novo = await converte(chave, b.itens[j], i + '-' + j);
          b.itens[j] = { ...novo, dentroDeGaleria: true };
        }
      }
    }
  }
}
writeFileSync(JSON_PATH, JSON.stringify(d));
console.log('\n' + n + ' animações:', (antes / 1048576).toFixed(1), 'MB →', (depois / 1048576).toFixed(1), 'MB');
