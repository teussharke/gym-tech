'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Timer, Dumbbell, Info, Video } from 'lucide-react'
import clsx from 'clsx'

// Mock treino data
const mockTreino = {
  id: '1',
  nome: 'Treino A - Peito e Tríceps',
  dia_semana: 'Segunda',
  descricao: 'Foco em hipertrofia de peito e tríceps',
  duracao_estimada_min: 60,
  exercicios: [
    {
      id: '1',
      nome: 'Supino Reto com Barra',
      grupo_muscular: 'Peito',
      series: 4,
      repeticoes: '8-12',
      carga_sugerida: 80,
      tempo_descanso_seg: 90,
      observacoes: 'Manter os pés no chão, escápulas retraídas',
      gif_url: null,
      equipamento: 'Barra',
      nivel: 'intermediario',
    },
    {
      id: '2',
      nome: 'Supino Inclinado com Halteres',
      grupo_muscular: 'Peito',
      series: 3,
      repeticoes: '10-12',
      carga_sugerida: 30,
      tempo_descanso_seg: 75,
      observacoes: 'Ângulo de 30-45 graus',
      gif_url: null,
      equipamento: 'Halteres',
      nivel: 'intermediario',
    },
    {
      id: '3',
      nome: 'Crossover Polia',
      grupo_muscular: 'Peito',
      series: 3,
      repeticoes: '12-15',
      carga_sugerida: 20,
      tempo_descanso_seg: 60,
      observacoes: 'Contrair bem no ponto de cruzamento',
      gif_url: null,
      equipamento: 'Polia',
      nivel: 'intermediario',
    },
    {
      id: '4',
      nome: 'Tríceps Pulley',
      grupo_muscular: 'Tríceps',
      series: 4,
      repeticoes: '12',
      carga_sugerida: 35,
      tempo_descanso_seg: 60,
      observacoes: 'Cotovelos fixos ao lado do corpo',
      gif_url: null,
      equipamento: 'Polia',
      nivel: 'iniciante',
    },
    {
      id: '5',
      nome: 'Mergulho no Banco',
      grupo_muscular: 'Tríceps',
      series: 3,
      repeticoes: '10-12',
      carga_sugerida: null,
      tempo_descanso_seg: 60,
      observacoes: 'Peso corporal ou com anilha no colo',
      gif_url: null,
      equipamento: 'Banco',
      nivel: 'iniciante',
    },
  ]
}

const nivelColors = {
  iniciante: 'badge-success',
  intermediario: 'badge-warning',
  avancado: 'badge-danger',
}

const grupoColors: Record<string, string> = {
  'Peito': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Tríceps': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Costas': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pernas': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface ExercicioState {
  concluido: boolean
  cargaUtilizada: number | ''
  seriesFeitas: number
}

