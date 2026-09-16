// Mede quanto pesa cada projeto: pede só o cabeçalho de cada peça no CDN do Behance.
// Uso: node pesa.mjs
import { readFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const d = JSON.parse(readFileSync('H:/Meu Drive/Design/Minha ID/Site/Nova/assets/dados/projetos.json', 'utf8'));

const tamanho = async u => {
  try {
    const r = await fetch(u, { method: 'HEAD', headers: { 'user-agent': UA } });
    return { n: +(r.headers.get('content-length') || 0), tipo: r.headers.get('content-type') };
  } catch { return { n: 0, tipo: '?' }; }
};
const emFila = async (lista, f, largura = 8) => {
  const saida = [];
  let i = 0;
  await Promise.all(Array.from({ length: largura }, async () => {
    while (i < lista.length) { const k = i++; saida[k] = await f(lista[k]); }
  }));
  return saida;
};

let totalGeral = 0;
const pesados = [];
for (const chave of Object.keys(d)) {
  const urls = [];
  for (const b of d[chave].blocos) {
    if (b.t === 'img') urls.push(b.u);
    else if (b.t === 'galeria') b.itens.forEach(i => urls.push(i.u));
  }
  const rs = await emFila(urls, tamanho);
  const total = rs.reduce((s, r) => s + r.n, 0);
  totalGeral += total;
  rs.forEach((r, i) => { if (r.n > 1.5e6) pesados.push([chave, (r.n / 1048576).toFixed(1) + ' MB', r.tipo, urls[i]]); });
  console.log(chave.padEnd(9), urls.length.toString().padStart(3), 'peças', (total / 1048576).toFixed(1).padStart(6) + ' MB',
    'maior ' + (Math.max(...rs.map(r => r.n)) / 1048576).toFixed(1) + ' MB');
}
console.log('TOTAL', (totalGeral / 1048576).toFixed(1), 'MB');
console.log('\nacima de 1,5 MB:');
pesados.forEach(p => console.log(' ', p[0].padEnd(9), p[1].padStart(8), p[2], p[3].slice(48)));
