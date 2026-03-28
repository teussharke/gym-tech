-- Horários disponíveis do professor para avaliações
CREATE TABLE public.horarios_disponiveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_min INTEGER DEFAULT 60,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitações de avaliação física pelo aluno
CREATE TABLE public.solicitacoes_avaliacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  horario_id UUID REFERENCES public.horarios_disponiveis(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, aprovado, recusado, cancelado
  observacoes_aluno TEXT,
  observacoes_professor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_horarios_professor ON public.horarios_disponiveis(professor_id);
CREATE INDEX idx_horarios_academia ON public.horarios_disponiveis(academia_id);
CREATE INDEX idx_solicitacoes_aluno ON public.solicitacoes_avaliacao(aluno_id);
CREATE INDEX idx_solicitacoes_professor ON public.solicitacoes_avaliacao(professor_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_avaliacao(status);

-- RLS
ALTER TABLE public.horarios_disponiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_avaliacao ENABLE ROW LEVEL SECURITY;

-- Professores e admins gerenciam horários
CREATE POLICY "horarios_prof_admin_all"
ON public.horarios_disponiveis FOR ALL
USING (academia_id = get_user_academia_id() AND get_user_role() IN ('admin', 'professor'))
WITH CHECK (academia_id = get_user_academia_id() AND get_user_role() IN ('admin', 'professor'));

-- Alunos podem ver horários disponíveis
CREATE POLICY "horarios_aluno_select"
ON public.horarios_disponiveis FOR SELECT
USING (academia_id = get_user_academia_id() AND disponivel = true);

-- Alunos podem criar solicitações
CREATE POLICY "solicitacoes_aluno_insert"
ON public.solicitacoes_avaliacao FOR INSERT
WITH CHECK (
  aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  AND academia_id = get_user_academia_id()
);

-- Aluno vê suas próprias solicitações
CREATE POLICY "solicitacoes_aluno_select"
ON public.solicitacoes_avaliacao FOR SELECT
USING (
  aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  OR get_user_role() IN ('admin', 'professor')
);

-- Aluno pode cancelar (UPDATE status = cancelado) apenas as suas
CREATE POLICY "solicitacoes_aluno_cancel"
ON public.solicitacoes_avaliacao FOR UPDATE
USING (
  (aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid()))
  OR get_user_role() IN ('admin', 'professor')
)
WITH CHECK (
  (aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid()))
  OR get_user_role() IN ('admin', 'professor')
);
