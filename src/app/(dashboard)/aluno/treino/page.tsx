'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Timer, Dumbbell, Info, X, ChevronLeft, ChevronRight, Zap, TrendingUp, Smile, Frown, Meh, MessageSquare, Pause, Play, RotateCcw, Target, Clock, Youtube } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { grupoColors, getYouTubeSearchUrl, getYouTubeEmbedUrl } from '@/lib/mock/exercicios'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface ExercicioTreino {
  id: string; series: number; repeticoes: string; carga_sugerida: number | null
  tempo_descanso_seg: number; observacoes: string | null; ordem: number
  exercicio: { id: string; nome: string; grupo_muscular: string | null; gif_url: string | null; youtube_url: string | null; equipamento: string | null } | null
}
interface Treino {
  id: string; nome: string; dia_semana: string | null; descricao: string | null
  duracao_estimada_min: number | null; exercicios: ExercicioTreino[]
}

type SerieState = { carga: string; done: boolean }
type ExState = { series: SerieState[]; concluido: boolean }

// ── Modal YouTube player ─────────────────────────────────────
function YouTubeModal({ url, nome, onClose }: { url: string; nome: string; onClose: () => void }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="text-white font-semibold">{nome}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
          <iframe src={embedUrl} title={nome} className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
        <p className="text-xs text-white/40 mt-3 text-center">Toque fora para fechar</p>
      </div>
    </div>
  )
}

// ── Feedback pós-treino ─────────────────────────────────────
interface FeedbackData { cansaco: number; dor: number; dificuldade: number; comentario: string }

