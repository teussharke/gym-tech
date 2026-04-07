-- Tabela de registros de consentimento LGPD
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('termos', 'privacidade', 'dados_sensiveis', 'cookies', 'marketing')),
  versao VARCHAR(20) NOT NULL DEFAULT '1.0',
  consentido BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_usuario ON consent_records(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consent_tipo ON consent_records(tipo);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver e inserir seu próprio consentimento
CREATE POLICY "Usuarios podem inserir proprio consentimento"
  ON consent_records FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios podem ler proprio consentimento"
  ON consent_records FOR SELECT
  USING (usuario_id = auth.uid());

-- Admin pode ver todos
CREATE POLICY "Admin pode ler todos os consentimentos"
  ON consent_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'
    )
  );
