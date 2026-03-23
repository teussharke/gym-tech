// =====================================================
// GymFlow - TypeScript Types
// =====================================================

export type UserRole = 'admin' | 'professor' | 'aluno'
export type UserStatus = 'ativo' | 'inativo' | 'suspenso'
export type PaymentStatus = 'pago' | 'pendente' | 'vencido' | 'cancelado'
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto'
export type MuscleGroup = 'peito' | 'costas' | 'pernas' | 'ombro' | 'biceps' | 'triceps' | 'abdomen' | 'cardio' | 'gluteos' | 'panturrilha' | 'antebraco' | 'corpo_todo'
export type ExerciseLevel = 'iniciante' | 'intermediario' | 'avancado'
export type WorkoutDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type NotificationType = 'info' | 'aviso' | 'pagamento' | 'treino' | 'avaliacao' | 'checkin'

// ---- Tabelas do banco ----

export interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string
  role: UserRole
  status: UserStatus
  foto_url?: string
  data_nascimento?: string
  cpf?: string
  endereco?: Record<string, string>
  academia_id?: string
  configuracoes?: {
    tema: 'light' | 'dark'
    notificacoes: boolean
  }
  ultimo_login?: string
  created_at: string
  updated_at: string
}

export interface Academia {
  id: string
  nome: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: Record<string, string>
  logo_url?: string
  configuracoes?: Record<string, unknown>
  plano_saas: string
  created_at: string
  updated_at: string
}

