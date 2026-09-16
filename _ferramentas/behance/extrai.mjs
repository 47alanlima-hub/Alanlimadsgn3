// Lê as páginas públicas dos projetos do Behance e escreve assets/dados/projetos.json,
// com as peças de cada projeto em ordem (imagens, galerias, textos e vídeos).
// As imagens ficam apontando para o CDN do Behance — nada é copiado para o site.
// Uso: node extrai.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const SAIDA = 'H:/Meu Drive/Design/Minha ID/Site/Nova/assets/dados/projetos.json';

const PROJETOS = [
  ['acampa', 'https://www.behance.net/gallery/196926601/Acampa-2024-Incendeia-me-com-seu-fogo'],
  ['mahrte', 'https://www.behance.net/gallery/194190413/Mahrte-Racing-Team-Identidade-Visual'],
  ['galante', 'https://www.behance.net/gallery/231429431/GALANTE-CERVEJARIA-Identidade-Visual'],
  ['connect', 'https://www.behance.net/gallery/225361699/Connect-Energia-Solar-Identidade-Visual'],
  ['mtz', 'https://www.behance.net/gallery/241688325/MTZ-IDENTIDADE-VISUAL'],
  ['baldan', 'https://www.behance.net/gallery/250784707/MATHEUS-BALDAN-PERFORMANCE-Identidade-visual'],
];

// recorta o objeto JSON do projeto de dentro da página
function objetoDoProjeto(html) {
  const marca = html.indexOf('"modules":');
  if (marca < 0) throw new Error('não achei os módulos');
  let ini = marca, prof = 0;
  for (let i = marca; i >= 0; i--) {
    if (html[i] === '}') prof++;
    else if (html[i] === '{') { if (prof === 0) { ini = i; break; } prof--; }
  }
  let nivel = 0, dentroTexto = false, escapa = false, fim = ini;
  for (let i = ini; i < html.length; i++) {
    const c = html[i];
    if (escapa) { escapa = false; continue; }
    if (c === '\\') { escapa = true; continue; }
    if (c === '"') dentroTexto = !dentroTexto;
    if (dentroTexto) continue;
    if (c === '{') nivel++;
    else if (c === '}') { nivel--; if (nivel === 0) { fim = i + 1; break; } }
  }
  return JSON.parse(html.slice(ini, fim));
}

// a maior versão em WebP até 1600px de largura (o CDN entrega webp com o mesmo nome .jpg)
function melhorImagem(imageSizes) {
  if (!imageSizes) return null;
  const todas = (imageSizes.allAvailable || []).filter(s => s.url);
  const webp = todas.filter(s => s.type === 'WEBP' && s.width);
  const escolhe = lista => lista.filter(s => s.width <= 1600).sort((a, b) => b.width - a.width)[0]
    || lista.sort((a, b) => a.width - b.width)[0];
  const w = webp.length ? escolhe(webp) : null;
  if (w) return { u: w.url, w: w.width, h: w.height || 0 };
  const url = imageSizes.size_1400?.url || imageSizes.size_max_1200?.url || imageSizes.size_disp?.url;
  return url ? { u: url, w: 1400, h: 0 } : null;
}

// o texto vem como HTML do editor do Behance; vira uma lista de parágrafos limpos
function paragrafos(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .split('\n').map(s => s.trim()).filter(Boolean);
}

const player = embed => (String(embed || '').match(/src="([^"]+)"/) || [])[1] || null;

// largura/altura para a proporção do lugar da imagem (arredondada, só para o CSS)
function proporcao(mod, img) {
  const w = mod.width || img.w, h = mod.height || img.h;
  if (!w || !h) return null;
  return [Math.round(w), Math.round(h)];
}

const saida = {};
for (const [chave, url] of PROJETOS) {
  const html = await (await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9' } })).text();
  const p = objetoDoProjeto(html);
  const blocos = [];
  for (const m of p.modules || []) {
    const tipo = m.type || m.__typename;
    if (tipo === 'ImageModule') {
      const img = melhorImagem(m.imageSizes);
      // proporção vinda do próprio módulo: evita a página pular enquanto as imagens chegam
      if (img) blocos.push({ t: 'img', ...img, p: proporcao(m, img), larga: !!m.fullBleed, alt: m.altText || '' });
    } else if (tipo === 'MediaCollectionModule') {
      const itens = (m.components || []).map(c => {
        const i = melhorImagem(c.imageSizes);
        return i && { ...i, p: proporcao(c, i) };
      }).filter(Boolean);
      if (itens.length) blocos.push({ t: 'galeria', itens });
    } else if (tipo === 'TextModule') {
      const ps = paragrafos(m.text);
      if (ps.length) blocos.push({ t: 'txt', ps });
    } else if (tipo === 'VideoModule') {
      const src = player(m.embed);
      if (src) blocos.push({ t: 'video', u: src, w: m.width || 1200, h: m.height || 675 });
    } else if (tipo === 'EmbedModule') {
      const src = player(m.embed || m.originalEmbed);
      if (src) blocos.push({ t: 'video', u: src, w: m.width || 1200, h: m.height || 675 });
    }
  }
  saida[chave] = { nome: p.name, url, blocos };
  const conta = blocos.reduce((c, b) => (c[b.t] = (c[b.t] || 0) + (b.t === 'galeria' ? b.itens.length : 1), c), {});
  console.log(chave.padEnd(9), JSON.stringify(conta));
}

mkdirSync(SAIDA.replace(/\/[^/]+$/, ''), { recursive: true });
const texto = JSON.stringify(saida);
writeFileSync(SAIDA, texto);
console.log('escrito', SAIDA, (texto.length / 1024).toFixed(1) + ' KB');
console.log('ATENÇÃO: as animações (GIFs) precisam do gifs.mjs depois desta extração,');
console.log('senão os blocos voltam a apontar para os GIFs gigantes do Behance.');
