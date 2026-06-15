-- Contas de clientes (login por telefone + senha)
create table if not exists customer_accounts (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text not null unique,
  senha_hash  text not null,
  criado_em   timestamptz not null default now()
);

alter table customer_accounts enable row level security;
-- apenas service_role via API routes

-- Sessões autenticadas (token = id uuid no cookie)
create table if not exists customer_sessions (
  id          uuid primary key default gen_random_uuid(),
  telefone    text not null,
  expires_at  timestamptz not null,
  criado_em   timestamptz not null default now()
);

alter table customer_sessions enable row level security;
-- apenas service_role via API routes
