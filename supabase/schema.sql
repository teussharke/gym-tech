-- =====================================================
-- GYMFLOW - Schema Completo do Banco de Dados
-- Execute no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'professor', 'aluno');
CREATE TYPE user_status AS ENUM ('ativo', 'inativo', 'suspenso');
CREATE TYPE payment_status AS ENUM ('pago', 'pendente', 'vencido', 'cancelado');
CREATE TYPE payment_method AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto');
CREATE TYPE muscle_group AS ENUM ('peito', 'costas', 'pernas', 'ombro', 'biceps', 'triceps', 'abdomen', 'cardio', 'gluteos', 'panturrilha', 'antebraco', 'corpo_todo');
CREATE TYPE exercise_level AS ENUM ('iniciante', 'intermediario', 'avancado');
CREATE TYPE workout_day AS ENUM ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo', 'A', 'B', 'C', 'D', 'E', 'F');
CREATE TYPE notification_type AS ENUM ('info', 'aviso', 'pagamento', 'treino', 'avaliacao', 'checkin');

-- =====================================================
-- TABELA: usuarios (extende auth.users do Supabase)
-- =====================================================

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'aluno',
  status user_status NOT NULL DEFAULT 'ativo',
  foto_url TEXT,
  data_nascimento DATE,
  cpf VARCHAR(14) UNIQUE,
  endereco JSONB DEFAULT '{}',
  academia_id UUID,
  configuracoes JSONB DEFAULT '{"tema": "light", "notificacoes": true}',
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: academias
-- =====================================================

CREATE TABLE public.academias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco JSONB DEFAULT '{}',
  logo_url TEXT,
  configuracoes JSONB DEFAULT '{}',
  plano_saas VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar foreign key para academia
ALTER TABLE public.usuarios ADD CONSTRAINT fk_academia 
  FOREIGN KEY (academia_id) REFERENCES public.academias(id) ON DELETE SET NULL;

-- =====================================================
-- TABELA: planos (planos de academia para alunos)
-- =====================================================

CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  duracao_dias INTEGER NOT NULL DEFAULT 30,
  max_checkins_dia INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: professores (dados específicos do professor)
-- =====================================================

CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  cref VARCHAR(50),
  especialidades TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: alunos (dados específicos do aluno)
-- =====================================================

CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
  plano_id UUID REFERENCES public.planos(id) ON DELETE SET NULL,
  matricula VARCHAR(50) UNIQUE,
  data_matricula DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  status_pagamento payment_status DEFAULT 'pendente',
  objetivos TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: pagamentos
-- =====================================================

CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES public.planos(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  forma_pagamento payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  referencia_mes INTEGER, -- 1-12
  referencia_ano INTEGER,
  comprovante_url TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: exercicios
-- =====================================================

CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  grupo_muscular muscle_group NOT NULL,
  grupos_secundarios muscle_group[],
  equipamento VARCHAR(255),
  nivel exercise_level NOT NULL DEFAULT 'iniciante',
  gif_url TEXT,
  video_url TEXT,
  instrucoes TEXT,
  dicas TEXT,
  is_publico BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: treinos (fichas/planos de treino)
-- =====================================================

CREATE TABLE public.treinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  dia_semana workout_day,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  duracao_estimada_min INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: treino_exercicios (exercícios em um treino)
-- =====================================================

CREATE TABLE public.treino_exercicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treino_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE,
  exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  series INTEGER NOT NULL DEFAULT 3,
  repeticoes VARCHAR(50) NOT NULL DEFAULT '12', -- pode ser "12", "8-12", "até falha"
  carga_sugerida DECIMAL(6,2),
  tempo_descanso_seg INTEGER DEFAULT 60,
  tempo_execucao_seg INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: historico_treinos (sessões de treino realizadas)
-- =====================================================

CREATE TABLE public.historico_treinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  treino_id UUID REFERENCES public.treinos(id) ON DELETE SET NULL,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  data_treino DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME,
  hora_fim TIME,
  duracao_min INTEGER,
  exercicios_realizados JSONB DEFAULT '[]', -- [{exercicio_id, series, reps, carga}]
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'concluido', -- concluido, interrompido
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: registro_cargas (evolução de carga por exercício)
-- =====================================================

CREATE TABLE public.registro_cargas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE CASCADE,
  historico_treino_id UUID REFERENCES public.historico_treinos(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  series_realizadas INTEGER,
  repeticoes_realizadas VARCHAR(50),
  carga_utilizada DECIMAL(6,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: avaliacoes_fisicas
-- =====================================================

CREATE TABLE public.avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Dados biométricos
  peso_kg DECIMAL(5,2),
  altura_cm DECIMAL(5,2),
  imc DECIMAL(5,2),
  percentual_gordura DECIMAL(5,2),
  massa_magra_kg DECIMAL(5,2),
  massa_gorda_kg DECIMAL(5,2),
  metabolismo_basal INTEGER,
  -- Bioimpedância / outros
  agua_corporal DECIMAL(5,2),
  massa_ossea DECIMAL(5,2),
  idade_metabolica INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: medidas_corporais
-- =====================================================

CREATE TABLE public.medidas_corporais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES public.avaliacoes_fisicas(id) ON DELETE CASCADE,
  data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Medidas em cm
  braco_direito DECIMAL(5,2),
  braco_esquerdo DECIMAL(5,2),
  antebraco_direito DECIMAL(5,2),
  antebraco_esquerdo DECIMAL(5,2),
  peito DECIMAL(5,2),
  cintura DECIMAL(5,2),
  abdomen DECIMAL(5,2),
  quadril DECIMAL(5,2),
  coxa_direita DECIMAL(5,2),
  coxa_esquerda DECIMAL(5,2),
  panturrilha_direita DECIMAL(5,2),
  panturrilha_esquerda DECIMAL(5,2),
  ombro DECIMAL(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: fotos_progresso
-- =====================================================

CREATE TABLE public.fotos_progresso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES public.avaliacoes_fisicas(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  tipo VARCHAR(50), -- 'frente', 'costas', 'lateral_esquerda', 'lateral_direita', 'outro'
  data_foto DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: presencas (check-ins)
-- =====================================================

CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  data_checkin TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_checkout TIMESTAMPTZ,
  duracao_min INTEGER,
  tipo VARCHAR(20) DEFAULT 'presencial', -- presencial, online
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: notificacoes
-- =====================================================

CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  tipo notification_type NOT NULL DEFAULT 'info',
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  link TEXT,
  data_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: logs_sistema
-- =====================================================

CREATE TABLE public.logs_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  tabela_afetada VARCHAR(100),
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_usuarios_role ON public.usuarios(role);
CREATE INDEX idx_usuarios_academia ON public.usuarios(academia_id);
CREATE INDEX idx_usuarios_status ON public.usuarios(status);
CREATE INDEX idx_alunos_academia ON public.alunos(academia_id);
CREATE INDEX idx_alunos_professor ON public.alunos(professor_id);
CREATE INDEX idx_alunos_plano ON public.alunos(plano_id);
CREATE INDEX idx_pagamentos_aluno ON public.pagamentos(aluno_id);
CREATE INDEX idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX idx_pagamentos_vencimento ON public.pagamentos(data_vencimento);
CREATE INDEX idx_treinos_aluno ON public.treinos(aluno_id);
CREATE INDEX idx_treino_exercicios_treino ON public.treino_exercicios(treino_id);
CREATE INDEX idx_historico_treinos_aluno ON public.historico_treinos(aluno_id);
CREATE INDEX idx_historico_treinos_data ON public.historico_treinos(data_treino);
CREATE INDEX idx_registro_cargas_aluno ON public.registro_cargas(aluno_id);
CREATE INDEX idx_registro_cargas_exercicio ON public.registro_cargas(exercicio_id);
CREATE INDEX idx_avaliacoes_aluno ON public.avaliacoes_fisicas(aluno_id);
CREATE INDEX idx_presencas_aluno ON public.presencas(aluno_id);
CREATE INDEX idx_presencas_data ON public.presencas(data_checkin);
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX idx_exercicios_grupo ON public.exercicios(grupo_muscular);
CREATE INDEX idx_exercicios_academia ON public.exercicios(academia_id);

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para calcular IMC automaticamente
CREATE OR REPLACE FUNCTION calcular_imc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.peso_kg IS NOT NULL AND NEW.altura_cm IS NOT NULL AND NEW.altura_cm > 0 THEN
    NEW.imc := ROUND((NEW.peso_kg / POWER(NEW.altura_cm / 100.0, 2))::NUMERIC, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_imc
  BEFORE INSERT OR UPDATE ON public.avaliacoes_fisicas
  FOR EACH ROW EXECUTE FUNCTION calcular_imc();

-- Função para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER trigger_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_academias_updated_at BEFORE UPDATE ON public.academias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_alunos_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_professores_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_planos_updated_at BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_exercicios_updated_at BEFORE UPDATE ON public.exercicios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_treinos_updated_at BEFORE UPDATE ON public.treinos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes_fisicas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função para gerar número de matrícula automático
CREATE OR REPLACE FUNCTION gerar_matricula()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.matricula IS NULL THEN
    NEW.matricula := 'GF' || TO_CHAR(NOW(), 'YYYY') || LPAD(NEXTVAL('matricula_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS matricula_seq START 1;
CREATE TRIGGER trigger_gerar_matricula BEFORE INSERT ON public.alunos FOR EACH ROW EXECUTE FUNCTION gerar_matricula();

-- Função para calcular frequência mensal de um aluno
CREATE OR REPLACE FUNCTION calcular_frequencia_mensal(p_aluno_id UUID, p_mes INTEGER, p_ano INTEGER)
RETURNS TABLE(total_dias INTEGER, dias_presentes INTEGER, percentual DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DAY FROM DATE_TRUNC('month', MAKE_DATE(p_ano, p_mes, 1)) + INTERVAL '1 month - 1 day')::INTEGER AS total_dias,
    COUNT(DISTINCT DATE(data_checkin))::INTEGER AS dias_presentes,
    ROUND(COUNT(DISTINCT DATE(data_checkin))::DECIMAL / 
      EXTRACT(DAY FROM DATE_TRUNC('month', MAKE_DATE(p_ano, p_mes, 1)) + INTERVAL '1 month - 1 day') * 100, 2) AS percentual
  FROM public.presencas
  WHERE aluno_id = p_aluno_id
    AND EXTRACT(MONTH FROM data_checkin) = p_mes
    AND EXTRACT(YEAR FROM data_checkin) = p_ano;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas_corporais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Função helper para obter role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Função helper para obter academia_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_academia_id()
RETURNS UUID AS $$
  SELECT academia_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- POLÍTICAS: usuarios ----
CREATE POLICY "usuarios_select_own" ON public.usuarios FOR SELECT USING (
  id = auth.uid() OR get_user_role() IN ('admin', 'professor')
);
CREATE POLICY "usuarios_update_own" ON public.usuarios FOR UPDATE USING (id = auth.uid());
CREATE POLICY "usuarios_admin_all" ON public.usuarios FOR ALL USING (get_user_role() = 'admin');

-- ---- POLÍTICAS: exercicios ----
CREATE POLICY "exercicios_select_all" ON public.exercicios FOR SELECT USING (
  is_publico = TRUE OR academia_id = get_user_academia_id()
);
CREATE POLICY "exercicios_insert_professor_admin" ON public.exercicios FOR INSERT WITH CHECK (
  get_user_role() IN ('admin', 'professor')
);
CREATE POLICY "exercicios_update_professor_admin" ON public.exercicios FOR UPDATE USING (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);
CREATE POLICY "exercicios_delete_admin" ON public.exercicios FOR DELETE USING (
  get_user_role() = 'admin' AND academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: treinos ----
CREATE POLICY "treinos_select" ON public.treinos FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  )
);
CREATE POLICY "treinos_professor_admin_write" ON public.treinos FOR ALL USING (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: alunos ----
CREATE POLICY "alunos_select" ON public.alunos FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    usuario_id = auth.uid()
  )
);
CREATE POLICY "alunos_admin_professor_write" ON public.alunos FOR ALL USING (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: pagamentos ----
CREATE POLICY "pagamentos_select" ON public.pagamentos FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  )
);
CREATE POLICY "pagamentos_admin_write" ON public.pagamentos FOR ALL USING (
  get_user_role() = 'admin' AND academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: presencas ----
CREATE POLICY "presencas_select" ON public.presencas FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  )
);
CREATE POLICY "presencas_insert_aluno" ON public.presencas FOR INSERT WITH CHECK (
  academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: notificacoes ----
CREATE POLICY "notificacoes_own" ON public.notificacoes FOR ALL USING (
  usuario_id = auth.uid() OR get_user_role() = 'admin'
);

-- ---- POLÍTICAS: avaliacoes_fisicas ----
CREATE POLICY "avaliacoes_select" ON public.avaliacoes_fisicas FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  )
);
CREATE POLICY "avaliacoes_professor_write" ON public.avaliacoes_fisicas FOR INSERT WITH CHECK (
  get_user_role() IN ('admin', 'professor') AND academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: historico_treinos ----
CREATE POLICY "historico_select" ON public.historico_treinos FOR SELECT USING (
  academia_id = get_user_academia_id() AND (
    get_user_role() IN ('admin', 'professor') OR
    aluno_id IN (SELECT id FROM public.alunos WHERE usuario_id = auth.uid())
  )
);
CREATE POLICY "historico_aluno_insert" ON public.historico_treinos FOR INSERT WITH CHECK (
  academia_id = get_user_academia_id()
);

-- ---- POLÍTICAS: fotos_progresso ----
CREATE POLICY "fotos_select" ON public.fotos_progresso FOR SELECT USING (
  aluno_id IN (
    SELECT id FROM public.alunos WHERE usuario_id = auth.uid()
  ) OR get_user_role() IN ('admin', 'professor')
);
CREATE POLICY "fotos_insert" ON public.fotos_progresso FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir academia padrão (execute após criar primeiro usuário admin)
-- INSERT INTO public.academias (id, nome, email) VALUES (uuid_generate_v4(), 'GymFlow Academia', 'admin@gymflow.com');

-- Grupos musculares e exercícios de exemplo
-- (Serão inseridos via API ou pelo admin no sistema)

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Execute no Supabase Dashboard > Storage ou via API:
-- Criar buckets: 'avatares', 'exercicios', 'fotos-progresso', 'comprovantes'

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: alunos com informações completas
CREATE OR REPLACE VIEW view_alunos_completo AS
SELECT 
  a.id,
  a.matricula,
  a.data_matricula,
  a.data_vencimento,
  a.status_pagamento,
  a.objetivos,
  u.nome,
  u.email,
  u.telefone,
  u.foto_url,
  u.status as status_usuario,
  u.academia_id,
  p.nome as plano_nome,
  p.valor as plano_valor,
  prof_u.nome as professor_nome,
  COUNT(DISTINCT ht.id) as total_treinos,
  MAX(ht.data_treino) as ultimo_treino,
  COUNT(DISTINCT DATE(pr.data_checkin)) as checkins_mes
FROM public.alunos a
JOIN public.usuarios u ON a.usuario_id = u.id
LEFT JOIN public.planos p ON a.plano_id = p.id
LEFT JOIN public.professores prof ON a.professor_id = prof.id
LEFT JOIN public.usuarios prof_u ON prof.usuario_id = prof_u.id
LEFT JOIN public.historico_treinos ht ON a.id = ht.aluno_id
LEFT JOIN public.presencas pr ON a.id = pr.aluno_id 
  AND EXTRACT(MONTH FROM pr.data_checkin) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM pr.data_checkin) = EXTRACT(YEAR FROM NOW())
GROUP BY a.id, u.id, p.id, prof_u.nome;

-- View: dashboard financeiro mensal
CREATE OR REPLACE VIEW view_financeiro_mensal AS
SELECT
  DATE_TRUNC('month', data_pagamento) as mes,
  COUNT(*) as total_pagamentos,
  SUM(valor) as total_faturamento,
  SUM(valor_desconto) as total_descontos,
  SUM(valor - COALESCE(valor_desconto, 0)) as faturamento_liquido,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagamentos_confirmados,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pagamentos_pendentes,
  COUNT(CASE WHEN status = 'vencido' THEN 1 END) as pagamentos_vencidos
FROM public.pagamentos
WHERE data_pagamento IS NOT NULL
GROUP BY DATE_TRUNC('month', data_pagamento)
ORDER BY mes DESC;

-- View: presença por aluno no mês atual
CREATE OR REPLACE VIEW view_presenca_mensal AS
SELECT
  a.id as aluno_id,
  u.nome,
  u.foto_url,
  COUNT(DISTINCT DATE(p.data_checkin)) as dias_presentes,
  MAX(p.data_checkin) as ultimo_checkin,
  a.academia_id
FROM public.alunos a
JOIN public.usuarios u ON a.usuario_id = u.id
LEFT JOIN public.presencas p ON a.id = p.aluno_id
  AND EXTRACT(MONTH FROM p.data_checkin) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM p.data_checkin) = EXTRACT(YEAR FROM NOW())
GROUP BY a.id, u.nome, u.foto_url, a.academia_id
ORDER BY dias_presentes DESC;

COMMENT ON TABLE public.usuarios IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE public.academias IS 'Academias cadastradas no sistema SaaS';
COMMENT ON TABLE public.alunos IS 'Dados específicos dos alunos';
COMMENT ON TABLE public.professores IS 'Dados específicos dos professores';
COMMENT ON TABLE public.exercicios IS 'Biblioteca de exercícios';
COMMENT ON TABLE public.treinos IS 'Fichas de treino dos alunos';
COMMENT ON TABLE public.treino_exercicios IS 'Exercícios contidos em cada treino';
COMMENT ON TABLE public.historico_treinos IS 'Sessões de treino realizadas';
COMMENT ON TABLE public.registro_cargas IS 'Evolução de carga por exercício';
COMMENT ON TABLE public.avaliacoes_fisicas IS 'Avaliações físicas periódicas';
COMMENT ON TABLE public.medidas_corporais IS 'Medidas corporais por avaliação';
COMMENT ON TABLE public.fotos_progresso IS 'Fotos de progresso dos alunos';
COMMENT ON TABLE public.presencas IS 'Registro de check-ins na academia';
COMMENT ON TABLE public.planos IS 'Planos de mensalidade disponíveis';
COMMENT ON TABLE public.pagamentos IS 'Pagamentos de mensalidades';
COMMENT ON TABLE public.notificacoes IS 'Notificações do sistema';
COMMENT ON TABLE public.logs_sistema IS 'Auditoria e logs do sistema';
