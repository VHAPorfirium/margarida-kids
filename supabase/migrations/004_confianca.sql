-- Adiciona coluna tipo para diferenciar pedidos normais de venda em confiança
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'normal';

-- Estende a constraint de status para incluir os status de confiança
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK (
  status IN (
    -- Pedidos normais
    'aguardando', 'confirmado', 'separacao', 'enviado', 'entregue', 'cancelado',
    -- Vendas em confiança
    'cf_separado', 'cf_entregue', 'cf_aguardando', 'cf_pago', 'cf_devolvido'
  )
);

-- Índice para filtrar por tipo
CREATE INDEX IF NOT EXISTS pedidos_tipo_idx ON pedidos(tipo);

-- Comentários
COMMENT ON COLUMN pedidos.tipo IS 'normal | confianca';
