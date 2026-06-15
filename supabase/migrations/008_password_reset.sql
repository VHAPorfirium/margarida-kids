-- Tokens para redefinição de senha via e-mail
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  token_hash text NOT NULL UNIQUE,  -- SHA-256 do token enviado por e-mail
  expires_at timestamptz NOT NULL,
  usado_em   timestamptz,            -- NULL enquanto válido
  criado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- Acesso apenas via service_role nas API routes

-- Limpar tokens expirados automaticamente (índice para eficiência)
CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens (email);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens (token_hash);
