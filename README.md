## Agora Recomendo — Template Premium de Reviews e Afiliados

Um site de reviews com visual Apple‑like e uma dashboard admin completa. Publique artigos ricos com TipTap, importe e edite avaliações, e controle exatamente como elas aparecem para o público — tudo com Next.js 14, Prisma + Supabase e NextAuth.

— Parte 1: visão comercial (para compradores/usuários finais)

— Parte 2: visão técnica (para desenvolvedores)

— Parte 3: instalação e deploy (passo a passo)

---

## Parte 1 — Visão Comercial (o que você recebe)

### Por que este template?

- Visual premium inspirado na Apple (tipografia, vidro/blur, animações leves).
- CMS editorial completo: TipTap com headings, listas, imagens e links.
- Reviews inteligentes: scraping + edição + avatar + modos de exibição elegantes.
- Painel admin polido com autosave e toasts — produtividade real.
- Stack moderna e sustentável (Next.js 14 + Supabase + Prisma + NextAuth).

### O que vem pronto

- Site público de produto com hero, resumo, artigo completo e CTA “Ver na Loja”.
- Seção “Reviews: O que dizem os usuários” personalizável pelo admin, com os modos:
	- minimal (cartões centrados)
	- grid (2 colunas)
	- summary (média e contagem)
	- single-slide (um cartão com slide automático)
	- single-fade (um cartão com fade in/out)
	- marquee (fila de cartões rolando em loop)
	- hidden (ocultar)
- Editor TipTap no admin com autosave.
- Reviews: importar de links com scraping (JSON‑LD e fallback HTML), editar todas (inclusive importadas), adicionar manual, avatar opcional via upload.
- Afiliados: múltiplos links por produto, com locale/loja e título custom, acordeão que não fecha sozinho após salvar.
- Slugs únicos e SEO friendly.

### Para quem é ideal

- Criadores e curadorias de produtos.
- Revistas e blogs de tecnologia/consumo.
- Startups que precisam publicar rápido com controle editorial e afiliação.

---

## Parte 2 — Visão Técnica (como funciona)

### Stack principal

- Next.js 14 (App Router) + React Server/Client Components
- Tailwind CSS (tipografia + animações + paleta Apple‑like)
- Prisma + PostgreSQL (Supabase)
- NextAuth (Google OAuth) com whitelist por ADMIN_EMAILS
- TipTap Editor e sanitize‑html no servidor

### Modelagem (Prisma)

- Product: title, slug, summary, article, imageUrl, price, tags, scrapedDescription, scrapedQnA
- Category: name, slug
- AffiliateLink: url, locale, store (JSON com label/título)
- Review: author, rating, content, isManual, avatarUrl
- Tabelas NextAuth: User, Account, Session, VerificationToken

### APIs (principais)

- POST /api/products — cria produto (slug único, sanitiza article, cria links/reviews)
- PATCH /api/products/[id] — atualiza campos; replace seguro de links/reviews quando enviados; salva `scrapedQnA.reviewsDisplay`
- GET /api/products/[id] — leitura para admin
- DELETE /api/products/[id] — remove produto e vínculos
- /api/categories — CRUD simples
- /api/scrape/reviews — scraping com headers realistas; JSON‑LD e fallback HTML (Amazon)
- /api/upload — upload para `public/uploads/` e retorno de URL

### Admin

- Artigo TipTap com autosave, toasts de feedback
- Tags em chips + autosave, sugestões por título
- Acordeão de links com badge de loja/locale; persistência de metadados no campo `store` (JSON)
- Reviews Manager com:
	- adicionar manual, remover
	- editar em modal (autor, nota, conteúdo, avatar via upload)
	- média automática e sincronização pós‑importação
- Config pública das avaliações (salva em `scrapedQnA`): modo, ordem, limite, estrelas — com preview ao vivo

### Público (page `/produto/[slug]`)

- Hero com imagem e CTA
- Artigo sanitizado (ou resumo)
- Seção “O que dizem os usuários” obedecendo ao `reviewsDisplay` do admin
	- single‑slide / single‑fade / marquee são Client Components importadas dinamicamente (ssr: false)

