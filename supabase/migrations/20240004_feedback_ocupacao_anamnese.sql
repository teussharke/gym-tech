-- =============================================================
-- MIGRATION: Feedback pós-treino, Ocupação em tempo real,
--            Anamnese digital
-- EXECUTAR: Cole no SQL Editor do Supabase e clique em "Run"
-- =============================================================

-- ----------------------------------------------------------------
-- 1. FEEDBACK PÓS-TREINO
--    Colunas adicionadas em historico_treinos
-- ----------------------------------------------------------------
ALTER TABLE public.historico_treinos
  ADD COLUMN IF NOT EXISTS feedback_cansaco    SMALLINT CHECK (feedback_cansaco    BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS feedback_dor        SMALLINT CHECK (feedback_dor        BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS feedback_dificuldade SMALLINT CHECK (feedback_dificuldade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS feedback_comentario TEXT;

-- ----------------------------------------------------------------
-- 2. OCUPAÇÃO DA ACADEMIA EM TEMPO REAL
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ocupacao_academia (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academia_id  UUID NOT NULL REFERENCES public.academias(id) ON DELETE CASCADE,
  hora         SMALLINT NOT NULL CHECK (hora BETWEEN 0 AND 23),  -- 0..23
  dia_semana   SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 6=Sab
  quantidade   SMALLINT NOT NULL DEFAULT 0,
  registrado_por UUID REFERENCES public.usuarios(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por academia + dia + hora
CREATE INDEX IF NOT EXISTS idx_ocupacao_academia_id_dia_hora
  ON public.ocupacao_academia (academia_id, dia_semana, hora);

-- RLS
ALTER TABLE public.ocupacao_academia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ocupacao_select_academia" ON public.ocupacao_academia;
DROP POLICY IF EXISTS "ocupacao_admin_write"     ON public.ocupacao_academia;

CREATE POLICY "ocupacao_select_academia"
ON public.ocupacao_academia FOR SELECT
USING (academia_id = get_user_academia_id());

CREATE POLICY "ocupacao_admin_write"
ON public.ocupacao_academia FOR ALL
USING (get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id())
WITH CHECK (get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id());

-- ----------------------------------------------------------------
-- 3. ANAMNESE DIGITAL
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anamneses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academia_id     UUID NOT NULL REFERENCES public.academias(id) ON DELETE CASCADE,
  aluno_id        UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  -- Status do fluxo
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondida')),
  -- Dados de saúde
  objetivo        TEXT,          -- Ex: "Perda de peso", "Hipertrofia", etc.
  nivel_atividade TEXT,          -- "sedentario", "leve", "moderado", "intenso"
  tem_lesoes      BOOLEAN DEFAULT FALSE,
  descricao_lesoes TEXT,
  doencas_preexistentes TEXT,
  medicamentos    TEXT,
  cirurgias       TEXT,
  -- Hábitos
  horas_sono      SMALLINT,      -- horas por noite
  nivel_stress    SMALLINT CHECK (nivel_stress BETWEEN 1 AND 5),
  consome_alcool  BOOLEAN DEFAULT FALSE,
  fumante         BOOLEAN DEFAULT FALSE,
  -- Restrições alimentares / alergias
  restricoes_alimentares TEXT,
  -- Observações gerais do aluno
  observacoes     TEXT,
  -- Metadata
  respondida_em   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamneses_aluno  ON public.anamneses (aluno_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_academia ON public.anamneses (academia_id);

-- RLS
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anamneses_prof_admin_all"  ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_aluno_select"    ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_aluno_update"    ON public.anamneses;

CREATE POLICY "anamneses_prof_admin_all"
ON public.anamneses FOR ALL
USING (get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id())
WITH CHECK (get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id());

CREATE POLICY "anamneses_aluno_select"
ON public.anamneses FOR SELECT
USING (
  aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
);

CREATE POLICY "anamneses_aluno_update"
ON public.anamneses FOR UPDATE
USING (
  aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
)
WITH CHECK (
  aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
);
