create table pedidos (
  id uuid primary key default uuid_generate_v4(),
  cliente_nome text not null,
  cliente_telefone text not null,
  items jsonb not null default '[]',
  total decimal(10,2) not null default 0,
  status text check (status in ('aguardando','confirmado','separacao','enviado','entregue','cancelado')) default 'aguardando',
  nota text,
  codigo_rastreio text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create trigger trigger_pedidos_atualizado_em
before update on pedidos
for each row execute function atualizar_timestamp();

alter table pedidos enable row level security;

create policy "admin_pedidos_all" on pedidos
  for all using (auth.role() = 'authenticated');

create index pedidos_status_idx on pedidos(status);
create index pedidos_criado_em_idx on pedidos(criado_em desc);
