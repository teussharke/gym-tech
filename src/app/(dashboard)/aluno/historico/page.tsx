'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

const diaColors: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  B: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  C: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function HistoricoPage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'A' | 'B' | 'C'>('todos')

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchHistorico = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)
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
    setLoading(false)
  }, [alunoId])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { if (alunoId) fetchHistorico() }, [alunoId, fetchHistorico])

  const filtered = historico.filter(h => {
    if (filtro === 'todos') return true
    return (h.treino as unknown as { dia_semana: string })?.dia_semana === filtro
  })

  const totalTreinos = historico.length
  const mediaDuracao = historico.filter(h => h.duracao_min).length > 0
    ? Math.round(historico.filter(h => h.duracao_min).reduce((s, h) => s + (h.duracao_min ?? 0), 0) / historico.filter(h => h.duracao_min).length)
    : 0
  const taxaConclusao = totalTreinos > 0
    ? Math.round((historico.filter(h => h.status === 'concluido').length / totalTreinos) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (historico.length === 0) return (
    <div className="max-w-2xl mx-auto card-base p-12 text-center">
      <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhum treino registrado</h2>
      <p className="text-gray-500">Conclua seu primeiro treino para começar o histórico.</p>
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
        <div className="stat-card text-center">
          <Dumbbell className="w-5 h-5 text-primary-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTreinos}</p>
          <p className="text-xs text-gray-400">Treinos</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mediaDuracao}</p>
          <p className="text-xs text-gray-400">Min. médio</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{taxaConclusao}%</p>
          <p className="text-xs text-gray-400">Concluídos</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['todos', 'A', 'B', 'C'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtro === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            {f === 'todos' ? 'Todos' : `Treino ${f}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(h => {
          const isExpanded = expandedId === h.id
          const dia = (h.treino as unknown as { dia_semana: string })?.dia_semana
          const nomeTreino = (h.treino as unknown as { nome: string })?.nome ?? 'Treino livre'

          return (
            <div key={h.id} className="card-base overflow-hidden">
              <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : h.id)}>
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{nomeTreino}</p>
                    {dia && <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${diaColors[dia] ?? 'badge-gray'}`}>{dia}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {format(new Date(h.data_treino), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    {h.duracao_min && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{h.duracao_min} min
                      </span>
                    )}
                    <span className={`text-xs font-medium ${h.status === 'concluido' ? 'text-green-500' : 'text-amber-500'}`}>
                      {h.status === 'concluido' ? '✓ Concluído' : '⚠ Interrompido'}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {isExpanded && h.exercicios_realizados && h.exercicios_realizados.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Exercícios</p>
                  <div className="space-y-2">
                    {h.exercicios_realizados.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{ex.nome}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{ex.series}x{ex.repeticoes}</span>
                          {ex.carga > 0 && <span className="font-semibold text-primary-600 dark:text-primary-400">{ex.carga}kg</span>}
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
          <div className="card-base p-8 text-center">
            <p className="text-gray-400">Nenhum treino encontrado com esse filtro.</p>
          </div>
        )}
      </div>
    </div>
  )
}
