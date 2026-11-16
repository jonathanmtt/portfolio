# Portfólio — guia de publicação e manutenção

Site estático e bilíngue (inglês + português). HTML, CSS e um pouco de JS, sem build, sem banco de dados e sem login.
Hospedagem: **US$0** na Cloudflare Pages. Todos os comandos abaixo rodam **de dentro desta pasta**.

```
portfolio/
├── index.html               ← inglês (principal, para o dono de empresa americano)
├── pt/index.html            ← português (para o dono de empresa brasileiro nos EUA)
├── privacy.html             ← política de privacidade (obrigatória na Califórnia para site com formulário)
├── pt/privacidade.html      ← mesma política, em português
├── 404.html                 ← página de "não encontrado" (a Cloudflare usa sozinha)
├── demos/
│   ├── auto-repair/         ← oficina (Las Vegas)
│   ├── cleaning/            ← limpeza (San Diego), BILÍNGUE EN/PT — abre em PT com ?lang=pt
│   └── landscaping/         ← paisagismo (North County San Diego)
├── assets/css/style.css     ← cores e fontes no topo (:root)
├── assets/js/main.js        ← slider antes/depois, troca de idioma, formulário
├── assets/img/              ← prints das demos (.webp), imagem de compartilhamento (og.jpg), ícones
├── assets/mock/             ← páginas usadas só para gerar imagens (não aparecem no site)
├── tools/                   ← configure.mjs (seus dados), shoot.mjs (imagens), review.mjs (revisão)
├── sitemap.xml, robots.txt  ← para o Google
├── _headers                 ← cabeçalhos de segurança (Cloudflare Pages)
├── README.md                ← apresentação do projeto no GitHub (inglês)
└── PUBLICAR.md              ← este guia
```

## 1. Colocar seus dados (1 comando)

```bash
node tools/configure.mjs --domain SEUDOMINIO.com --email hello@SEUDOMINIO.com --phone "(702) 555-1234" --whatsapp "+1 702 555 1234" --web3forms SUA-CHAVE
```

- Pode passar só o que já tiver; rode de novo depois com o resto.
- `--whatsapp` aceita número de outro país (ex.: `+55 11 9…`). Se não passar, usa o mesmo do `--phone`.
- Para ver o que ainda falta: `node tools/configure.mjs --check`

**Chave do formulário (grátis):** crie conta em web3forms.com com o e-mail que vai receber os pedidos e copie a Access Key.

**Foto:** salve como `assets/img/jonathan.jpg` (vertical, 4:5) e troque o bloco das iniciais pelo `<img>` que está comentado na seção About/Sobre das duas páginas.

**Formação:** confira o "B.Eng / Engenharia de Software" na seção About/Sobre.

**Kaique Nômade:** peça autorização por escrito para mostrar o projeto e um depoimento de 2–3 frases.

## 2. Publicar na Cloudflare Pages (≈ 15 min, grátis)

1. Envie esta pasta para o repositório `portfolio` no seu GitHub.
2. dash.cloudflare.com → Workers & Pages → Create → Pages → **Connect to Git** → escolha `portfolio`.
3. Build settings: **Framework preset: None**, build command vazio, **output directory `/`**.
4. Deploy. Você recebe um endereço `portfolio-xxx.pages.dev` na hora.
5. Domínio: compre na própria Cloudflare (Domain Registration, ~US$11/ano para .com) e ligue em **Custom domains** do projeto.
6. E-mail com o domínio: Cloudflare → Email → **Email Routing** → encaminhar `hello@` para o seu Gmail (grátis).
7. Depois de publicar: **Web Analytics** (grátis, sem cookies) na própria Cloudflare; envie o `sitemap.xml` no **Google Search Console**; teste em pagespeed.web.dev.

A cada `git push`, o site atualiza sozinho.

## Rodar no computador

```bash
python -m http.server 4321
```

Abra http://localhost:4321 (português em http://localhost:4321/pt/).

## Gerar de novo as imagens das demos

Com o servidor local rodando:

```bash
node tools/shoot.mjs
```

Usa o Chrome instalado, em modo invisível. Para gerar só uma: `node tools/shoot.mjs demo-cleaning`.

## Usar uma demo como base para um cliente

1. Copie a pasta da demo do mesmo nicho.
2. Troque nome, telefone, endereço, serviços, cidades, avaliações reais e fotos do cliente.
3. Remova a faixa "Concept demo" do topo e a `meta robots noindex`.
4. Conecte o formulário (Web3Forms com o e-mail do cliente).
5. Publique num projeto separado da Cloudflare Pages, no domínio do cliente.
