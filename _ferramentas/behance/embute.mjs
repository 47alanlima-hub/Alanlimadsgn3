// Copia assets/dados/projetos.json para dentro do index.html, no
// <script id="dadosProjetos">. É o último passo depois de extrai.mjs e gifs.mjs.
// Uso: node embute.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const RAIZ = 'H:/Meu Drive/Design/Minha ID/Site/Nova/';
const dados = readFileSync(RAIZ + 'assets/dados/projetos.json', 'utf8');
JSON.parse(dados);                                  // confere que está inteiro

const p = RAIZ + 'index.html';
let html = readFileSync(p, 'utf8');
const ini = html.indexOf('<script id="dadosProjetos" type="application/json">');
if (ini < 0) throw new Error('não achei o bloco dadosProjetos no index.html');
const abre = html.indexOf('>', ini) + 1;
const fim = html.indexOf('</script>', abre);
html = html.slice(0, abre) + dados.replace(/</g, '\\u003c') + html.slice(fim);
writeFileSync(p, html);
console.log('index.html atualizado com', (dados.length / 1024).toFixed(1), 'KB de peças');
