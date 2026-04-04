'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smile, Frown, Meh, MessageSquare, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

interface Feedback {
  id: string
  data_treino: string
  feedback_cansaco: number | null
  feedback_dor: number | null
  feedback_dificuldade: number | null
  feedback_comentario: string | null
  exercicios_realizados: unknown
  treinos: { nome: string; dia_semana: string | null } | null
  aluno: {
    id: string
    usuario: { nome: string } | null
  } | null
}

interface AlunoGroup {
  alunoId: string
  nome: string
  feedbacks: Feedback[]
}

const cansacoIcons = ['😌', '🙂', '😐', '😓', '😵']
const dorIcons = ['💚', '🟡', '🟠', '🔴', '💥']
const difIcons = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐']

function ScaleDisplay({ value, icons, label }: { value: number | null; icons: string[]; label: string }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>
  return (
    <div className="text-center">
      <span className="text-xl">{icons[value - 1]}</span>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function levelColor(v: number | null) {
  if (!v) return 'bg-gray-100 dark:bg-gray-700'
  if (v <= 2) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  if (v <= 3) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  const maxVal = Math.max(fb.feedback_cansaco ?? 0, fb.feedback_dor ?? 0, fb.feedback_dificuldade ?? 0)
  return (
    <div className={clsx('rounded-2xl border p-4 space-y-3', levelColor(maxVal))}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {fb.treinos?.nome ?? 'Treino'}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(fb.data_treino + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'short', day: '2-digit', month: 'short'
            })}
            {fb.treinos?.dia_semana && ` · ${fb.treinos.dia_semana}`}
          </p>
        </div>
        {maxVal >= 4 && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
            Atenção
          </span>
        )}
      </div>

      <div className="flex gap-4 justify-around">
        <ScaleDisplay value={fb.feedback_cansaco} icons={cansacoIcons} label="Cansaço" />
        <ScaleDisplay value={fb.feedback_dor} icons={dorIcons} label="Dor" />
        <ScaleDisplay value={fb.feedback_dificuldade} icons={difIcons} label="Dificuldade" />
      </div>

      {fb.feedback_comentario && (
        <div className="flex gap-2 bg-white/60 dark:bg-gray-800/60 rounded-xl p-3">
          <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{fb.feedback_comentario}"</p>
        </div>
      )}
    </div>
  )
}

export default function FeedbacksPage() {
  const { usuario } = useAuth()
  const [groups, setGroups] = useState<AlunoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const fetchFeedbacks = useCallback(async () => {
    if (!usuario?.academia_id) { setLoading(false); return }
    setLoading(true)
    try {
      // Buscar feedbacks dos últimos 30 dias
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const sinceStr = since.toISOString().split('T')[0]

      const { data } = await supabase
        .from('historico_treinos')
        .select(`
          id, data_treino, feedback_cansaco, feedback_dor,
          feedback_dificuldade, feedback_comentario, exercicios_realizados,
          treinos (nome, dia_semana),
          aluno:alunos (
            id,
            usuario:usuarios (nome)
          )
        `)
        .eq('academia_id', usuario.academia_id)
        .not('feedback_cansaco', 'is', null)
        .gte('data_treino', sinceStr)
        .order('data_treino', { ascending: false })

      const raw = (data ?? []) as unknown as Feedback[]

      // Agrupar por aluno
      const map: Record<string, AlunoGroup> = {}
      for (const fb of raw) {
        const alunoId = fb.aluno?.id ?? 'unknown'
        const nome = (fb.aluno?.usuario as unknown as { nome: string } | null)?.nome ?? 'Aluno'
        if (!map[alunoId]) map[alunoId] = { alunoId, nome, feedbacks: [] }
        map[alunoId].feedbacks.push(fb)
      }

      const sorted = Object.values(map).sort((a, b) => {
        // Alunos com feedbacks de atenção primeiro
        const aMax = Math.max(...a.feedbacks.map(f =>
          Math.max(f.feedback_cansaco ?? 0, f.feedback_dor ?? 0, f.feedback_dificuldade ?? 0)
        ))
        const bMax = Math.max(...b.feedbacks.map(f =>
          Math.max(f.feedback_cansaco ?? 0, f.feedback_dor ?? 0, f.feedback_dificuldade ?? 0)
        ))
        return bMax - aMax
      })

      setGroups(sorted)
      // Expandir primeiro aluno por padrão
      if (sorted.length > 0) setExpanded({ [sorted[0].alunoId]: true })
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.academia_id])

  useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center animate-float">
          <Smile className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-400 text-sm">Carregando feedbacks...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Feedbacks dos Treinos</h1>
        <p className="text-gray-500 text-sm mt-1">Últimos 30 dias · Como os alunos se sentiram após cada treino</p>
      </div>

      {groups.length === 0 ? (
        <div className="card-base p-12 text-center">
          <div className="text-5xl mb-4 animate-float">😊</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhum feedback ainda</h2>
          <p className="text-gray-500 text-sm">Os alunos enviam o feedback ao finalizar cada treino.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => {
            const alertas = g.feedbacks.filter(f =>
              Math.max(f.feedback_cansaco ?? 0, f.feedback_dor ?? 0, f.feedback_dificuldade ?? 0) >= 4
            ).length
            const avgCansaco = g.feedbacks.reduce((s, f) => s + (f.feedback_cansaco ?? 0), 0) / g.feedbacks.length
            const avgDor = g.feedbacks.reduce((s, f) => s + (f.feedback_dor ?? 0), 0) / g.feedbacks.length
            const avgDif = g.feedbacks.reduce((s, f) => s + (f.feedback_dificuldade ?? 0), 0) / g.feedbacks.length

            return (
              <div key={g.alunoId} className="card-base overflow-hidden">
                <button onClick={() => toggle(g.alunoId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white font-black text-sm">
                      {g.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{g.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{g.feedbacks.length} treino{g.feedbacks.length !== 1 ? 's' : ''}</span>
                        {alertas > 0 && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                            {alertas} alerta{alertas !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex gap-3 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Cansaço</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300">{avgCansaco.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Dor</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300">{avgDor.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Dif.</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300">{avgDif.toFixed(1)}</p>
                      </div>
                    </div>
                    {expanded[g.alunoId]
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </button>

                {expanded[g.alunoId] && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    {g.feedbacks.map(fb => (
                      <FeedbackCard key={fb.id} fb={fb} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
