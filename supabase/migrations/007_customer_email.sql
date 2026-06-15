-- Adiciona campo email à tabela customer_accounts
-- Email único por cliente; registros antigos ficam com NULL até atualizarem

ALTER TABLE customer_accounts
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Índice único parcial: ignora NULLs (registros antigos sem email)
CREATE UNIQUE INDEX IF NOT EXISTS customer_accounts_email_unique
  ON customer_accounts (email)
  WHERE email IS NOT NULL;
