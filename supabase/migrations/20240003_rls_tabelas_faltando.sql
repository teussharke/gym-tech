-- =============================================================
-- MIGRATION: Políticas RLS faltando em múltiplas tabelas
-- VERSÃO CORRIGIDA: registro_cargas e medidas_corporais
--                  NÃO possuem coluna academia_id — usam JOIN
-- EXECUTAR: Cole no SQL Editor do Supabase e clique em "Run"
-- =============================================================

-- Remove políticas antigas que possam ter sido criadas parcialmente
DROP POLICY IF EXISTS "professores_select_academia"    ON public.professores;
DROP POLICY IF EXISTS "professores_admin_write"         ON public.professores;
DROP POLICY IF EXISTS "medidas_prof_admin_all"          ON public.medidas_corporais;
DROP POLICY IF EXISTS "medidas_aluno_select"            ON public.medidas_corporais;
DROP POLICY IF EXISTS "planos_select_academia"          ON public.planos;
DROP POLICY IF EXISTS "planos_admin_write"              ON public.planos;
DROP POLICY IF EXISTS "academias_select_own"            ON public.academias;
DROP POLICY IF EXISTS "academias_admin_write"           ON public.academias;
DROP POLICY IF EXISTS "registro_cargas_aluno_insert"    ON public.registro_cargas;
DROP POLICY IF EXISTS "registro_cargas_select"          ON public.registro_cargas;
DROP POLICY IF EXISTS "registro_cargas_aluno_update"    ON public.registro_cargas;
DROP POLICY IF EXISTS "avaliacoes_prof_admin_update"    ON public.avaliacoes_fisicas;
DROP POLICY IF EXISTS "avaliacoes_prof_admin_delete"    ON public.avaliacoes_fisicas;
DROP POLICY IF EXISTS "logs_admin_all"                  ON public.logs_sistema;
DROP POLICY IF EXISTS "logs_insert_authenticated"       ON public.logs_sistema;

-- ----------------------------------------------------------------
-- 1. PROFESSORES  (tem academia_id)
--    Sem políticas: professor_id fica NULL em avaliações e
--    página de alunos não calcula "meus alunos"
-- ----------------------------------------------------------------
CREATE POLICY "professores_select_academia"
ON public.professores FOR SELECT
USING (academia_id = get_user_academia_id());

CREATE POLICY "professores_admin_write"
ON public.professores FOR ALL
USING (get_user_role() = 'admin' AND academia_id = get_user_academia_id())
WITH CHECK (get_user_role() = 'admin' AND academia_id = get_user_academia_id());

-- ----------------------------------------------------------------
-- 2. MEDIDAS_CORPORAIS  (SEM academia_id — usa JOIN)
--    Sem políticas: JOIN no histórico de avaliações falha,
--    carregamento trava para sempre
-- ----------------------------------------------------------------
CREATE POLICY "medidas_prof_admin_all"
ON public.medidas_corporais FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avaliacoes_fisicas af
    WHERE af.id = medidas_corporais.avaliacao_id
      AND af.academia_id = get_user_academia_id()
      AND get_user_role() IN ('admin', 'professor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avaliacoes_fisicas af
    WHERE af.id = medidas_corporais.avaliacao_id
      AND af.academia_id = get_user_academia_id()
      AND get_user_role() IN ('admin', 'professor')
  )
);

CREATE POLICY "medidas_aluno_select"
ON public.medidas_corporais FOR SELECT
USING (
  aluno_id IN (
    SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
  )
);

-- ----------------------------------------------------------------
-- 3. PLANOS  (tem academia_id)
--    Sem políticas: nome do plano nunca carrega nas listagens
-- ----------------------------------------------------------------
CREATE POLICY "planos_select_academia"
ON public.planos FOR SELECT
USING (academia_id = get_user_academia_id());

CREATE POLICY "planos_admin_write"
ON public.planos FOR ALL
USING (get_user_role() = 'admin' AND academia_id = get_user_academia_id())
WITH CHECK (get_user_role() = 'admin' AND academia_id = get_user_academia_id());

-- ----------------------------------------------------------------
-- 4. ACADEMIAS  (PK é "id", não tem academia_id)
--    Sem políticas: dados da academia nunca carregam
-- ----------------------------------------------------------------
CREATE POLICY "academias_select_own"
ON public.academias FOR SELECT
USING (id = get_user_academia_id());

CREATE POLICY "academias_admin_write"
ON public.academias FOR ALL
USING (get_user_role() = 'admin' AND id = get_user_academia_id())
WITH CHECK (get_user_role() = 'admin' AND id = get_user_academia_id());

-- ----------------------------------------------------------------
-- 5. REGISTRO_CARGAS  (SEM academia_id — usa JOIN via alunos)
--    Sem políticas: alunos não conseguem registrar cargas
-- ----------------------------------------------------------------
CREATE POLICY "registro_cargas_aluno_insert"
ON public.registro_cargas FOR INSERT
WITH CHECK (
  aluno_id IN (
    SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "registro_cargas_select"
ON public.registro_cargas FOR SELECT
USING (
  get_user_role() IN ('admin', 'professor')
  OR aluno_id IN (
    SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "registro_cargas_aluno_update"
ON public.registro_cargas FOR UPDATE
USING (
  aluno_id IN (
    SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
  )
);

-- ----------------------------------------------------------------
-- 6. AVALIACOES_FISICAS — adicionar UPDATE e DELETE para prof/admin
--    (já existem SELECT e INSERT no schema original)
-- ----------------------------------------------------------------
CREATE POLICY "avaliacoes_prof_admin_update"
ON public.avaliacoes_fisicas FOR UPDATE
USING (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
)
WITH CHECK (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);

CREATE POLICY "avaliacoes_prof_admin_delete"
ON public.avaliacoes_fisicas FOR DELETE
USING (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);

-- ----------------------------------------------------------------
-- 7. LOGS_SISTEMA  (tem academia_id)
--    Sem políticas: logs de sistema não são gravados
-- ----------------------------------------------------------------
CREATE POLICY "logs_admin_all"
ON public.logs_sistema FOR ALL
USING (get_user_role() = 'admin' AND academia_id = get_user_academia_id())
WITH CHECK (get_user_role() = 'admin' AND academia_id = get_user_academia_id());

CREATE POLICY "logs_insert_authenticated"
ON public.logs_sistema FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND academia_id = get_user_academia_id());