function EmojiScale({ label, value, onChange, icons }: {
  label: string; value: number; onChange: (v: number) => void
  icons: string[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <div className="flex gap-2 justify-between">
        {icons.map((icon, i) => (
          <button key={i} onClick={() => onChange(i + 1)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xl transition-all active:scale-95',
              value === i + 1
                ? 'bg-orange-500 shadow-md shadow-orange-500/30 scale-110'
                : 'bg-gray-100 dark:bg-gray-700 opacity-60 hover:opacity-90'
            )}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>Leve</span><span>Extremo</span>
      </div>
    </div>
  )
}

function FeedbackModal({ onSave, saving }: {
  onSave: (fb: FeedbackData) => void
  saving: boolean
}) {
  const [fb, setFb] = useState<FeedbackData>({ cansaco: 0, dor: 0, dificuldade: 0, comentario: '' })
  const ok = fb.cansaco > 0 && fb.dor > 0 && fb.dificuldade > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-4 lg:items-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-orange-500/20 animate-scale-in space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Treino Concluído!</h3>
          <p className="text-sm text-gray-500 mt-1">Como foi o treino de hoje?</p>
        </div>

        <EmojiScale label="Nível de cansaço" value={fb.cansaco}
          onChange={v => setFb(p => ({ ...p, cansaco: v }))}
          icons={['😌', '🙂', '😐', '😓', '😵']} />

        <EmojiScale label="Dor / desconforto muscular" value={fb.dor}
          onChange={v => setFb(p => ({ ...p, dor: v }))}
          icons={['💚', '🟡', '🟠', '🔴', '💥']} />

        <EmojiScale label="Dificuldade do treino" value={fb.dificuldade}
          onChange={v => setFb(p => ({ ...p, dificuldade: v }))}
          icons={['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐']} />

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            Comentário (opcional)
          </label>
          <textarea rows={2} value={fb.comentario}
            onChange={e => setFb(p => ({ ...p, comentario: e.target.value }))}
            placeholder="Ex: senti dor no joelho, aumentei a carga..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <button onClick={() => onSave(fb)} disabled={!ok || saving}
          className="w-full py-4 rounded-2xl font-black text-base gradient-orange text-white disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-orange-500/30">
          {saving ? 'Salvando...' : 'Enviar feedback'}
        </button>

        {!ok && (
          <p className="text-center text-xs text-gray-400">Responda os 3 campos acima para enviar</p>
        )}
      </div>
    </div>
  )
}

function TimerModal({ seconds, total, active, onToggle, onClose, onAddTime }: {
  seconds: number; total: number; active: boolean
  onToggle: () => void; onClose: () => void; onAddTime: (s: number) => void
}) {
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const c = 2 * Math.PI * 45
  const urgent = seconds <= 10 && seconds > 0
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-4 lg:items-center">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-orange-500/20 animate-scale-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-orange-500" />Descanso
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {seconds === 0 ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">💪</div>
            <p className="text-white font-black text-xl mb-1">Hora da próxima série!</p>
            <p className="text-gray-400 text-sm">Pronto para continuar?</p>
          </div>
        ) : (
          <div className="flex justify-center my-4">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={urgent ? '#ef4444' : '#f97316'} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={c}
                  strokeDashoffset={c * (1 - progress / 100)}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-mono text-5xl font-black ${urgent ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                  {fmt(seconds)}
                </span>
                <span className="text-gray-500 text-xs mt-1">{total}s total</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          {[15, 30].map(s => (
            <button key={s} onClick={() => onAddTime(s)}
              className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 active:scale-95">
              +{s}s
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onToggle}
            className={clsx('flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm active:scale-95',
              active ? 'bg-gray-700 text-white' : 'gradient-orange text-white')}>
            {active ? <><Pause className="w-4 h-4" />Pausar</> : <><Play className="w-4 h-4" />Continuar</>}
          </button>
          <button onClick={onClose}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-gray-700 text-white active:scale-95">
            <RotateCcw className="w-4 h-4" />Pular
          </button>
        </div>
      </div>
    </div>
  )
}

function StartScreen({ treino, onStart }: { treino: Treino; onStart: () => void }) {
  const totalSeries = treino.exercicios.reduce((s, e) => s + e.series, 0)
  const tempoEstimado = treino.duracao_estimada_min ?? Math.round(totalSeries * 2.5)

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in-up">
      <div className="gradient-orange rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-2 -bottom-10 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10">
          {treino.dia_semana && (
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              Treino {treino.dia_semana}
            </span>
          )}
          <h1 className="text-2xl font-black text-white leading-tight mb-2">{treino.nome}</h1>
          {treino.descricao && <p className="text-white/70 text-sm">{treino.descricao}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card-base p-4 text-center space-y-1">
          <Dumbbell className="w-6 h-6 text-orange-500 mx-auto" />
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{treino.exercicios.length}</p>
          <p className="text-xs text-gray-400">Exercícios</p>
        </div>
        <div className="card-base p-4 text-center space-y-1">
          <Target className="w-6 h-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{totalSeries}</p>
          <p className="text-xs text-gray-400">Séries</p>
        </div>
        <div className="card-base p-4 text-center space-y-1">
          <Clock className="w-6 h-6 text-green-500 mx-auto" />
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">~{tempoEstimado}</p>
          <p className="text-xs text-gray-400">Minutos</p>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Exercícios de hoje</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {treino.exercicios.map((ex, i) => {
            const nome = ex.exercicio?.nome ?? ex.observacoes ?? `Exercício ${i + 1}`
            const grupo = ex.exercicio?.grupo_muscular?.replace(/_/g, ' ') ?? null
            return (
              <div key={ex.id} className="flex items-center gap-3 p-3.5">
                <span className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{nome}</p>
                  {grupo && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[grupo] ?? 'badge-gray'}`}>
                      {grupo}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{ex.series}×{ex.repeticoes}</span>
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={onStart}
        className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 gradient-orange text-white shadow-xl shadow-orange-500/30 active:scale-95 transition-all hover:shadow-orange-500/40 animate-bounce-in">
        <Zap className="w-6 h-6" />
        Iniciar Treino
      </button>
    </div>
  )
}

export default function TreinoAlunoPage() {
  const { usuario } = useAuth()
  const [treino, setTreino] = useState<Treino | null>(null)
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [states, setStates] = useState<Record<string, ExState>>({})
  const [showTimer, setShowTimer] = useState(false)
  const [timerSecs, setTimerSecs] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [historicoId, setHistoricoId] = useState<string | null>(null)
  const [youtubeModal, setYoutubeModal] = useState<{ url: string; nome: string } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const fetchAluno = useCallback(async () => {
    if (!usuario?.id) return
    try {
      // maybeSingle() não lança erro quando não encontra — apenas retorna null
      const { data, error } = await supabase
        .from('alunos').select('id').eq('usuario_id', usuario.id).maybeSingle()
      if (error) throw error
      if (data) {
        setAlunoId(data.id)
        // loading continua true — fetchTreino vai chamar setLoading(false)
      } else {
        setLoading(false) // aluno não existe para este usuário
      }
    } catch { setLoading(false) }
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
            exercicio:exercicios (id, nome, grupo_muscular, gif_url, youtube_url, equipamento)
          )`)
        .eq('aluno_id', alunoId).eq('ativo', true)
        .order('created_at', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        const t = data as unknown as Treino
        t.exercicios = (t.exercicios ?? []).sort((a, b) => a.ordem - b.ordem)
        setTreino(t)
        // Estado por exercício: array de séries com carga individual
        setStates(Object.fromEntries(t.exercicios.map(e => [
          e.id,
          {
            series: Array.from({ length: e.series }, () => ({ carga: '', done: false })),
            concluido: false,
          }
        ])))
      }
    } catch { toast.error('Erro ao carregar treino') }
    finally { setLoading(false) }
  }, [alunoId])

  useEffect(() => { fetchAluno() }, [fetchAluno])
  useEffect(() => { fetchTreino() }, [fetchTreino])

  // Timer countdown — depende APENAS de timerActive para não recriar interval a cada segundo
  useEffect(() => {
    if (!timerActive) {
      clearInterval(intervalRef.current!)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimerSecs(s => {
        if (s <= 1) {
          setTimerActive(false)
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [timerActive]) // ← só timerActive; timerSecs via functional update não precisa estar aqui

  const startTimer = (secs: number) => {
    clearInterval(intervalRef.current!)
    setTimerTotal(secs); setTimerSecs(secs); setTimerActive(true); setShowTimer(true)
  }

  const addTimerTime = (extra: number) => {
    setTimerSecs(s => s + extra)
    setTimerTotal(t => t + extra)
    setTimerActive(true)
  }

  const goTo = (i: number) => { setCurrentIndex(i); setImgErr(false) }

  // Marca/desmarca uma série individual
  const handleSerie = (exId: string, serieIdx: number, descanso: number) => {
    const cur = states[exId]
    if (!cur) return
    const wasDone = cur.series[serieIdx].done
    const newSeries = cur.series.map((s, i) => i === serieIdx ? { ...s, done: !s.done } : s)
    const allDone = newSeries.every(s => s.done)

    setStates(prev => ({ ...prev, [exId]: { series: newSeries, concluido: allDone } }))

    if (!wasDone) {
      // Marcando como feita → iniciar timer de descanso
      startTimer(descanso)
      // Se completou todas as séries, avançar para próximo exercício
      if (allDone && treino && currentIndex < treino.exercicios.length - 1) {
        setTimeout(() => goTo(currentIndex + 1), 1000)
      }
    }
  }

  // Atualiza carga de uma série específica
  const handleCarga = (exId: string, si: number, val: string) => {
    setStates(prev => {
      const ex = prev[exId]
      if (!ex) return prev
      const ns = ex.series.map((s, i) => i === si ? { ...s, carga: val } : s)
      return { ...prev, [exId]: { ...ex, series: ns } }
    })
  }

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
          exercicios_realizados: treino.exercicios.map(ex => {
            const st = states[ex.id]
            const cargas = (st?.series ?? []).map(s => Number(s.carga)).filter(c => c > 0)
            const cargaMedia = cargas.length > 0
              ? Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length * 10) / 10
              : (ex.carga_sugerida ?? 0)
            return {
              exercicio_id: ex.exercicio?.id ?? null,
              nome: ex.exercicio?.nome ?? ex.observacoes ?? 'Exercício',
              series: ex.series, repeticoes: ex.repeticoes,
              carga: cargaMedia,
              concluido: st?.concluido ?? false,
            }
          }),
          status: 'concluido',
        }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setHistoricoId(json.data?.id ?? null)
      // Mostrar modal de feedback antes de resetar a tela
      setShowFeedback(true)
    } catch { toast.error('Erro ao finalizar') }
    finally { setSaving(false) }
  }

  const saveFeedback = async (fb: FeedbackData) => {
    setFeedbackSaving(true)
    try {
      if (historicoId) {
        await supabase.from('historico_treinos').update({
          feedback_cansaco: fb.cansaco,
          feedback_dor: fb.dor,
          feedback_dificuldade: fb.dificuldade,
          feedback_comentario: fb.comentario || null,
        }).eq('id', historicoId)
      }
      toast.success('Feedback enviado! 💪')
    } catch { /* feedback é opcional — ignora erro silenciosamente */ }
    finally {
      setFeedbackSaving(false)
      setShowFeedback(false)
      setHistoricoId(null)
      setStarted(false)
      if (treino) {
        setStates(Object.fromEntries(treino.exercicios.map(e => [
          e.id,
          { series: Array.from({ length: e.series }, () => ({ carga: '', done: false })), concluido: false }
        ])))
      }
      setCurrentIndex(0)
    }
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

  if (!started) return <StartScreen treino={treino} onStart={() => setStarted(true)} />

  // Tela de execução
  const totalConcluidos = Object.values(states).filter(s => s.concluido).length
  const progress = treino.exercicios.length > 0 ? (totalConcluidos / treino.exercicios.length) * 100 : 0
  const ex = treino.exercicios[currentIndex]
  if (!ex) return null

  const nome = ex.exercicio?.nome ?? ex.observacoes ?? `Exercício ${currentIndex + 1}`
  const grupo = ex.exercicio?.grupo_muscular?.replace(/_/g, ' ') ?? null
  const state = states[ex.id] ?? {
    series: Array.from({ length: ex.series }, () => ({ carga: '', done: false })),
    concluido: false,
  }
  const seriesFeitas = state.series.filter(s => s.done).length

  return (
    <>
      {/* Modal YouTube */}
      {youtubeModal && (
        <YouTubeModal url={youtubeModal.url} nome={youtubeModal.nome} onClose={() => setYoutubeModal(null)} />
      )}
      {showFeedback && (
        <FeedbackModal onSave={saveFeedback} saving={feedbackSaving} />
      )}
      {showTimer && !showFeedback && (
        <TimerModal
          seconds={timerSecs} total={timerTotal} active={timerActive}
          onToggle={() => setTimerActive(a => !a)}
          onAddTime={addTimerTime}
          onClose={() => { setShowTimer(false); setTimerActive(false) }}
        />
      )}

      <div className="max-w-lg mx-auto space-y-4 page-enter">
        {/* Header progresso */}
        <div className="card-base p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2">
                {treino.dia_semana && <span className="badge-info flex-shrink-0">{treino.dia_semana}</span>}
                <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{treino.nome}</h1>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black text-orange-500">{totalConcluidos}/{treino.exercicios.length}</p>
              <p className="text-xs text-gray-400">exercícios</p>
            </div>
          </div>
          <div className="progress-bar h-2.5">
            <div className="progress-fill h-2.5" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Navegação dots */}
        <div className="flex items-center justify-between px-1">
          <button onClick={() => goTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
            className="btn-ghost p-2 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {treino.exercicios.map((e, i) => (
              <button key={e.id} onClick={() => goTo(i)}
                className={clsx('rounded-full transition-all duration-300',
                  i === currentIndex ? 'w-6 h-2.5 bg-orange-500' :
                  states[e.id]?.concluido ? 'w-2.5 h-2.5 bg-green-500' :
                  'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600')} />
            ))}
          </div>
          <button onClick={() => goTo(Math.min(treino.exercicios.length - 1, currentIndex + 1))}
            disabled={currentIndex === treino.exercicios.length - 1}
            className="btn-ghost p-2 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Card exercício */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} key={ex.id}
          className={clsx('card-base overflow-hidden animate-scale-in', state.concluido && 'opacity-80')}>
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div className="h-1 gradient-orange transition-all"
              style={{ width: `${ex.series > 0 ? (seriesFeitas / ex.series) * 100 : 0}%` }} />
          </div>
          <div className="p-5 space-y-4">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{currentIndex + 1}/{treino.exercicios.length}</span>
                {grupo && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grupoColors[grupo] ?? 'badge-gray'}`}>{grupo}</span>}
              </div>
              {state.concluido
                ? <span className="badge-success text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Concluído</span>
                : <span className="text-xs text-gray-400">{seriesFeitas}/{ex.series} séries</span>
              }
            </div>

            <h2 className={clsx('text-xl font-black', state.concluido ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100')}>
              {nome}
            </h2>

            {/* Foto do exercício — sempre visível, com overlay de vídeo/busca */}
            {(() => {
              const youtubeUrl = ex.exercicio?.youtube_url ?? null
              const gifUrl = ex.exercicio?.gif_url ?? null
              const hasGif = !!gifUrl && !imgErr
              const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${nome} academia execução correta`)}`

              return (
                <div className="rounded-2xl overflow-hidden relative h-44 bg-gray-100 dark:bg-gray-700 group">
                  {/* Camada de foto — gif do exercício */}
                  {hasGif ? (
                    <img src={gifUrl!} alt={nome} className="w-full h-full object-cover"
                      onError={() => setImgErr(true)} />
                  ) : (
                    /* Placeholder com gradiente quando não tem foto */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p className="text-xs text-gray-400">{nome}</p>
                    </div>
                  )}

                  {/* Overlay escuro suave sempre presente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Botão de play YouTube — quando há URL de vídeo */}
                  {youtubeUrl && (
                    <button
                      onClick={() => setYoutubeModal({ url: youtubeUrl, nome })}
                      className="absolute inset-0 flex items-center justify-center focus:outline-none"
                      aria-label="Assistir vídeo"
                    >
                      <div className="w-16 h-16 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 active:scale-95">
                        <Play className="w-7 h-7 text-white ml-1" fill="white" />
                      </div>
                    </button>
                  )}

                  {/* Badge YouTube no canto quando tem vídeo */}
                  {youtubeUrl && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow">
                      <Youtube className="w-3 h-3" /> Vídeo
                    </div>
                  )}

                  {/* Botão de busca YouTube no canto — quando NÃO tem vídeo cadastrado */}
                  {!youtubeUrl && (
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors shadow"
                    >
                      <Youtube className="w-3.5 h-3.5" /> Ver no YouTube
                    </a>
                  )}
                </div>
              )
            })()}

            {/* Info rápida */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Reps',     v: ex.repeticoes,                                bg: 'bg-blue-50 dark:bg-blue-900/20',   t: 'text-blue-600 dark:text-blue-400' },
                { l: 'Sugerido', v: ex.carga_sugerida ? `${ex.carga_sugerida}kg` : '—', bg: 'bg-purple-50 dark:bg-purple-900/20', t: 'text-purple-600 dark:text-purple-400' },
                { l: 'Descanso', v: `${ex.tempo_descanso_seg}s`,                bg: 'bg-green-50 dark:bg-green-900/20',  t: 'text-green-600 dark:text-green-400' },
              ].map(({ l, v, bg, t }) => (
                <div key={l} className={`${bg} rounded-xl p-2.5 text-center`}>
                  <p className={`text-base font-black ${t}`}>{v}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Observações */}
            {ex.observacoes && (
              <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{ex.observacoes}</p>
              </div>
            )}

            {/* ── SÉRIES INDIVIDUAIS ─────────────────────── */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Registrar séries — {ex.repeticoes} reps cada
                </p>
              </div>

              {/* Cabeçalho colunas */}
              <div className="flex items-center gap-2 px-1 mb-1">
                <span className="w-8 text-xs text-gray-400 text-center">Série</span>
                <span className="w-20 text-xs text-gray-400 text-center">Carga (kg)</span>
                <span className="flex-1 text-xs text-gray-400 text-center">Ação</span>
                <button
                  onClick={() => startTimer(ex.tempo_descanso_seg)}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium active:scale-95 transition-all">
                  <Timer className="w-3.5 h-3.5" />{ex.tempo_descanso_seg}s
                </button>
              </div>

              {state.series.map((serie, si) => (
                <div key={si} className={clsx(
                  'flex items-center gap-2 p-2 rounded-xl transition-all',
                  serie.done
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : si === seriesFeitas
                      ? 'bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200 dark:ring-orange-800'
                      : 'bg-gray-50 dark:bg-gray-700/30'
                )}>
                  {/* Número */}
                  <span className={clsx(
                    'w-8 h-8 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0',
                    serie.done
                      ? 'bg-green-500 text-white'
                      : si === seriesFeitas
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  )}>
                    {serie.done ? '✓' : si + 1}
                  </span>

                  {/* Input carga */}
                  <input
                    type="number" inputMode="decimal"
                    value={serie.carga}
                    onChange={e => handleCarga(ex.id, si, e.target.value)}
                    placeholder={ex.carga_sugerida?.toString() ?? '0'}
                    className={clsx(
                      'w-20 text-center font-black text-sm rounded-lg border px-2 py-2 transition-all',
                      'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600',
                      'focus:outline-none focus:ring-2 focus:ring-orange-400',
                      serie.done && 'opacity-60'
                    )}
                    min="0" step="0.5"
                    disabled={serie.done}
                  />

                  {/* Botão fazer/desfazer */}
                  <button
                    onClick={() => handleSerie(ex.id, si, ex.tempo_descanso_seg)}
                    className={clsx(
                      'flex-1 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all',
                      serie.done
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : si === seriesFeitas
                          ? 'gradient-orange text-white shadow-sm shadow-orange-500/30'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                    )}>
                    {serie.done ? '✓ Feita' : 'Fazer →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">← Deslize para navegar →</p>

        {/* Tela de conclusão */}
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
