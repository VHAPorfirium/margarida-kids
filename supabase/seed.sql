-- ══════════════════════════════════════════════════════════════════════
--  SEED LOCAL — Margarida Kids
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. ADMIN USER ─────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  'aa000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'sysadmin@admin.com',
  crypt('Admin@123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Margarida"}',
  false
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('Admin@123', gen_salt('bf')),
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now());

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'aa000000-0000-0000-0000-000000000001',
  'aa000000-0000-0000-0000-000000000001',
  'sysadmin@admin.com',
  'email',
  '{"sub":"aa000000-0000-0000-0000-000000000001","email":"sysadmin@admin.com","email_verified":true}',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ── 2. PRODUTOS (genero: feminino/masculino/unissex | faixa_etaria obrigatorio) ──
INSERT INTO produtos (id, nome, descricao, preco, genero, faixa_etaria, estacao, status, fotos) VALUES
  -- FEMININO
  ('a1000001-0000-0000-0000-000000000001','Vestido Floral Rosa',         'Vestido leve com estampa floral em tons de rosa.',          89.90, 'feminino', '2-4 anos',   'verao',     'disponivel', ARRAY['https://picsum.photos/seed/vestido-floral-1/600/750','https://picsum.photos/seed/vestido-floral-2/600/750','https://picsum.photos/seed/vestido-floral-3/600/750']),
  ('a1000001-0000-0000-0000-000000000002','Conjunto Saia e Blusa Lilas', 'Conjunto com saia evase e blusa de alcinha.',              134.90, 'feminino', '4-6 anos',   'primavera', 'disponivel', ARRAY['https://picsum.photos/seed/conjunto-saia-1/600/750','https://picsum.photos/seed/conjunto-saia-2/600/750','https://picsum.photos/seed/conjunto-saia-3/600/750']),
  ('a1000001-0000-0000-0000-000000000003','Legging Estampada Borboletas','Legging com estampa de borboletas.',                       54.90, 'feminino', '2-4 anos',   'todas',     'disponivel', ARRAY['https://picsum.photos/seed/legging-borboleta-1/600/750','https://picsum.photos/seed/legging-borboleta-2/600/750','https://picsum.photos/seed/legging-borboleta-3/600/750']),
  ('a1000001-0000-0000-0000-000000000004','Vestido de Inverno Xadrez',   'Vestido quentinho xadrez com mangas longas.',             119.90, 'feminino', '6-8 anos',   'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/vestido-inverno-1/600/750','https://picsum.photos/seed/vestido-inverno-2/600/750','https://picsum.photos/seed/vestido-inverno-3/600/750']),
  ('a1000001-0000-0000-0000-000000000005','Sainha Jeans com Lycra',      'Saia jeans com elastano para maior mobilidade.',           79.90, 'feminino', '4-6 anos',   'todas',     'disponivel', ARRAY['https://picsum.photos/seed/sainha-jeans-1/600/750','https://picsum.photos/seed/sainha-jeans-2/600/750','https://picsum.photos/seed/sainha-jeans-3/600/750']),
  ('a1000001-0000-0000-0000-000000000006','Blusao de Frio Rosa',         'Moletom macio com capuz e bolso canguru.',                 99.90, 'feminino', '6-8 anos',   'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/blusao-rosa-1/600/750','https://picsum.photos/seed/blusao-rosa-2/600/750','https://picsum.photos/seed/blusao-rosa-3/600/750']),
  ('a1000001-0000-0000-0000-000000000007','Vestido Tie-Dye Colorido',    'Vestido tie-dye leve para os dias quentes.',               74.90, 'feminino', '2-4 anos',   'verao',     'disponivel', ARRAY['https://picsum.photos/seed/vestido-tiedye-1/600/750','https://picsum.photos/seed/vestido-tiedye-2/600/750','https://picsum.photos/seed/vestido-tiedye-3/600/750']),
  ('a1000001-0000-0000-0000-000000000008','Conjunto Inverno Pelucia',    'Conjunto calca e casaco de pelucia super macio.',         189.90, 'feminino', '4-6 anos',   'inverno',   'inativo',    ARRAY['https://picsum.photos/seed/conjunto-pelucia-1/600/750','https://picsum.photos/seed/conjunto-pelucia-2/600/750','https://picsum.photos/seed/conjunto-pelucia-3/600/750']),
  -- MASCULINO
  ('b2000001-0000-0000-0000-000000000001','Conjunto Camiseta e Bermuda', 'Conjunto algodao com estampa de dinossauro.',              99.90, 'masculino','4-6 anos',   'verao',     'disponivel', ARRAY['https://picsum.photos/seed/camiseta-bermuda-1/600/750','https://picsum.photos/seed/camiseta-bermuda-2/600/750','https://picsum.photos/seed/camiseta-bermuda-3/600/750']),
  ('b2000001-0000-0000-0000-000000000002','Calca Moletom Azul Marinho',  'Calca de moletom confortavel para o dia a dia.',           79.90, 'masculino','6-8 anos',   'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/calca-moletom-1/600/750','https://picsum.photos/seed/calca-moletom-2/600/750','https://picsum.photos/seed/calca-moletom-3/600/750']),
  ('b2000001-0000-0000-0000-000000000003','Camisa Social Mini',          'Camisa social de algodao para eventos especiais.',         89.90, 'masculino','4-6 anos',   'todas',     'disponivel', ARRAY['https://picsum.photos/seed/camisa-social-1/600/750','https://picsum.photos/seed/camisa-social-2/600/750','https://picsum.photos/seed/camisa-social-3/600/750']),
  ('b2000001-0000-0000-0000-000000000004','Conjunto Jeans e Camiseta',   'Calca jeans slim e camiseta listrada.',                  149.90, 'masculino','8-10 anos',  'todas',     'disponivel', ARRAY['https://picsum.photos/seed/conjunto-jeans-1/600/750','https://picsum.photos/seed/conjunto-jeans-2/600/750','https://picsum.photos/seed/conjunto-jeans-3/600/750']),
  ('b2000001-0000-0000-0000-000000000005','Jaqueta Corta-Vento Azul',    'Jaqueta leve com capuz escondido na gola.',              129.90, 'masculino','6-8 anos',   'outono',    'disponivel', ARRAY['https://picsum.photos/seed/jaqueta-vento-1/600/750','https://picsum.photos/seed/jaqueta-vento-2/600/750','https://picsum.photos/seed/jaqueta-vento-3/600/750']),
  ('b2000001-0000-0000-0000-000000000006','Short de Praia Estampado',    'Short de tactel com estampa de tubaraoes.',               59.90, 'masculino','2-4 anos',   'verao',     'disponivel', ARRAY['https://picsum.photos/seed/short-praia-1/600/750','https://picsum.photos/seed/short-praia-2/600/750','https://picsum.photos/seed/short-praia-3/600/750']),
  -- UNISSEX
  ('c3000001-0000-0000-0000-000000000001','Body Manga Curta Branco',     'Body de algodao 100% para bebes.',                        39.90, 'unissex',  '0-3 meses',  'todas',     'disponivel', ARRAY['https://picsum.photos/seed/body-branco-1/600/750','https://picsum.photos/seed/body-branco-2/600/750','https://picsum.photos/seed/body-branco-3/600/750']),
  ('c3000001-0000-0000-0000-000000000002','Macacao Listrado',            'Macacao listrado azul e branco para passeios.',            89.90, 'unissex',  '3-6 meses',  'verao',     'disponivel', ARRAY['https://picsum.photos/seed/macacao-listrado-1/600/750','https://picsum.photos/seed/macacao-listrado-2/600/750','https://picsum.photos/seed/macacao-listrado-3/600/750']),
  ('c3000001-0000-0000-0000-000000000003','Pijama Estampado Estrelas',   'Pijama quentinho com estampa de estrelas.',              109.90, 'unissex',  '2-4 anos',   'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/pijama-estrelas-1/600/750','https://picsum.photos/seed/pijama-estrelas-2/600/750','https://picsum.photos/seed/pijama-estrelas-3/600/750']),
  ('c3000001-0000-0000-0000-000000000004','Body Manga Longa Cinza',      'Body termico para os dias frios.',                        49.90, 'unissex',  '6-12 meses', 'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/body-cinza-1/600/750','https://picsum.photos/seed/body-cinza-2/600/750','https://picsum.photos/seed/body-cinza-3/600/750']),
  ('c3000001-0000-0000-0000-000000000005','Macacao de Plush Bege',       'Macacao quentissimo de plush com orelhinhas no capuz.',  159.90, 'unissex',  '6-12 meses', 'inverno',   'disponivel', ARRAY['https://picsum.photos/seed/macacao-plush-1/600/750','https://picsum.photos/seed/macacao-plush-2/600/750','https://picsum.photos/seed/macacao-plush-3/600/750'])
