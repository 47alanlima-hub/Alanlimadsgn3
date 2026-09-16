# Atualizar os projetos do Behance no site

Os projetos da seção ID.Visuais são montados dentro do site, peça por peça.
As imagens paradas ficam hospedadas no CDN do Behance (não pesam no site);
as animações viram MP4 em `assets/video/projetos`.

**Esta pasta não precisa ir para o ar.** Ela só serve para atualizar o site
quando você mexer num projeto no Behance.

## Quando rodar

Sempre que você **trocar, adicionar ou reordenar peças** de um projeto no
Behance, ou publicar um projeto novo.

## Como rodar

Na pasta desta ferramenta, nesta ordem:

```bash
node extrai.mjs
```
Lê as páginas públicas dos 6 projetos e escreve `assets/dados/projetos.json`.

```bash
node gifs.mjs
```
Baixa os GIFs animados (que no Behance chegam a 40 MB cada), converte para MP4
leve em `assets/video/projetos` e troca esses blocos no JSON. **Precisa rodar
sempre depois do extrai**, senão o site volta a apontar para os GIFs gigantes.

```bash
node mede.mjs
```
Mede cada peça de verdade e corrige a proporção. O Behance declara um espaço de
exibição (muitas vezes 2:1) que não é o da imagem, e sem esta medida as peças
largas e baixas aparecem esticadas no site.

```bash
node embute.mjs
```
Copia o JSON para dentro do `index.html`, no bloco `<script id="dadosProjetos">`.
É o que faz os projetos funcionarem também quando você abre o site pelo arquivo
(`file:///…`), sem servidor.

```bash
node pesa.mjs
```
Opcional: mostra quanto cada projeto pesa para quem abre.

## Projeto novo

1. Adicione a linha do projeto em `CASES`, no `index.html` (chave, nome,
   descrição e link do Behance) e a capa em `assets/images/case-<chave>.jpg|webp`.
2. Adicione o mesmo par `['<chave>', '<link>']` na lista `PROJETOS` do `extrai.mjs`.
3. Rode os quatro comandos acima, na ordem.

## O que o gifs.mjs precisa

`ffmpeg-static` e `sharp` instalados via npm. Se a pasta de trabalho temporária
tiver sido apagada, instale de novo em qualquer pasta e ajuste o caminho no topo
do `gifs.mjs` (a linha do `createRequire`).
