-- Tabela de comunicados/novidades da academia
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS comunicados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academia_id UUID REFERENCES academias(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'comunicado' CHECK (tipo IN ('comunicado', 'atualizacao', 'evento', 'urgente')),
  fixado BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comunicados_academia ON comunicados(academia_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_created ON comunicados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comunicados_tipo ON comunicados(tipo);

-- RLS (Row Level Security)
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;

-- Todos da academia podem ler comunicados ativos
CREATE POLICY "Usuarios podem ler comunicados da academia"
  ON comunicados FOR SELECT
  USING (
    ativo = true
    AND academia_id IN (
      SELECT academia_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Apenas admin pode inserir
CREATE POLICY "Admin pode criar comunicados"
  ON comunicados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apenas admin pode atualizar
CREATE POLICY "Admin pode editar comunicados"
  ON comunicados FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apenas admin pode deletar
CREATE POLICY "Admin pode deletar comunicados"
  ON comunicados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
