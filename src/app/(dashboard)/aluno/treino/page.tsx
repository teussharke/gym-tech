'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Timer, Dumbbell, Info } from 'lucide-react'
import clsx from 'clsx'
import { grupoColors } from '@/lib/mock/exercicios'

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const mockTreino = {
  id: '1',
  nome: 'Treino A - Peito e Tríceps',
  dia_semana: 'A',
  descricao: 'Foco em hipertrofia de peito e tríceps',
  duracao_estimada_min: 60,
  exercicios: [
    { id: '1', nome: 'Supino Reto com Barra',         grupo: 'Peito',   series: 4, repeticoes: '8-12', carga_sugerida: 80,  tempo_descanso_seg: 90, observacoes: 'Manter escápulas retraídas e pés no chão', gif_url: `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg` },
    { id: '2', nome: 'Supino Inclinado com Halteres',  grupo: 'Peito',   series: 3, repeticoes: '10-12',carga_sugerida: 30,  tempo_descanso_seg: 75, observacoes: 'Ângulo de 30-45 graus', gif_url: `${BASE}/Dumbbell_Incline_Bench_Press/0.jpg` },
    { id: '3', nome: 'Crossover Polia Alta',           grupo: 'Peito',   series: 3, repeticoes: '12-15',carga_sugerida: 20,  tempo_descanso_seg: 60, observacoes: 'Contrair bem no cruzamento', gif_url: `${BASE}/Cable_Crossover/0.jpg` },
    { id: '4', nome: 'Tríceps Pulley Corda',           grupo: 'Tríceps', series: 4, repeticoes: '12',   carga_sugerida: 25,  tempo_descanso_seg: 60, observacoes: 'Cotovelos fixos ao lado do corpo, abrir a corda no final', gif_url: `${BASE}/Cable_Triceps_Pushdown_(Rope)/0.jpg` },
    { id: '5', nome: 'Tríceps Francês com Halter',     grupo: 'Tríceps', series: 3, repeticoes: '10-12',carga_sugerida: null,tempo_descanso_seg: 60, observacoes: 'Manter cotovelos apontados para cima', gif_url: `${BASE}/Dumbbell_Lying_Triceps_Extension/0.jpg` },
  ],
}

interface ExercicioState {
  concluido: boolean
  cargaUtilizada: number | ''
}