### Qualidade e segurança

- Sanitização do `article` no servidor
- Slug único (evita colisões em renomeações)
- Autosave com debounce
- Build + Lint + Tipos: PASS

---

## Parte 3 — Instalação e Deploy

### Requisitos

- Node 18+ e npm
- Projeto no Supabase (PostgreSQL)
- Credenciais Google OAuth (console.cloud.google.com)
- Conta na Vercel (para deploy)

### 1) Instalar dependências

```bash
git clone https://github.com/bkdsb/agorarecomendo.git
cd agorarecomendo/agorarecomendo
npm install
```

### 2) Configurar variáveis (.env)

Crie `./.env` (ou copie de `.env.example`) na pasta `agorarecomendo`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?schema=public"
NEXTAUTH_SECRET="um_segredo_forte"
NEXTAUTH_URL="http://localhost:3000" # em produção a URL do seu domínio
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAILS="seuemail@gmail.com,outro@dominio.com"
# Para auto-preencher dados ao colar link de produto (Amazon), use a Rainforest API:
RAINFOREST_API_KEY="sua_chave_rainforest"
```

No Google OAuth, defina o callback:
- Local: `http://localhost:3000/api/auth/callback/google`
- Produção: `https://seu-dominio/api/auth/callback/google`

### 3) Banco de dados

```bash
# aplicar migrations no banco do Supabase
npm run db:deploy

# (opcional) introspect do banco -> schema.prisma
npm run db:pull

# regenerar o Prisma Client
npm run db:generate
```

### 4) Rodar local

```bash
npm run dev
```

Abra `http://localhost:3000` e faça login em `/auth/signin` com um e‑mail da lista `ADMIN_EMAILS`.

### 5) Deploy (Vercel + Supabase)

1. Faça push deste repositório no GitHub.
2. Na Vercel: New Project → importe o repo.
3. Configure as variáveis do `.env` na aba “Environment Variables”.
4. Deploy. Após subir:
	 - Garanta que o `DATABASE_URL` da produção aponta para o seu Supabase de produção.
	 - Rode migrations na produção (se necessário): `npm run db:deploy` com as envs de produção.
5. Ajuste o callback do Google OAuth para o domínio da Vercel.

### 6) Fluxo de uso (admin)

- Categorias → crie algumas.
- Produtos → “Novo”: cole o link do produto (ex.: Amazon) e o sistema tenta preencher título/imagem/preço usando a Rainforest API; depois ajuste resumo, categoria e publique.
- Escreva o artigo (TipTap). Autosave cuida de você.
- Reviews → importar do link principal, ou adicionar manual.
- Clique em “Editar” na review para abrir o modal e (opcional) subir avatar.
- Em “Exibição das Avaliações (Público)”, escolha o layout (slide, fade, marquee, etc.) e veja o preview.

### 7) Troubleshooting

- Acesso negado no admin: verifique `ADMIN_EMAILS` e o e‑mail da conta Google.
- Erro ao salvar com avatar: confirme que as migrations foram aplicadas e a coluna `Review.avatarUrl` existe.
- Scraping falha: a marcação HTML do site de destino pode ter mudado; tente outra URL.
- Build falhou na Vercel: confira variáveis de ambiente obrigatórias (`GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL`).

### Scripts úteis

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # servir build
npm run db:deploy    # prisma migrate deploy
npm run db:pull      # prisma db pull (introspect)
npm run db:generate  # prisma generate
```

---

## Licença e uso

Este template é fornecido para fins de criação de sites de review/afiliados. Se for vendido como produto, defina claramente os termos de uso/licenciamento (tiers pessoal/comercial/enterprise) e as responsabilidades quanto ao scraping e políticas de afiliados.

Sugestões de próximos passos para quem customiza:
- Deduplcação de reviews na importação
- Opções de velocidade/intervalo para slide e marquee
- Botões prev/next no slide
- Monitoramento (Sentry/BetterStack) e logs estruturados
- Pagamentos (Stripe) e RBAC por papéis

— Fim —