export default function TreinoAlunoPage() {
  const [treino] = useState(mockTreino)
  const [exercicioStates, setExercicioStates] = useState<Record<string, ExercicioState>>(() =>
    Object.fromEntries(treino.exercicios.map(e => [e.id, { concluido: false, cargaUtilizada: '', seriesFeitas: 0 }]))
  )
  const [expandedId, setExpandedId] = useState<string | null>(treino.exercicios[0]?.id ?? null)
  
  // Rest timer
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerActive(false)
            clearInterval(intervalRef.current!)
            // Could play a sound here
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [timerActive, timerSeconds])

  const startTimer = (seconds: number) => {
    setTimerTotal(seconds)
    setTimerSeconds(seconds)
    setTimerActive(true)
  }

  const resetTimer = () => {
    setTimerActive(false)
    setTimerSeconds(timerTotal)
    clearInterval(intervalRef.current!)
  }

  const toggleTimer = () => {
    setTimerActive(!timerActive)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const timerProgress = timerTotal > 0 ? ((timerTotal - timerSeconds) / timerTotal) * 100 : 0

  const totalConcluidos = Object.values(exercicioStates).filter(e => e.concluido).length
  const progressPercent = (totalConcluidos / treino.exercicios.length) * 100

  const toggleExercicioConcluido = (id: string, tempoDescanso: number) => {
    setExercicioStates(prev => {
      const current = prev[id]
      const nowConcluido = !current.concluido
      if (nowConcluido) {
        startTimer(tempoDescanso)
      }
      return { ...prev, [id]: { ...current, concluido: nowConcluido } }
    })
    // Move to next exercise
    const currentIndex = treino.exercicios.findIndex(e => e.id === id)
    const nextExercicio = treino.exercicios[currentIndex + 1]
    if (nextExercicio && !exercicioStates[id].concluido) {
      setTimeout(() => setExpandedId(nextExercicio.id), 500)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      {/* Treino Header */}
      <div className="card-base p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="badge-info mb-2 inline-block">{treino.dia_semana}</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{treino.nome}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{treino.descricao}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {totalConcluidos}/{treino.exercicios.length}
            </p>
            <p className="text-xs text-gray-400">concluídos</p>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Progresso do treino</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>{treino.exercicios.length} exercícios</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Timer className="w-3.5 h-3.5" />
            <span>~{treino.duracao_estimada_min} min</span>
          </div>
        </div>
      </div>

      {/* Rest Timer */}
      {(timerActive || timerSeconds > 0) && (
        <div className={clsx(
          'card-base p-4 border-2 transition-all',
          timerActive ? 'border-primary-400 dark:border-primary-500' : 'border-gray-200 dark:border-gray-600'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary-500" />
              Descanso
            </h3>
            <span className="text-xs text-gray-400">{timerTotal}s total</span>
          </div>
          
          {/* Circular progress */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" className="dark:stroke-gray-700" />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - timerProgress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="timer-display text-3xl">{formatTime(timerSeconds)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={toggleTimer} className={clsx('btn-primary flex items-center gap-2 text-sm', !timerActive && 'bg-gray-600 hover:bg-gray-700')}>
              {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {timerActive ? 'Pausar' : 'Continuar'}
            </button>
            <button onClick={resetTimer} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          </div>
        </div>
      )}

      {/* Exercicios */}
      <div className="space-y-3">
        {treino.exercicios.map((exercicio, index) => {
          const state = exercicioStates[exercicio.id]
          const isExpanded = expandedId === exercicio.id

          return (
            <div
              key={exercicio.id}
              className={clsx(
                'card-base overflow-hidden transition-all duration-300',
                state.concluido && 'opacity-75',
                !state.concluido && 'ring-2 ring-transparent hover:ring-primary-200 dark:hover:ring-primary-800'
              )}
            >
              {/* Exercicio header */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : exercicio.id)}
              >
                {/* Number / Check */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExercicioConcluido(exercicio.id, exercicio.tempo_descanso_seg)
                  }}
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm font-bold',
                    state.concluido
                      ? 'bg-primary-500 text-white scale-95'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {state.concluido ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={clsx(
                      'font-semibold text-sm',
                      state.concluido
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {exercicio.nome}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[exercicio.grupo_muscular] ?? 'badge-gray'}`}>
                      {exercicio.grupo_muscular}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {exercicio.series}x {exercicio.repeticoes}
                    {exercicio.carga_sugerida ? ` · ${exercicio.carga_sugerida}kg` : ''}
                  </p>
                </div>

                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>

              {/* Exercicio details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                  {/* GIF placeholder */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-40 flex items-center justify-center">
                    {exercicio.gif_url ? (
                      <img src={exercicio.gif_url} alt={exercicio.nome} className="h-full object-contain rounded-xl" />
                    ) : (
                      <div className="text-center">
                        <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">GIF/Vídeo demonstrativo</p>
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Séries', value: exercicio.series },
                      { label: 'Reps', value: exercicio.repeticoes },
                      { label: 'Carga', value: exercicio.carga_sugerida ? `${exercicio.carga_sugerida}kg` : '-' },
                      { label: 'Descanso', value: `${exercicio.tempo_descanso_seg}s` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  {exercicio.observacoes && (
                    <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">{exercicio.observacoes}</p>
                    </div>
                  )}

                  {/* Registrar carga */}
                  <div>
                    <label className="label-base">Carga utilizada (kg)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={exercicio.carga_sugerida?.toString() ?? '0'}
                        value={state.cargaUtilizada}
                        onChange={(e) => setExercicioStates(prev => ({
                          ...prev,
                          [exercicio.id]: { ...prev[exercicio.id], cargaUtilizada: e.target.value ? Number(e.target.value) : '' }
                        }))}
                        className="input-base"
                        min="0"
                        step="0.5"
                      />
                      <button
                        onClick={() => {
                          startTimer(exercicio.tempo_descanso_seg)
                        }}
                        className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0 whitespace-nowrap"
                      >
                        <Timer className="w-4 h-4" />
                        Descanso
                      </button>
                    </div>
                  </div>

                  {/* Complete button */}
                  <button
                    onClick={() => toggleExercicioConcluido(exercicio.id, exercicio.tempo_descanso_seg)}
                    className={clsx(
                      'w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                      state.concluido
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        : 'btn-primary'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {state.concluido ? 'Marcar como não concluído' : 'Marcar como concluído'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Finish workout button */}
      {totalConcluidos === treino.exercicios.length && (
        <div className="card-base p-5 text-center border-2 border-primary-300 dark:border-primary-600 animate-slide-in">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Treino Concluído!</h3>
          <p className="text-sm text-gray-500 mb-4">Parabéns! Você completou todos os exercícios.</p>
          <button className="btn-primary w-full">
            Finalizar e Registrar Treino
          </button>
        </div>
      )}
    </div>
  )
}