function ExercicioImagem({ gif_url, nome }: { gif_url?: string; nome: string }) {
  const [imgError, setImgError] = useState(false)

  if (!gif_url || imgError) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-44 flex flex-col items-center justify-center gap-2">
        <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-500" />
        <p className="text-xs text-gray-400">Sem demonstração</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-44 overflow-hidden">
      <img
        src={gif_url}
        alt={nome}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export default function TreinoAlunoPage() {
  const [treino] = useState(mockTreino)
  const [states, setStates] = useState<Record<string, ExercicioState>>(() =>
    Object.fromEntries(treino.exercicios.map(e => [e.id, { concluido: false, cargaUtilizada: '' }]))
  )
  const [expandedId, setExpandedId] = useState<string | null>(treino.exercicios[0]?.id ?? null)

  // Timer
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) { setTimerActive(false); clearInterval(intervalRef.current!); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [timerActive, timerSeconds])

  const startTimer = (secs: number) => { setTimerTotal(secs); setTimerSeconds(secs); setTimerActive(true) }
  const resetTimer = () => { setTimerActive(false); setTimerSeconds(timerTotal); clearInterval(intervalRef.current!) }
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const timerProgress = timerTotal > 0 ? ((timerTotal - timerSeconds) / timerTotal) * 100 : 0

  const totalConcluidos = Object.values(states).filter(s => s.concluido).length
  const progressPercent = (totalConcluidos / treino.exercicios.length) * 100

  const toggleConcluido = (id: string, descanso: number) => {
    const nowConcluido = !states[id].concluido
    setStates(prev => ({ ...prev, [id]: { ...prev[id], concluido: nowConcluido } }))
    if (nowConcluido) {
      startTimer(descanso)
      const idx = treino.exercicios.findIndex(e => e.id === id)
      const next = treino.exercicios[idx + 1]
      if (next) setTimeout(() => setExpandedId(next.id), 400)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      {/* Header do treino */}
      <div className="card-base p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="badge-info mb-2 inline-block">{treino.dia_semana}</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{treino.nome}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{treino.descricao}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalConcluidos}/{treino.exercicios.length}</p>
            <p className="text-xs text-gray-400">concluídos</p>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Progresso</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Dumbbell className="w-3.5 h-3.5" /><span>{treino.exercicios.length} exercícios</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Timer className="w-3.5 h-3.5" /><span>~{treino.duracao_estimada_min} min</span>
          </div>
        </div>
      </div>

      {/* Timer de descanso */}
      {(timerActive || timerSeconds > 0) && (
        <div className={clsx('card-base p-4 border-2 transition-all', timerActive ? 'border-primary-400' : 'border-gray-200 dark:border-gray-600')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary-500" /> Descanso
            </h3>
            <span className="text-xs text-gray-400">{timerTotal}s total</span>
          </div>
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" className="dark:stroke-gray-700" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - timerProgress / 100)}`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="timer-display text-3xl">{formatTime(timerSeconds)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setTimerActive(!timerActive)} className={clsx('btn-primary flex items-center gap-2 text-sm', !timerActive && 'bg-gray-600 hover:bg-gray-700')}>
              {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {timerActive ? 'Pausar' : 'Continuar'}
            </button>
            <button onClick={resetTimer} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </button>
          </div>
        </div>
      )}

      {/* Lista de exercícios */}
      <div className="space-y-3">
        {treino.exercicios.map((exercicio, index) => {
          const state = states[exercicio.id]
          const isExpanded = expandedId === exercicio.id

          return (
            <div key={exercicio.id} className={clsx('card-base overflow-hidden transition-all duration-300', state.concluido && 'opacity-70')}>
              {/* Header */}
              <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : exercicio.id)}>
                <button
                  onClick={e => { e.stopPropagation(); toggleConcluido(exercicio.id, exercicio.tempo_descanso_seg) }}
                  className={clsx('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm font-bold',
                    state.concluido ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500')}
                >
                  {state.concluido ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={clsx('font-semibold text-sm', state.concluido ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100')}>
                      {exercicio.nome}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[exercicio.grupo] ?? 'badge-gray'}`}>
                      {exercicio.grupo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {exercicio.series}x {exercicio.repeticoes}
                    {exercicio.carga_sugerida ? ` · ${exercicio.carga_sugerida}kg` : ''}
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>

              {/* Detalhes */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                  {/* Imagem do exercício */}
                  <ExercicioImagem gif_url={exercicio.gif_url} nome={exercicio.nome} />

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Séries', value: exercicio.series },
                      { label: 'Reps', value: exercicio.repeticoes },
                      { label: 'Carga', value: exercicio.carga_sugerida ? `${exercicio.carga_sugerida}kg` : '—' },
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
                        onChange={e => setStates(prev => ({
                          ...prev,
                          [exercicio.id]: { ...prev[exercicio.id], cargaUtilizada: e.target.value ? Number(e.target.value) : '' }
                        }))}
                        className="input-base"
                        min="0" step="0.5"
                      />
                      <button onClick={() => startTimer(exercicio.tempo_descanso_seg)} className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0 whitespace-nowrap">
                        <Timer className="w-4 h-4" /> Descanso
                      </button>
                    </div>
                  </div>

                  {/* Botão concluir */}
                  <button
                    onClick={() => toggleConcluido(exercicio.id, exercicio.tempo_descanso_seg)}
                    className={clsx('w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                      state.concluido ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'btn-primary')}
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

      {/* Treino concluído */}
      {totalConcluidos === treino.exercicios.length && (
        <div className="card-base p-5 text-center border-2 border-primary-300 dark:border-primary-600 animate-slide-in">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Treino Concluído!</h3>
          <p className="text-sm text-gray-500 mb-4">Parabéns! Você completou todos os exercícios.</p>
          <button className="btn-primary w-full">Finalizar e Registrar Treino</button>
        </div>
      )}
    </div>
  )
}
