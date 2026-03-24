'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Timer, Dumbbell, Info, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { grupoColors } from '@/lib/mock/exercicios'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface ExercicioTreino {
  id: string
  series: number
  repeticoes: string
  carga_sugerida: number | null
  tempo_descanso_seg: number
  observacoes: string | null
  ordem: number
  exercicio: {
    id: string
    nome: string
    grupo_muscular: string
    gif_url: string | null
    equipamento: string | null
  }
}

interface Treino {
  id: string
  nome: string
  dia_semana: string | null
  descricao: string | null
  duracao_estimada_min: number | null
  exercicios: ExercicioTreino[]
}

function ExercicioImagem({ gif_url, nome }: { gif_url?: string | null; nome: string }) {
  const [err, setErr] = useState(false)
  if (!gif_url || err) return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-44 flex flex-col items-center justify-center gap-2">
      <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-500" />
      <p className="text-xs text-gray-400">Sem demonstração</p>
    </div>
  )
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl h-44 overflow-hidden">
      <img src={gif_url} alt={nome} className="w-full h-full object-cover" onError={() => setErr(true)} />
    </div>
  )
}

function TimerModal({ seconds, total, active, onToggle, onClose }: {
  seconds: number; total: number; active: boolean; onToggle: () => void; onClose: () => void
}) {
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const c = 2 * Math.PI * 45

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 lg:items-center">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">⏱ Descanso</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={seconds <= 10 ? '#ef4444' : '#22c55e'} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress / 100)} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-mono text-4xl font-bold ${seconds <= 10 ? 'text-red-500' : 'text-primary-600 dark:text-primary-400'}`}>
                {fmt(seconds)}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">{total}s</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onToggle} className={clsx('flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm', active ? 'btn-secondary' : 'btn-primary')}>
            {active ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Continuar</>}
          </button>
          <button onClick={onClose} className="btn-secondary flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm">
            <RotateCcw className="w-4 h-4" />Pular
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TreinoAlunoPage() {
  const { usuario } = useAuth()
  const [treino, setTreino] = useState<Treino | null>(null)
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [states, setStates] = useState<Record<string, { concluido: boolean; carga: number | '' }>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [timerSecs, setTimerSecs] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAluno = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchTreino = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)
    try {
      // Pega o treino mais recente ativo
      const { data, error } = await supabase
        .from('treinos')
        .select(`
          id, nome, dia_semana, descricao, duracao_estimada_min,
          exercicios:treino_exercicios (
            id, series, repeticoes, carga_sugerida, tempo_descanso_seg, observacoes, ordem,
            exercicio:exercicios (id, nome, grupo_muscular, gif_url, equipamento)
          )
        `)
        .eq('aluno_id', alunoId)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        const t = data as unknown as Treino
        t.exercicios = t.exercicios.sort((a, b) => a.ordem - b.ordem)
        setTreino(t)
        setStates(Object.fromEntries(t.exercicios.map(e => [e.id, { concluido: false, carga: '' }])))
        setExpandedId(t.exercicios[0]?.id ?? null)
      }
    } catch {
      toast.error('Erro ao carregar treino')
    } finally {
      setLoading(false)
    }
  }, [alunoId])

  useEffect(() => { fetchAluno() }, [fetchAluno])
  useEffect(() => { fetchTreino() }, [fetchTreino])

  useEffect(() => {
    if (timerActive && timerSecs > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSecs(s => { if (s <= 1) { setTimerActive(false); clearInterval(intervalRef.current!); return 0 } return s - 1 })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [timerActive, timerSecs])

  const startTimer = (secs: number) => { setTimerTotal(secs); setTimerSecs(secs); setTimerActive(true); setShowTimer(true) }

  const toggleConcluido = (id: string, descanso: number) => {
    const nowConcluido = !states[id]?.concluido
    setStates(prev => ({ ...prev, [id]: { ...prev[id], concluido: nowConcluido } }))
    if (nowConcluido) {
      startTimer(descanso)
      if (treino) {
        const idx = treino.exercicios.findIndex(e => e.id === id)
        const next = treino.exercicios[idx + 1]
        if (next) setTimeout(() => setExpandedId(next.id), 400)
      }
    }
  }

  const finalizarTreino = async () => {
    if (!alunoId || !treino || !usuario?.academia_id) return
    setSaving(true)
    try {
      const exerciciosRealizados = treino.exercicios.map(ex => ({
        exercicio_id: ex.exercicio.id,
        nome: ex.exercicio.nome,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga: states[ex.id]?.carga || ex.carga_sugerida || 0,
        concluido: states[ex.id]?.concluido ?? false,
      }))

      const res = await fetch('/api/workouts/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: alunoId,
          treino_id: treino.id,
          academia_id: usuario.academia_id,
          exercicios_realizados: exerciciosRealizados,
          status: 'concluido',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Treino registrado! 🎉')
      // Reset
      setStates(Object.fromEntries(treino.exercicios.map(e => [e.id, { concluido: false, carga: '' }])))
    } catch {
      toast.error('Erro ao finalizar treino')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!treino) return (
    <div className="max-w-2xl mx-auto card-base p-12 text-center">
      <Dumbbell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhum treino ativo</h2>
      <p className="text-gray-500">Seu professor ainda não criou um treino para você.</p>
    </div>
  )

  const totalConcluidos = Object.values(states).filter(s => s.concluido).length
  const progress = (totalConcluidos / treino.exercicios.length) * 100

  return (
    <>
      {showTimer && (
        <TimerModal seconds={timerSecs} total={timerTotal} active={timerActive}
          onToggle={() => setTimerActive(a => !a)}
          onClose={() => { setShowTimer(false); setTimerActive(false) }} />
      )}

      <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="card-base p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              {treino.dia_semana && <span className="badge-info mb-1 inline-block">{treino.dia_semana}</span>}
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-base">{treino.nome}</h1>
              {treino.descricao && <p className="text-xs text-gray-400 mt-0.5">{treino.descricao}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalConcluidos}/{treino.exercicios.length}</p>
              <p className="text-xs text-gray-400">feitos</p>
            </div>
          </div>
          <div className="progress-bar h-2.5"><div className="progress-fill h-2.5" style={{ width: `${progress}%` }} /></div>
        </div>

        {/* Exercícios */}
        <div className="space-y-3">
          {treino.exercicios.map((ex, index) => {
            const state = states[ex.id] ?? { concluido: false, carga: '' }
            const isExpanded = expandedId === ex.id
            const grupoLabel = ex.exercicio.grupo_muscular?.replace(/_/g, ' ')

            return (
              <div key={ex.id} className={clsx('card-base overflow-hidden', state.concluido && 'opacity-70')}>
                <div className="flex items-center gap-3 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/30"
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}>
                  <button onClick={e => { e.stopPropagation(); toggleConcluido(ex.id, ex.tempo_descanso_seg) }}
                    className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all',
                      state.concluido ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-500')}>
                    {state.concluido ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-semibold text-sm', state.concluido ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100')}>
                      {ex.exercicio.nome}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[grupoLabel] ?? 'badge-gray'}`}>
                        {grupoLabel}
                      </span>
                      <span className="text-xs text-gray-400">{ex.series}×{ex.repeticoes}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    <ExercicioImagem gif_url={ex.exercicio.gif_url} nome={ex.exercicio.nome} />
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Séries', value: ex.series },
                        { label: 'Reps', value: ex.repeticoes },
                        { label: 'Carga', value: ex.carga_sugerida ? `${ex.carga_sugerida}kg` : '—' },
                        { label: 'Descanso', value: `${ex.tempo_descanso_seg}s` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
                          <p className="text-xs text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>
                    {ex.observacoes && (
                      <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">{ex.observacoes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="label-base text-xs">Carga usada (kg)</label>
                        <input type="number" inputMode="decimal" value={state.carga}
                          onChange={e => setStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], carga: e.target.value ? Number(e.target.value) : '' } }))}
                          placeholder={ex.carga_sugerida?.toString() ?? '0'} className="input-base text-center text-lg font-bold" min="0" step="0.5" />
                      </div>
                      <div>
                        <label className="label-base text-xs opacity-0">-</label>
                        <button onClick={() => startTimer(ex.tempo_descanso_seg)} className="btn-secondary flex items-center gap-1.5 h-[42px] px-3 text-sm whitespace-nowrap">
                          <Timer className="w-4 h-4 text-primary-500" />{ex.tempo_descanso_seg}s
                        </button>
                      </div>
                    </div>
                    <button onClick={() => toggleConcluido(ex.id, ex.tempo_descanso_seg)}
                      className={clsx('w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95',
                        state.concluido ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'btn-primary text-base')}>
                      <CheckCircle2 className="w-5 h-5" />
                      {state.concluido ? 'Desmarcar' : '✓ Concluído'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {totalConcluidos === treino.exercicios.length && treino.exercicios.length > 0 && (
          <div className="card-base p-6 text-center border-2 border-primary-300 dark:border-primary-600 animate-slide-in">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Treino Concluído!</h3>
            <p className="text-sm text-gray-500 mb-5">Parabéns! Você completou todos os exercícios.</p>
            <button onClick={finalizarTreino} disabled={saving} className="btn-primary w-full py-3.5 rounded-2xl text-base font-bold">
              {saving ? 'Registrando...' : 'Finalizar e Registrar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
