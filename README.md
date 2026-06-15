# 🌸 Margarida Kids

**Loja virtual de roupas infantis com painel de gestão completo.**

---

### Margarida Kids é um sistema feito sob medida para a sua loja. Ele tem duas partes:

**1. A loja (o que o cliente vê)**
- Uma página com todos os produtos disponíveis, com fotos, tamanhos e preços
- O cliente escolhe o que quer, coloca no carrinho e finaliza o pedido direto pelo WhatsApp
- Para ver o histórico de compras, o cliente cria uma conta com telefone e senha

**2. O painel administrativo (só você acessa)**
- Você vê todos os pedidos em tempo real e pode avançar o status de cada um (aguardando → confirmado → enviado → entregue)
- Tem suporte a **venda em confiança**: você manda a roupa, o cliente experimenta e depois confirma ou devolve
- Cadastra produtos novos com fotos, tamanhos e quantidades
- Controla o estoque automaticamente conforme os pedidos avançam
- Vê um resumo do dia no dashboard: total de pedidos, receita, pedidos pendentes

**Tudo funciona pelo celular** — o painel foi desenhado para ser usado no smartphone também.

---

## Para desenvolvedores

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 + design tokens customizados |
| Banco de dados | Supabase (PostgreSQL) |
| Storage | Supabase Storage (bucket `produtos`) |
| Autenticação admin | HMAC-SHA256 via cookie assinado (sem GoTrue) |
| Autenticação cliente | Conta própria com bcrypt + sessão em tabela `sessions` |
| OTP | Tabela `otp_codes` com expiração de 10 min |
| E-mail | Resend (boas-vindas + recuperação de senha) |
| Deploy | Vercel |

### Arquitetura

```
app/
├── (público)
│   ├── page.tsx                  → redirect para /catalago
│   ├── catalago/                 → catálogo + carrinho + checkout WhatsApp
│   ├── login/                    → login/cadastro de clientes
│   ├── meu-historico/            → histórico de pedidos do cliente
│   ├── esqueci-senha/            → solicitar redefinição de senha
│   └── redefinir-senha/          → formulário de nova senha via token
│
├── admin/
│   ├── login/                    → autenticação admin
│   ├── dashboard/                → métricas + pedidos recentes
│   ├── pedidos/                  → gestão de pedidos (normal + confiança)
│   ├── produtos/                 → listagem + novo produto
│   ├── estoque/                  → edição de variações por produto
│   └── clientes/                 → listagem de clientes cadastrados
│
└── api/
    ├── admin/                    → rotas protegidas por requireAdmin()
    │   ├── login / logout
    │   ├── pedidos               → GET / POST / PATCH
    │   ├── produtos              → GET / POST / PATCH
    │   ├── estoque               → GET / PATCH
    │   └── upload                → POST multipart → Supabase Storage
    └── auth/                     → rotas públicas de autenticação de clientes
        ├── register / login / logout
        ├── forgot-password
        └── reset-password

lib/
├── admin-auth.ts         → requireAdmin() middleware
├── admin-session.ts      → geração e verificação de token HMAC-SHA256
├── auth.ts               → autenticação de clientes (bcrypt + sessions)
├── email.ts              → templates e envio via Resend
├── rate-limit.ts         → rate limiting em memória por IP
├── reset-token.ts        → geração e hash de tokens de reset
└── supabase/
    └── service.ts        → createServiceClient() com service_role key
```

### Segurança

- **Admin**: cookie `httpOnly; Secure; SameSite=Strict` com assinatura HMAC-SHA256. Sem GoTrue — sem dependência de sessão Supabase no painel.
- **Clientes**: senha com bcrypt (rounds=12), sessão em tabela própria, OTP com expiração e limite de tentativas.
- **Rate limiting**: rotas de login, register e OTP limitam tentativas por IP.
- **Headers de segurança**: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Permissions-Policy` configurados no `next.config.ts`.
- **RLS**: toda leitura/escrita do servidor usa `service_role` via `createServiceClient()` — a `anon key` é usada apenas para acesso público ao catálogo.
- **User enumeration**: rotas de auth retornam mensagens genéricas independente se o usuário existe ou não.

### Banco de dados — migrations

Execute em ordem no **SQL Editor do Supabase**:

```
supabase/migrations/
├── 001_initial.sql          → produtos, variacoes_estoque
├── 002_pedidos.sql          → pedidos
├── 003_configuracoes.sql    → configuracoes da loja
├── 004_confianca.sql        → coluna tipo + status de confiança em pedidos
├── 005_customer_auth.sql    → customer_accounts, otp_codes, sessions
├── 006_seed_fotos.sql       → fotos placeholder para desenvolvimento
├── 007_customer_email.sql   → coluna email em customer_accounts
└── 008_password_reset.sql   → password_reset_tokens
```

Todas as migrations usam `IF NOT EXISTS` — são idempotentes.

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
# Supabase (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=          # string longa aleatória

# E-mail (Resend)
RESEND_API_KEY=
EMAIL_FROM=Margarida Kids <noreply@seudominio.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=   # DDI + número ex: 5511999999999
```

### Rodando localmente

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # build de produção
npm start          # servir build de produção
```

### Deploy

O projeto está configurado para deploy contínuo na **Vercel**. Qualquer push na branch `main` dispara um novo deploy automaticamente.

1. Importe o repositório no Vercel
2. Configure as variáveis de ambiente em **Settings → Environment Variables**
3. O primeiro deploy é gerado automaticamente

### Branches

| Branch | Uso |
|--------|-----|
| `main` | produção |
| `dev` | desenvolvimento — PRs vão para cá antes de ir para main |

---

Feito com 🌸 para a Margarida Kids.
