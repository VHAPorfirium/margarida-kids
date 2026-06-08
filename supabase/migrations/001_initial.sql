create extension if not exists "uuid-ossp";

create table produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  preco decimal(10,2) not null,
  genero text check (genero in ('masculino', 'feminino', 'unissex')) not null,
  faixa_etaria text not null,
  colecao text,
  estacao text check (estacao in ('verao', 'inverno', 'primavera', 'outono', 'todas')),
  status text check (status in ('disponivel', 'esgotado', 'inativo')) default 'disponivel',
  fotos text[] default '{}',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table variacoes_estoque (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id) on delete cascade not null,
  tamanho text not null,
  quantidade_total int default 0 check (quantidade_total >= 0),
  quantidade_disponivel int default 0 check (quantidade_disponivel >= 0),
  quantidade_em_confianca int default 0 check (quantidade_em_confianca >= 0),
  unique(produto_id, tamanho)
);

create or replace function atualizar_timestamp()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_produtos_atualizado_em
before update on produtos
for each row execute function atualizar_timestamp();

alter table produtos enable row level security;
alter table variacoes_estoque enable row level security;

create policy "catalogo_publico" on produtos
  for select using (status = 'disponivel');

create policy "variacoes_publicas" on variacoes_estoque
  for select using (
    exists (
      select 1 from produtos
      where produtos.id = variacoes_estoque.produto_id
      and produtos.status = 'disponivel'
    )
  );

create policy "admin_produtos" on produtos
  for all using (auth.role() = 'authenticated');

create policy "admin_variacoes" on variacoes_estoque
  for all using (auth.role() = 'authenticated');