ON CONFLICT (id) DO UPDATE SET fotos = EXCLUDED.fotos WHERE array_length(produtos.fotos, 1) IS NULL OR array_length(produtos.fotos, 1) = 0;

-- ── 3. VARIAÇÕES DE ESTOQUE ───────────────────────────────────────────
INSERT INTO variacoes_estoque (produto_id, tamanho, quantidade_disponivel, quantidade_total) VALUES
  ('a1000001-0000-0000-0000-000000000001','P', 8,10),('a1000001-0000-0000-0000-000000000001','M', 6,10),
  ('a1000001-0000-0000-0000-000000000001','G', 4,10),('a1000001-0000-0000-0000-000000000001','1', 3, 5),
  ('a1000001-0000-0000-0000-000000000002','P', 2, 8),('a1000001-0000-0000-0000-000000000002','M', 1, 8),
  ('a1000001-0000-0000-0000-000000000002','G', 0, 8),
  ('a1000001-0000-0000-0000-000000000003','P',10,10),('a1000001-0000-0000-0000-000000000003','M', 7,10),
  ('a1000001-0000-0000-0000-000000000003','G', 5,10),('a1000001-0000-0000-0000-000000000003','2', 3, 5),
  ('a1000001-0000-0000-0000-000000000004','P', 4, 6),('a1000001-0000-0000-0000-000000000004','M', 3, 6),
  ('a1000001-0000-0000-0000-000000000004','G', 2, 6),
  ('a1000001-0000-0000-0000-000000000005','4', 6, 8),('a1000001-0000-0000-0000-000000000005','6', 4, 8),
  ('a1000001-0000-0000-0000-000000000005','8', 2, 8),('a1000001-0000-0000-0000-000000000005','10',0, 8),
  ('a1000001-0000-0000-0000-000000000006','P', 1, 5),('a1000001-0000-0000-0000-000000000006','M', 2, 5),
  ('a1000001-0000-0000-0000-000000000006','G', 0, 5),
  ('a1000001-0000-0000-0000-000000000007','P', 5, 6),('a1000001-0000-0000-0000-000000000007','M', 5, 6),
  ('a1000001-0000-0000-0000-000000000007','G', 3, 6),
  ('a1000001-0000-0000-0000-000000000008','P', 0, 3),('a1000001-0000-0000-0000-000000000008','M', 0, 3),
  ('b2000001-0000-0000-0000-000000000001','2', 6, 8),('b2000001-0000-0000-0000-000000000001','4', 8, 8),
  ('b2000001-0000-0000-0000-000000000001','6', 5, 8),('b2000001-0000-0000-0000-000000000001','8', 3, 8),
  ('b2000001-0000-0000-0000-000000000002','2', 4, 6),('b2000001-0000-0000-0000-000000000002','4', 4, 6),
  ('b2000001-0000-0000-0000-000000000002','6', 2, 6),('b2000001-0000-0000-0000-000000000002','8', 1, 6),
  ('b2000001-0000-0000-0000-000000000003','4', 5, 6),('b2000001-0000-0000-0000-000000000003','6', 4, 6),
  ('b2000001-0000-0000-0000-000000000003','8', 3, 6),('b2000001-0000-0000-0000-000000000003','10',2, 6),
  ('b2000001-0000-0000-0000-000000000004','4', 3, 5),('b2000001-0000-0000-0000-000000000004','6', 2, 5),
  ('b2000001-0000-0000-0000-000000000004','8', 1, 5),('b2000001-0000-0000-0000-000000000004','10',0, 5),
  ('b2000001-0000-0000-0000-000000000005','4', 4, 5),('b2000001-0000-0000-0000-000000000005','6', 3, 5),
  ('b2000001-0000-0000-0000-000000000005','8', 2, 5),('b2000001-0000-0000-0000-000000000005','10',1, 5),
  ('b2000001-0000-0000-0000-000000000006','2', 7, 8),('b2000001-0000-0000-0000-000000000006','4', 6, 8),
  ('b2000001-0000-0000-0000-000000000006','6', 5, 8),('b2000001-0000-0000-0000-000000000006','8', 2, 8),
  ('c3000001-0000-0000-0000-000000000001','RN',10,12),('c3000001-0000-0000-0000-000000000001','P', 8,12),
  ('c3000001-0000-0000-0000-000000000001','M', 6,12),('c3000001-0000-0000-0000-000000000001','G', 3,12),
  ('c3000001-0000-0000-0000-000000000002','RN', 5, 6),('c3000001-0000-0000-0000-000000000002','P', 4, 6),
  ('c3000001-0000-0000-0000-000000000002','M',  2, 6),
  ('c3000001-0000-0000-0000-000000000003','2', 5, 6),('c3000001-0000-0000-0000-000000000003','4', 4, 6),
  ('c3000001-0000-0000-0000-000000000003','6', 3, 6),('c3000001-0000-0000-0000-000000000003','8', 1, 6),
  ('c3000001-0000-0000-0000-000000000004','RN', 2, 8),('c3000001-0000-0000-0000-000000000004','P', 1, 8),
  ('c3000001-0000-0000-0000-000000000004','M',  0, 8),
  ('c3000001-0000-0000-0000-000000000005','RN', 4, 5),('c3000001-0000-0000-0000-000000000005','P', 3, 5),
  ('c3000001-0000-0000-0000-000000000005','M',  2, 5),('c3000001-0000-0000-0000-000000000005','G', 1, 5)