export interface Plano {
  id: string
  academia_id: string
  nome: string
  descricao?: string
  valor: number
  duracao_dias: number
  max_checkins_dia: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Professor {
  id: string
  usuario_id: string
  academia_id: string
  cref?: string
  especialidades?: string[]
  bio?: string
  created_at: string
  updated_at: string
  // Joins
  usuario?: Usuario
}

export interface Aluno {
  id: string
  usuario_id: string
  academia_id: string
  professor_id?: string
  plano_id?: string
  matricula: string
  data_matricula: string
  data_vencimento?: string
  status_pagamento: PaymentStatus
  objetivos?: string
  observacoes?: string
  created_at: string
  updated_at: string
  // Joins
  usuario?: Usuario
  plano?: Plano
  professor?: Professor
}

export interface Exercicio {
  id: string
  academia_id?: string
  nome: string
  descricao?: string
  grupo_muscular: MuscleGroup
  grupos_secundarios?: MuscleGroup[]
  equipamento?: string
  nivel: ExerciseLevel
  gif_url?: string
  video_url?: string
  instrucoes?: string
  dicas?: string
  is_publico: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Treino {
  id: string
  aluno_id: string
  professor_id?: string
  academia_id: string
  nome: string
  descricao?: string
  objetivo?: string
  dia_semana?: WorkoutDay
  ativo: boolean
  ordem: number
  duracao_estimada_min?: number
  created_at: string
  updated_at: string
  // Joins
  exercicios?: TreinoExercicio[]
  aluno?: Aluno
}

export interface TreinoExercicio {
  id: string
  treino_id: string
  exercicio_id: string
  ordem: number
  series: number
  repeticoes: string
  carga_sugerida?: number
  tempo_descanso_seg: number
  tempo_execucao_seg?: number
  observacoes?: string
  created_at: string
  // Joins
  exercicio?: Exercicio
}

export interface HistoricoTreino {
  id: string
  aluno_id: string
  treino_id?: string
  academia_id: string
  data_treino: string
  hora_inicio?: string
  hora_fim?: string
  duracao_min?: number
  exercicios_realizados: ExercicioRealizado[]
  observacoes?: string
  status: 'concluido' | 'interrompido'
  created_at: string
  // Joins
  treino?: Treino
}

export interface ExercicioRealizado {
  exercicio_id: string
  nome?: string
  series: number
  repeticoes: string
  carga: number
  concluido: boolean
}

export interface RegistroCarga {
  id: string
  aluno_id: string
  exercicio_id: string
  historico_treino_id?: string
  data_registro: string
  series_realizadas?: number
  repeticoes_realizadas?: string
  carga_utilizada?: number
  observacoes?: string
  created_at: string
  // Joins
  exercicio?: Exercicio
}

export interface AvaliacaoFisica {
  id: string
  aluno_id: string
  professor_id?: string
  academia_id: string
  data_avaliacao: string
  peso_kg?: number
  altura_cm?: number
  imc?: number
  percentual_gordura?: number
  massa_magra_kg?: number
  massa_gorda_kg?: number
  metabolismo_basal?: number
  agua_corporal?: number
  massa_ossea?: number
  idade_metabolica?: number
  observacoes?: string
  created_at: string
  updated_at: string
  // Joins
  medidas?: MedidaCorporal
  fotos?: FotoProgresso[]
}

export interface MedidaCorporal {
  id: string
  aluno_id: string
  avaliacao_id?: string
  data_medicao: string
  braco_direito?: number
  braco_esquerdo?: number
  antebraco_direito?: number
  antebraco_esquerdo?: number
  peito?: number
  cintura?: number
  abdomen?: number
  quadril?: number
  coxa_direita?: number
  coxa_esquerda?: number
  panturrilha_direita?: number
  panturrilha_esquerda?: number
  ombro?: number
  observacoes?: string
  created_at: string
}

export interface FotoProgresso {
  id: string
  aluno_id: string
  avaliacao_id?: string
  url: string
  tipo?: 'frente' | 'costas' | 'lateral_esquerda' | 'lateral_direita' | 'outro'
  data_foto: string
  observacoes?: string
  created_at: string
}

export interface Presenca {
  id: string
  aluno_id: string
  academia_id: string
  data_checkin: string
  data_checkout?: string
  duracao_min?: number
  tipo: 'presencial' | 'online'
  created_at: string
  // Joins
  aluno?: Aluno
}

export interface Pagamento {
  id: string
  aluno_id: string
  academia_id: string
  plano_id?: string
  valor: number
  valor_desconto: number
  forma_pagamento: PaymentMethod
  status: PaymentStatus
  data_vencimento: string
  data_pagamento?: string
  referencia_mes?: number
  referencia_ano?: number
  comprovante_url?: string
  observacoes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joins
  aluno?: Aluno
  plano?: Plano
}

export interface Notificacao {
  id: string
  usuario_id: string
  academia_id: string
  tipo: NotificationType
  titulo: string
  mensagem: string
  lida: boolean
  link?: string
  data_leitura?: string
  created_at: string
}

// ---- Types para formulários ----

export interface LoginForm {
  email: string
  password: string
}

export interface CreateUserForm {
  nome: string
  email: string
  telefone?: string
  role: UserRole
  data_nascimento?: string
  cpf?: string
}

export interface CreateTreinoForm {
  nome: string
  descricao?: string
  objetivo?: string
  dia_semana?: WorkoutDay
  aluno_id: string
}

export interface CreateAvaliacaoForm {
  aluno_id: string
  data_avaliacao: string
  peso_kg?: number
  altura_cm?: number
  percentual_gordura?: number
  medidas?: Partial<MedidaCorporal>
  observacoes?: string
}

// ---- Types para Dashboard ----

export interface DashboardStats {
  totalAlunos: number
  alunosAtivos: number
  alunosInadimplentes: number
  frequenciaMensal: number
  faturamentoMensal: number
  checkinHoje: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

// ---- Database type for Supabase ----
export interface Database {
  public: {
    Tables: {
      usuarios: { Row: Usuario; Insert: Partial<Usuario>; Update: Partial<Usuario> }
      academias: { Row: Academia; Insert: Partial<Academia>; Update: Partial<Academia> }
      planos: { Row: Plano; Insert: Partial<Plano>; Update: Partial<Plano> }
      professores: { Row: Professor; Insert: Partial<Professor>; Update: Partial<Professor> }
      alunos: { Row: Aluno; Insert: Partial<Aluno>; Update: Partial<Aluno> }
      exercicios: { Row: Exercicio; Insert: Partial<Exercicio>; Update: Partial<Exercicio> }
      treinos: { Row: Treino; Insert: Partial<Treino>; Update: Partial<Treino> }
      treino_exercicios: { Row: TreinoExercicio; Insert: Partial<TreinoExercicio>; Update: Partial<TreinoExercicio> }
      historico_treinos: { Row: HistoricoTreino; Insert: Partial<HistoricoTreino>; Update: Partial<HistoricoTreino> }
      registro_cargas: { Row: RegistroCarga; Insert: Partial<RegistroCarga>; Update: Partial<RegistroCarga> }
      avaliacoes_fisicas: { Row: AvaliacaoFisica; Insert: Partial<AvaliacaoFisica>; Update: Partial<AvaliacaoFisica> }
      medidas_corporais: { Row: MedidaCorporal; Insert: Partial<MedidaCorporal>; Update: Partial<MedidaCorporal> }
      fotos_progresso: { Row: FotoProgresso; Insert: Partial<FotoProgresso>; Update: Partial<FotoProgresso> }
      presencas: { Row: Presenca; Insert: Partial<Presenca>; Update: Partial<Presenca> }
      pagamentos: { Row: Pagamento; Insert: Partial<Pagamento>; Update: Partial<Pagamento> }
      notificacoes: { Row: Notificacao; Insert: Partial<Notificacao>; Update: Partial<Notificacao> }
    }
  }
}
