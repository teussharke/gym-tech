'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

interface ExercicioRealizado {
  exercicio_id: string
  nome: string
  series: number
  repeticoes: string
  carga: number
  concluido: boolean
}

interface Historico {
  id: string
  data_treino: string
  duracao_min: number | null
  status: string
  exercicios_realizados: ExercicioRealizado[]
  treino: { nome: string; dia_semana: string | null } | null
}

const DIA_CONFIG: Record<string, { gradient: string; label: string }> = {
  A: { gradient: 'from-blue-500 to-blue-600', label: 'A' },
  B: { gradient: 'from-green-500 to-green-600', label: 'B' },
  C: { gradient: 'from-purple-500 to-purple-600', label: 'C' },
  D: { gradient: 'from-orange-500 to-orange-600', label: 'D' },
}

export default function HistoricoPage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'A' | 'B' | 'C' | 'D'>('todos')

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) { setLoading(false); return }
    try {
      const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
      if (data) setAlunoId(data.id)
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [usuario?.id])

  const fetchHistorico = useCallback(async () => {
    if (!alunoId) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('historico_treinos')
        .select(`
          id, data_treino, duracao_min, status, exercicios_realizados,
          treino:treinos (nome, dia_semana)
        `)
        .eq('aluno_id', alunoId)
        .order('data_treino', { ascending: false })
        .limit(30)
      setHistorico((data as unknown as Historico[]) ?? [])
    } catch {
      setHistorico([])
    } finally {
      setLoading(false)
    }
  }, [alunoId])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { if (alunoId) fetchHistorico() }, [alunoId, fetchHistorico])

  const filtered = historico.filter(h => {
    if (filtro === 'todos') return true
    return (h.treino as unknown as { dia_semana: string })?.dia_semana === filtro
  })

  const totalTreinos = historico.length
  const mediaDuracao = (() => {
    const comDur = historico.filter(h => h.duracao_min)
    return comDur.length > 0
      ? Math.round(comDur.reduce((s, h) => s + (h.duracao_min ?? 0), 0) / comDur.length)
      : 0
  })()
  const taxaConclusao = totalTreinos > 0
    ? Math.round((historico.filter(h => h.status === 'concluido').length / totalTreinos) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (historico.length === 0) return (
    <div className="max-w-2xl mx-auto card-base p-12 text-center animate-fade-in">
      <div className="w-20 h-20 bg-[var(--bg-chip)] rounded-full flex items-center justify-center mx-auto mb-4">
        <Dumbbell className="w-10 h-10 text-[var(--text-3)]" />
      </div>
      <h2 className="text-lg font-bold text-[var(--text-1)] mb-2">Nenhum treino registrado</h2>
      <p className="text-[var(--text-3)]">Conclua seu primeiro treino para começar o histórico.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Histórico de Treinos</h1>
        <p className="page-subtitle">{totalTreinos} treinos realizados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card-gradient gradient-orange relative overflow-hidden text-center">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <Dumbbell className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{totalTreinos}</p>
            <p className="text-white/70 text-xs">Treinos</p>
          </div>
        </div>
        <div className="stat-card-gradient gradient-blue relative overflow-hidden text-center">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <Clock className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{mediaDuracao}</p>
            <p className="text-white/70 text-xs">Min. médio</p>
          </div>
        </div>
        <div className="stat-card-gradient gradient-success relative overflow-hidden text-center">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <TrendingUp className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{taxaConclusao}%</p>
            <p className="text-white/70 text-xs">Concluídos</p>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['todos', 'A', 'B', 'C', 'D'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={clsx(
              'flex-1 text-xs font-bold py-2 rounded-xl transition-all active:scale-95',
              filtro === f
                ? f === 'todos'
                  ? 'gradient-orange text-white shadow-sm shadow-orange-500/20'
                  : `bg-gradient-to-r ${DIA_CONFIG[f]?.gradient ?? 'gradient-orange'} text-white shadow-sm`
                : 'bg-[var(--bg-chip)] text-[var(--text-2)] hover:text-[var(--text-1)]'
            )}
          >
            {f === 'todos' ? 'Todos' : `Treino ${f}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((h, idx) => {
          const isExpanded = expandedId === h.id
          const dia = (h.treino as unknown as { dia_semana: string })?.dia_semana
          const nomeTreino = (h.treino as unknown as { nome: string })?.nome ?? 'Treino livre'
          const diaConfig = dia ? DIA_CONFIG[dia] : null
          const concluido = h.status === 'concluido'

          return (
            <div
              key={h.id}
              className={clsx(
                'card-base overflow-hidden transition-all duration-200',
                idx === 0 && 'border border-[var(--border-neon)]'
              )}
            >
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-card-h)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : h.id)}
              >
                {/* Dia badge */}
                {diaConfig ? (
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm bg-gradient-to-br',
                    diaConfig.gradient
                  )}>
                    {diaConfig.label}
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-[var(--bg-chip)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[var(--text-3)]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[var(--text-1)] text-sm truncate">{nomeTreino}</p>
                    {idx === 0 && (
                      <span className="badge-info text-xs flex-shrink-0">Último</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-[var(--text-3)]">
                      {format(new Date(h.data_treino), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    {h.duracao_min && (
                      <span className="text-xs text-[var(--text-3)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />{h.duracao_min} min
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {concluido ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" />
                    : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />
                  }
                </div>
              </div>

              {isExpanded && h.exercicios_realizados && h.exercicios_realizados.length > 0 && (
                <div className="border-t border-[var(--border)] p-4 animate-fade-in">
                  <p className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Exercícios</p>
                  <div className="space-y-2">
                    {h.exercicios_realizados.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between bg-[var(--bg-chip)] rounded-xl p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[var(--neon-dim)] text-[var(--neon)] text-xs font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-[var(--text-1)] font-medium">{ex.nome}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[var(--text-3)]">{ex.series}×{ex.repeticoes}</span>
                          {ex.carga > 0 && (
                            <span className="font-bold text-[var(--neon)]">{ex.carga}kg</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card-base p-10 text-center">
            <Dumbbell className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3" />
            <p className="text-[var(--text-3)]">Nenhum treino encontrado com esse filtro.</p>
          </div>
        )}
      </div>
    </div>
  )
}