ON CONFLICT DO NOTHING;

-- ── 4. PEDIDOS NORMAIS ────────────────────────────────────────────────
INSERT INTO pedidos (id, cliente_nome, cliente_telefone, items, total, status, tipo, nota, criado_em) VALUES
  ('d4000001-0000-0000-0000-000000000001','Ana Paula Silva', '11987654321',
   '[{"nome":"Vestido Floral Rosa","tamanho":"M","quantidade":1,"preco":89.90},{"nome":"Legging Estampada","tamanho":"M","quantidade":2,"preco":54.90}]'::jsonb,
   199.70,'aguardando','normal','Entregar em maos quando possivel.', now() - interval '2 hours'),
  ('d4000001-0000-0000-0000-000000000002','Carla Mendes',    '21976543210',
   '[{"nome":"Conjunto Saia e Blusa Lilas","tamanho":"P","quantidade":1,"preco":134.90}]'::jsonb,
   134.90,'confirmado','normal', null, now() - interval '1 day'),
  ('d4000001-0000-0000-0000-000000000003','Juliana Rocha',   '31965432109',
   '[{"nome":"Vestido Inverno Xadrez","tamanho":"G","quantidade":1,"preco":119.90},{"nome":"Blusao de Frio","tamanho":"M","quantidade":1,"preco":99.90}]'::jsonb,
   219.80,'separacao','normal','Presente de aniversario, embalar.', now() - interval '2 days'),
  ('d4000001-0000-0000-0000-000000000004','Fernanda Lima',   '41954321098',
   '[{"nome":"Sainha Jeans","tamanho":"6","quantidade":1,"preco":79.90},{"nome":"Vestido Tie-Dye","tamanho":"P","quantidade":1,"preco":74.90}]'::jsonb,
   154.80,'enviado','normal', null, now() - interval '4 days'),
  ('d4000001-0000-0000-0000-000000000005','Marina Costa',    '51943210987',
   '[{"nome":"Body Manga Curta","tamanho":"RN","quantidade":3,"preco":39.90},{"nome":"Macacao Listrado","tamanho":"P","quantidade":1,"preco":89.90}]'::jsonb,
   209.60,'entregue','normal', null, now() - interval '7 days'),
  ('d4000001-0000-0000-0000-000000000006','Roberta Alves',   '61932109876',
   '[{"nome":"Conjunto Jeans e Camiseta","tamanho":"8","quantidade":1,"preco":149.90}]'::jsonb,
   149.90,'cancelado','normal','Cliente desistiu.', now() - interval '3 days'),
  ('d4000001-0000-0000-0000-000000000007','Patricia Souza',  '71921098765',
   '[{"nome":"Macacao de Plush Bege","tamanho":"RN","quantidade":1,"preco":159.90}]'::jsonb,
   159.90,'aguardando','normal', null, now() - interval '30 minutes'),
  ('d4000001-0000-0000-0000-000000000008','Sandra Oliveira', '81910987654',
   '[{"nome":"Jaqueta Corta-Vento Azul","tamanho":"4","quantidade":1,"preco":129.90},{"nome":"Calca Moletom","tamanho":"4","quantidade":1,"preco":79.90}]'::jsonb,
   209.80,'aguardando','normal','Pagamento via PIX.', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ── 5. PEDIDOS CONFIANÇA ──────────────────────────────────────────────
INSERT INTO pedidos (id, cliente_nome, cliente_telefone, items, total, status, tipo, nota, criado_em) VALUES
  ('e5000001-0000-0000-0000-000000000001','Beatriz Santos',  '11912345678',
   '[{"nome":"Vestido Floral Rosa","tamanho":"G","quantidade":1,"preco":89.90},{"nome":"Conjunto Saia","tamanho":"G","quantidade":1,"preco":134.90}]'::jsonb,
   224.80,'cf_separado','confianca','Separado para experimentar no final de semana.', now() - interval '3 hours'),
  ('e5000001-0000-0000-0000-000000000002','Luciana Martins', '21923456789',
   '[{"nome":"Vestido Tie-Dye","tamanho":"M","quantidade":1,"preco":74.90},{"nome":"Legging Estampada","tamanho":"M","quantidade":2,"preco":54.90}]'::jsonb,
   184.70,'cf_entregue','confianca','Entregue ontem. Vai decidir ate sexta.', now() - interval '1 day'),
  ('e5000001-0000-0000-0000-000000000003','Tatiane Ferreira','31934567890',
   '[{"nome":"Macacao Listrado","tamanho":"RN","quantidade":1,"preco":89.90},{"nome":"Body Manga Curta","tamanho":"P","quantidade":2,"preco":39.90}]'::jsonb,
   169.70,'cf_aguardando','confianca','Ficou com tudo. Paga na semana que vem.', now() - interval '5 days'),
  ('e5000001-0000-0000-0000-000000000004','Vanessa Cardoso', '41945678901',
   '[{"nome":"Pijama Estrelas","tamanho":"4","quantidade":1,"preco":109.90},{"nome":"Conjunto Bermuda","tamanho":"4","quantidade":1,"preco":99.90}]'::jsonb,
   209.80,'cf_pago','confianca', null, now() - interval '10 days'),
  ('e5000001-0000-0000-0000-000000000005','Gabriela Nunes',  '51956789012',
   '[{"nome":"Vestido Inverno Xadrez","tamanho":"P","quantidade":1,"preco":119.90},{"nome":"Blusao Rosa","tamanho":"P","quantidade":1,"preco":99.90}]'::jsonb,
   219.80,'cf_devolvido','confianca','Nao gostou do tecido. Devolveu tudo.', now() - interval '8 days'),
  ('e5000001-0000-0000-0000-000000000006','Camila Ribeiro',  '61967890123',
   '[{"nome":"Sainha Jeans","tamanho":"8","quantidade":1,"preco":79.90}]'::jsonb,
   79.90,'cf_aguardando','confianca','Esta adorando a saia.', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ── 6. CONFIGURAÇÕES ──────────────────────────────────────────────────
INSERT INTO configuracoes (id, loja_nome, loja_tagline, loja_email, whatsapp_numero)
VALUES (1,'Margarida Kids','Roupinhas para cada fase da sua crianca','contato@margaridakids.com','11999990000')
ON CONFLICT (id) DO UPDATE
  SET loja_nome='Margarida Kids', loja_tagline='Roupinhas para cada fase da sua crianca',
      loja_email='contato@margaridakids.com', whatsapp_numero='11999990000';
