create table configuracoes (
  id int primary key default 1,
  loja_nome text default 'Margarida Kids',
  loja_tagline text default 'Roupinhas para cada fase da sua criança',
  loja_email text,
  whatsapp_numero text,
  atualizado_em timestamptz default now()
);

-- Seed row inicial
insert into configuracoes (id) values (1) on conflict do nothing;

create trigger trigger_configuracoes_atualizado_em
before update on configuracoes
for each row execute function atualizar_timestamp();

alter table configuracoes enable row level security;

create policy "config_read_public" on configuracoes
  for select using (true);

create policy "config_write_admin" on configuracoes
  for update using (auth.role() = 'authenticated');
