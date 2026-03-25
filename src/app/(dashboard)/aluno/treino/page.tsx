'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Timer, Dumbbell, Info, X, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { grupoColors } from '@/lib/mock/exercicios'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface ExercicioTreino {
  id: string; series: number; repeticoes: string; carga_sugerida: number | null
  tempo_descanso_seg: number; observacoes: string | null; ordem: number
  exercicio: { id: string; nome: string; grupo_muscular: string | null; gif_url: string | null; equipamento: string | null } | null
}
interface Treino {
  id: string; nome: string; dia_semana: string | null; descricao: string | null
  duracao_estimada_min: number | null; exercicios: ExercicioTreino[]
}

function TimerModal({ seconds, total, active, onToggle, onClose }: { seconds: number; total: number; active: boolean; onToggle: () => void; onClose: () => void }) {
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const c = 2 * Math.PI * 45
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-4 lg:items-center">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-orange-500/20 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Timer className="w-4 h-4 text-orange-500" />Descanso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center mb-6">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={seconds <= 10 ? '#ef4444' : '#f97316'} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress / 100)} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-mono text-5xl font-black ${seconds <= 10 ? 'text-red-500' : 'text-orange-500'}`}>{fmt(seconds)}</span>
              <span className="text-gray-500 text-xs mt-1">{total}s total</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onToggle} className={clsx('flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95', active ? 'bg-gray-700 text-white' : 'gradient-orange text-white')}>
            {active ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Continuar</>}
          </button>
          <button onClick={onClose} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-gray-700 text-white active:scale-95">
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [states, setStates] = useState<Record<string, { concluido: boolean; carga: number | '' }>>({})
  const [showTimer, setShowTimer] = useState(false)
  const [timerSecs, setTimerSecs] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const fetchAluno = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchTreino = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select(`id, nome, dia_semana, descricao, duracao_estimada_min,
          exercicios:treino_exercicios (
            id, series, repeticoes, carga_sugerida, tempo_descanso_seg, observacoes, ordem,
            exercicio:exercicios (id, nome, grupo_muscular, gif_url, equipamento)
          )`)
        .eq('aluno_id', alunoId).eq('ativo', true)
        .order('created_at', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        const t = data as unknown as Treino
        t.exercicios = (t.exercicios ?? []).sort((a, b) => a.ordem - b.ordem)
        setTreino(t)
        setStates(Object.fromEntries(t.exercicios.map(e => [e.id, { concluido: false, carga: '' }])))
      }
    } catch { toast.error('Erro ao carregar treino') }
    finally { setLoading(false) }
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

  const handleToggle = (id: string, descanso: number) => {
    const nowConcluido = !states[id]?.concluido
    setStates(prev => ({ ...prev, [id]: { ...prev[id], concluido: nowConcluido } }))
    if (nowConcluido) {
      startTimer(descanso)
      if (treino && currentIndex < treino.exercicios.length - 1)
        setTimeout(() => { setCurrentIndex(i => i + 1); setImgErr(false) }, 600)
    }
  }

  const goTo = (i: number) => { setCurrentIndex(i); setImgErr(false) }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!treino) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < Math.abs(dy) * 0.8 || Math.abs(dx) < 50) return
    if (dx < 0 && currentIndex < treino.exercicios.length - 1) goTo(currentIndex + 1)
    if (dx > 0 && currentIndex > 0) goTo(currentIndex - 1)
  }

  const finalizarTreino = async () => {
    if (!alunoId || !treino || !usuario?.academia_id) return
    setSaving(true)
    try {
      const res = await fetch('/api/workouts/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: alunoId, treino_id: treino.id, academia_id: usuario.academia_id,
          exercicios_realizados: treino.exercicios.map(ex => ({
            exercicio_id: ex.exercicio?.id ?? null,
            nome: ex.exercicio?.nome ?? 'Exercício',
            series: ex.series, repeticoes: ex.repeticoes,
            carga: states[ex.id]?.carga || ex.carga_sugerida || 0,
            concluido: states[ex.id]?.concluido ?? false,
          })),
          status: 'concluido',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Treino registrado! 🎉')
      setStates(Object.fromEntries(treino.exercicios.map(e => [e.id, { concluido: false, carga: '' }])))
      setCurrentIndex(0)
    } catch { toast.error('Erro ao finalizar') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center animate-float">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-400 text-sm">Carregando treino...</p>
      </div>
    </div>
  )

  if (!treino) return (
    <div className="max-w-lg mx-auto card-base p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4 animate-float">🏋️</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhum treino ativo</h2>
      <p className="text-gray-500">Seu professor ainda não criou um treino para você.</p>
    </div>
  )

  const totalConcluidos = Object.values(states).filter(s => s.concluido).length
  const progress = (totalConcluidos / treino.exercicios.length) * 100
  const ex = treino.exercicios[currentIndex]
  if (!ex) return null

  const nome = ex.exercicio?.nome ?? ex.observacoes ?? `Exercício ${currentIndex + 1}`
  const grupo = ex.exercicio?.grupo_muscular?.replace(/_/g, ' ') ?? null
  const state = states[ex.id] ?? { concluido: false, carga: '' }

  return (
    <>
      {showTimer && (
        <TimerModal seconds={timerSecs} total={timerTotal} active={timerActive}
          onToggle={() => setTimerActive(a => !a)}
          onClose={() => { setShowTimer(false); setTimerActive(false) }} />
      )}

      <div className="max-w-lg mx-auto space-y-4 page-enter">
        {/* Header */}
        <div className="card-base p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {treino.dia_semana && <span className="badge-info">{treino.dia_semana}</span>}
                <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{treino.nome}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-500">{totalConcluidos}/{treino.exercicios.length}</p>
              <p className="text-xs text-gray-400">feitos</p>
            </div>
          </div>
          <div className="progress-bar h-2.5"><div className="progress-fill h-2.5" style={{ width: `${progress}%` }} /></div>
        </div>

        {/* Dots navegação */}
        <div className="flex items-center justify-between px-1">
          <button onClick={() => goTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="btn-ghost p-2 disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {treino.exercicios.map((e, i) => (
              <button key={e.id} onClick={() => goTo(i)}
                className={clsx('rounded-full transition-all duration-300',
                  i === currentIndex ? 'w-6 h-2.5 bg-orange-500' :
                  states[e.id]?.concluido ? 'w-2.5 h-2.5 bg-green-500' :
                  'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600')} />
            ))}
          </div>
          <button onClick={() => goTo(Math.min(treino.exercicios.length - 1, currentIndex + 1))} disabled={currentIndex === treino.exercicios.length - 1} className="btn-ghost p-2 disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Card exercício com swipe */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} key={ex.id}
          className={clsx('card-base overflow-hidden animate-scale-in', state.concluido && 'opacity-80')}>
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div className="h-1 gradient-orange" style={{ width: `${((currentIndex + (state.concluido ? 1 : 0)) / treino.exercicios.length) * 100}%` }} />
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">{currentIndex + 1}/{treino.exercicios.length}</span>
                {grupo && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grupoColors[grupo] ?? 'badge-gray'}`}>{grupo}</span>}
              </div>
              {state.concluido && <span className="badge-success text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Concluído</span>}
            </div>

            <h2 className={clsx('text-xl font-black leading-tight', state.concluido ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100')}>
              {nome}
            </h2>

            {ex.exercicio?.gif_url && !imgErr ? (
              <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 h-52">
                <img src={ex.exercicio.gif_url} alt={nome} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 h-40 flex items-center justify-center">
                <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Séries', value: ex.series, bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
                { label: 'Reps', value: ex.repeticoes, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                { label: 'Carga', value: ex.carga_sugerida ? `${ex.carga_sugerida}kg` : '—', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                { label: 'Descanso', value: `${ex.tempo_descanso_seg}s`, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                  <p className={`text-base font-black ${text}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {ex.observacoes && (
              <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{ex.observacoes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Carga usada (kg)</label>
                <input type="number" inputMode="decimal" value={state.carga}
                  onChange={e => setStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], carga: e.target.value ? Number(e.target.value) : '' } }))}
                  placeholder={ex.carga_sugerida?.toString() ?? '0'}
                  className="input-base text-center text-2xl font-black h-14" min="0" step="0.5" />
              </div>
              <div>
                <label className="text-xs opacity-0 mb-1.5 block">-</label>
                <button onClick={() => startTimer(ex.tempo_descanso_seg)}
                  className="h-14 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all active:scale-95">
                  <Timer className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-700 dark:text-gray-300">{ex.tempo_descanso_seg}s</span>
                </button>
              </div>
            </div>

            <button onClick={() => handleToggle(ex.id, ex.tempo_descanso_seg)}
              className={clsx('w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95',
                state.concluido ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'gradient-orange text-white shadow-lg shadow-orange-500/30')}>
              <CheckCircle2 className="w-5 h-5" />
              {state.concluido ? 'Desmarcar' : 'Marcar como concluído ✓'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 animate-fade-in">← Deslize para navegar entre exercícios →</p>

        {totalConcluidos === treino.exercicios.length && (
          <div className="card-base p-6 text-center border-2 border-orange-400 animate-bounce-in">
            <div className="text-5xl mb-3 animate-float">🎉</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-1">Treino Concluído!</h3>
            <p className="text-sm text-gray-500 mb-5">Parabéns! Você completou todos os exercícios.</p>
            <button onClick={finalizarTreino} disabled={saving}
              className="btn-primary w-full py-4 rounded-2xl text-base font-black">
              {saving ? 'Registrando...' : '🏆 Finalizar e Registrar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
