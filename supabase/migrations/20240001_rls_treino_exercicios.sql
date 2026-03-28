-- =============================================================
-- MIGRATION: Políticas RLS para treino_exercicios
-- PROBLEMA: tabela tem RLS ativo mas sem políticas → tudo bloqueado
-- EXECUTAR: Cole no SQL Editor do Supabase e clique em "Run"
-- =============================================================

-- 1. Admin e Professor podem fazer tudo em treino_exercicios
--    (validado via join com treinos → academia_id)
CREATE POLICY "treino_exercicios_prof_admin_all"
ON public.treino_exercicios
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.treinos t
    WHERE t.id = treino_exercicios.treino_id
      AND t.academia_id = get_user_academia_id()
      AND get_user_role() IN ('admin', 'professor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treinos t
    WHERE t.id = treino_exercicios.treino_id
      AND t.academia_id = get_user_academia_id()
      AND get_user_role() IN ('admin', 'professor')
  )
);

-- 2. Aluno pode VER apenas os exercícios dos seus próprios treinos
CREATE POLICY "treino_exercicios_aluno_select"
ON public.treino_exercicios
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.treinos t
    WHERE t.id = treino_exercicios.treino_id
      AND t.aluno_id IN (
        SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
      )
  )
);
