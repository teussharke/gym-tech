-- Migration: Corrigir políticas RLS com falhas de segurança
-- Problema 1: fotos_insert permite qualquer usuário autenticado inserir foto para qualquer aluno
-- Problema 2: presencas_insert_aluno não verifica se o aluno pertence ao usuário logado

-- ─────────────────────────────────────────────────────────────────
-- FIX 1: fotos_progresso — exigir que aluno_id pertença ao próprio usuário
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fotos_insert" ON public.fotos_progresso;

CREATE POLICY "fotos_insert" ON public.fotos_progresso
  FOR INSERT
  WITH CHECK (
    -- Aluno só pode inserir fotos para si mesmo
    aluno_id IN (
      SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
    )
    -- Admin e professor da mesma academia também podem inserir
    OR (
      get_user_role() IN ('admin', 'professor')
      AND aluno_id IN (
        SELECT id FROM public.alunos WHERE academia_id = get_user_academia_id()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- FIX 2: presencas — verificar que o aluno_id pertence ao usuário logado
-- (ou que quem faz insert é admin/professor da mesma academia via API)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "presencas_insert_aluno" ON public.presencas;

CREATE POLICY "presencas_insert_aluno" ON public.presencas
  FOR INSERT
  WITH CHECK (
    academia_id = get_user_academia_id()
    AND (
      -- Aluno inserindo sua própria presença
      aluno_id IN (
        SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
      )
      -- Admin ou professor da academia podem registrar presença
      OR get_user_role() IN ('admin', 'professor')
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- FIX 3: registro_cargas — garantir que o aluno_id pertence ao usuário
-- (se não tiver política já, adicionar)
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Verificar se a política já existe antes de criar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'registro_cargas'
    AND policyname = 'cargas_insert_aluno'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "cargas_insert_aluno" ON public.registro_cargas
        FOR INSERT
        WITH CHECK (
          aluno_id IN (
            SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
          )
          OR get_user_role() IN ('admin', 'professor')
        )
    $policy$;
  END IF;
END $$;
