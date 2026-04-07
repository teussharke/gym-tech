'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Timer, Dumbbell, Info, X, ChevronLeft, ChevronRight, Zap, TrendingUp, Smile, Frown, Meh, MessageSquare, Pause, Play, RotateCcw, Target, Clock, Youtube, WifiOff, ChevronRight as ChevronArrow } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { mockExercicios, grupoColors, getYouTubeSearchUrl, getYouTubeEmbedUrl } from '@/lib/mock/exercicios'
import { AnimatedExerciseImage } from '@/components/UIComponents'
import LoadEvolutionChart from '@/components/LoadEvolutionChart'
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

// ── Funções de Áudio ─────────────────────────────────────────
const playBeep = () => {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignorar erro em browsers que bloqueiam auto-play */ }
}

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

function FloatingTimer({ seconds, total, active, onToggle, onClose, onAddTime }: {
  seconds: number; total: number; active: boolean
  onToggle: () => void; onClose: () => void; onAddTime: (s: number) => void
}) {
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const urgent = seconds <= 10 && seconds > 0
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 w-full max-w-sm shadow-[0_10px_40px_-10px_rgba(249,115,22,0.4)] border border-orange-500/20 animate-fade-in-up pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-orange-500" />Descanso
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {seconds === 0 ? (
          <div className="flex items-center justify-between my-2">
            <div>
              <p className="text-white font-black text-lg">Tempo esgotado! 💪</p>
              <p className="text-gray-400 text-xs">Hora da próxima série</p>
            </div>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm gradient-orange text-white active:scale-95">
              Continuar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className={`font-mono text-3xl font-black ${urgent ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                  {fmt(seconds)}
                </span>
                <span className="text-gray-500 text-xs mb-1">de {total}s</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={onToggle}
                className={clsx('w-12 h-12 flex items-center justify-center rounded-xl transition-colors active:scale-95',
                  active ? 'bg-gray-800 text-white' : 'gradient-orange text-white')}>
                {active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StartScreen({ treino, onStart }: { treino: Treino; onStart: () => void }) {
  const totalSeries = treino.exercicios.reduce((s, e) => s + e.series, 0)
  const tempoEstimado = treino.duracao_estimada_min ?? Math.round(totalSeries * 2.5)

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in-up">
      {/* Hero */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--neon) 0%, #cc5500 100%)' }}>
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-4 -bottom-8 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          {treino.dia_semana && (
            <span className="inline-flex items-center bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-lg mb-2">
              Treino {treino.dia_semana}
            </span>
          )}
          <h1 className="text-xl font-black text-white leading-tight mb-1"
            style={{ fontFamily: 'var(--font-display)' }}>
            {treino.nome}
          </h1>
          {treino.descricao && (
            <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{treino.descricao}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Dumbbell, value: treino.exercicios.length, label: 'Exercícios', color: 'var(--neon)' },
          { icon: Target,   value: totalSeries,              label: 'Séries',     color: '#60a5fa' },
          { icon: Clock,    value: `~${tempoEstimado}`,      label: 'Minutos',    color: '#4ade80' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="card-base p-3 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
            <p className="text-xl font-black leading-none mb-0.5"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de exercícios */}
      <div className="card-base overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}>
            Exercícios de hoje
          </p>
        </div>
        <div>
          {treino.exercicios.map((ex, i) => {
            const rawNome = ex.exercicio?.nome ?? ex.observacoes ?? `Exercício ${i + 1}`
            const nomeStr = rawNome.includes(' | ') ? rawNome.split(' | ')[0].trim() : rawNome
            const grupo = ex.exercicio?.grupo_muscular?.replace(/_/g, ' ') ?? null
            return (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < treino.exercicios.length - 1 ? '1px solid var(--border)' : undefined }}>
                <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--neon-dim)', color: 'var(--neon)' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>{nomeStr}</p>
                  {grupo && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${grupoColors[grupo] ?? 'badge-gray'}`}>
                      {grupo}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                  {ex.series}×{ex.repeticoes}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botão iniciar */}
      <button onClick={onStart}
        className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 gradient-orange text-white active:scale-95 transition-all animate-bounce-in"
        style={{ fontFamily: 'var(--font-display)', boxShadow: '0 8px 32px var(--neon-glow)' }}>
        <Zap className="w-5 h-5" />
        INICIAR TREINO
      </button>
    </div>
  )
}

// ── Seletor de múltiplos treinos A/B/C ─────────────────────────────────────
function TreinoSelectorScreen({ treinos, recomendadoIdx, isOffline, onSelect }: {
  treinos: Treino[]
  recomendadoIdx: number
  isOffline: boolean
  onSelect: (t: Treino) => void
}) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F']
  const diaColors: Record<string, string> = {
    A: '#3b82f6', B: '#22c55e', C: '#a855f7', D: '#f97316', E: '#ec4899', F: '#14b8a6'
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-black uppercase leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
          Qual treino hoje?
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Escolha a ficha que deseja executar</p>
        {isOffline && (
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl w-fit"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">Modo offline — cache local</span>
          </div>
        )}
      </div>

      {/* Cards de treino */}
      <div className="space-y-3">
        {treinos.map((t, i) => {
          const isRecomendado = i === recomendadoIdx
          const totalSeries = t.exercicios.reduce((s, e) => s + e.series, 0)
          const tempoEstimado = t.duracao_estimada_min ?? Math.round(totalSeries * 2.5)
          const label = t.dia_semana ?? labels[i] ?? String(i + 1)
          const accentColor = diaColors[label] ?? 'var(--neon)'

          return (
            <button key={t.id} onClick={() => onSelect(t)}
              className="w-full text-left rounded-2xl transition-all duration-200 active:scale-[0.98] overflow-hidden"
              style={{
                background: isRecomendado
                  ? `linear-gradient(135deg, var(--neon) 0%, #cc5500 100%)`
                  : 'var(--bg-card)',
                border: isRecomendado
                  ? '2px solid transparent'
                  : `1px solid var(--border)`,
                boxShadow: isRecomendado ? '0 8px 32px var(--neon-glow)' : undefined,
              }}>

              {/* Faixa superior do card */}
              {!isRecomendado && (
                <div className="h-1 w-full" style={{ background: accentColor, opacity: 0.6 }} />
              )}

              <div className="p-4">
                {/* Linha principal: badge + nome + chevron */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
                    style={{
                      background: isRecomendado ? 'rgba(255,255,255,0.2)' : `${accentColor}22`,
                      color: isRecomendado ? 'white' : accentColor,
                      fontFamily: 'var(--font-display)',
                    }}>
                    {label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base leading-tight truncate"
                      style={{ color: isRecomendado ? 'white' : 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                      {t.nome}
                    </p>
                    {isRecomendado && (
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        ⭐ Recomendado para hoje
                      </span>
                    )}
                    {t.descricao && !isRecomendado && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{t.descricao}</p>
                    )}
                  </div>
                  <ChevronArrow className="w-4 h-4 flex-shrink-0"
                    style={{ color: isRecomendado ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }} />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2">
                  {[
                    { v: t.exercicios.length, l: 'exerc.' },
                    { v: totalSeries,          l: 'séries' },
                    { v: `~${tempoEstimado}min`, l: 'duração' },
                  ].map(({ v, l }) => (
                    <div key={l} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                      style={{
                        background: isRecomendado ? 'rgba(255,255,255,0.15)' : 'var(--bg-chip)',
                      }}>
                      <span className="text-sm font-black"
                        style={{ color: isRecomendado ? 'white' : 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                        {v}
                      </span>
                      <span className="text-xs"
                        style={{ color: isRecomendado ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TreinoAlunoPage() {
  const { usuario, session } = useAuth()
  // ── múltiplos treinos ──────────────────────────────────────
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null)
  // ícone de compatibilidade: "treino" ainda referencia o selecionado
  const treino = treinoSelecionado
  const [recomendadoIdx, setRecomendadoIdx] = useState(0)
  const [isOfflineCache, setIsOfflineCache] = useState(false)
  // ── estado original ────────────────────────────────────────
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
  const [imgErrs, setImgErrs] = useState<Record<string, boolean>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [historicoId, setHistoricoId] = useState<string | null>(null)
  const [youtubeModal, setYoutubeModal] = useState<{ url: string; nome: string } | null>(null)
  const [ultimasCargas, setUltimasCargas] = useState<Record<string, number | null>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const fetchAluno = useCallback(async () => {
    if (!usuario?.id) { setLoading(false); return }
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
    const CACHE_KEY = `treino_cache_${alunoId}`
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select(`id, nome, dia_semana, descricao, duracao_estimada_min,
          exercicios:treino_exercicios (
            id, series, repeticoes, carga_sugerida, tempo_descanso_seg, observacoes, ordem,
            exercicio:exercicios (id, nome, grupo_muscular, gif_url, youtube_url, equipamento)
          )`)
        .eq('aluno_id', alunoId).eq('ativo', true)
        .order('created_at', { ascending: true })
      if (error && error.code !== 'PGRST116') throw error

      const lista = ((data ?? []) as unknown as Treino[]).map(t => ({
        ...t,
        exercicios: (t.exercicios ?? []).sort((a, b) => a.ordem - b.ordem),
      }))

      if (lista.length > 0) {
        // Salvar cache no localStorage para uso offline
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ treinos: lista, ts: Date.now() }))
        } catch { /* localStorage pode estar cheio */ }
        setIsOfflineCache(false)
        setTreinos(lista)

        // Detectar próximo treino recomendado pelo histórico
        const { data: hist } = await supabase
          .from('historico_treinos')
          .select('treino_id')
          .eq('aluno_id', alunoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (hist?.treino_id) {
          const lastIdx = lista.findIndex(t => t.id === hist.treino_id)
          const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % lista.length : 0
          setRecomendadoIdx(nextIdx)
          // Auto-selecionar se só há 1 treino
          if (lista.length === 1) setTreinoSelecionado(lista[0])
        } else {
          setRecomendadoIdx(0)
          if (lista.length === 1) setTreinoSelecionado(lista[0])
        }
        // Inicializar estados de séries para todos os treinos
        initStates(lista[0])
      }
    } catch {
      // Tentar carregar do cache localStorage (modo offline)
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { treinos: cachedTreinos, ts } = JSON.parse(cached)
          // Cache válido por 24 horas
          if (Date.now() - ts < 86_400_000 && cachedTreinos?.length > 0) {
            setTreinos(cachedTreinos)
            setIsOfflineCache(true)
            setRecomendadoIdx(0)
            if (cachedTreinos.length === 1) setTreinoSelecionado(cachedTreinos[0])
            initStates(cachedTreinos[0])
            toast('⚡ Treino carregado do cache offline', { icon: '📴' })
          } else {
            toast.error('Sem conexão e cache expirado')
          }
        } else {
          toast.error('Erro ao carregar treino')
        }
      } catch { toast.error('Erro ao carregar treino') }
    } finally { setLoading(false) }
  }, [alunoId])

  const initStates = (t: Treino) => {
    setStates(Object.fromEntries(t.exercicios.map(e => [
      e.id,
      { series: Array.from({ length: e.series }, () => ({ carga: '', done: false })), concluido: false },
    ])))
  }

  // Busca a última carga registrada para cada exercício
  const fetchUltimasCargas = useCallback(async (exercicios: ExercicioTreino[]) => {
    if (!alunoId || exercicios.length === 0) return
    const ids = exercicios.map(e => e.exercicio?.id).filter(Boolean) as string[]
    if (ids.length === 0) return
    const { data } = await supabase
      .from('registro_cargas')
      .select('exercicio_id, carga_utilizada, data_registro')
      .eq('aluno_id', alunoId)
      .in('exercicio_id', ids)
      .order('data_registro', { ascending: false })
    if (!data) return
    // Pegar a carga mais recente por exercício
    const map: Record<string, number | null> = {}
    for (const r of data) {
      if (!map[r.exercicio_id]) map[r.exercicio_id] = r.carga_utilizada
    }
    setUltimasCargas(map)
  }, [alunoId])

  // Check-in automático silencioso ao iniciar treino
  const autoCheckin = useCallback(async () => {
    if (!alunoId || !usuario?.academia_id || !session?.access_token) return
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ aluno_id: alunoId, academia_id: usuario.academia_id }),
      })
      // 409 = já fez check-in hoje → silencioso; outros erros também silenciosos (não bloqueia treino)
    } catch { /* check-in é secundário — nunca bloqueia o treino */ }
  }, [alunoId, usuario?.academia_id, session?.access_token])

  useEffect(() => { fetchAluno() }, [fetchAluno])
  useEffect(() => {
    if (alunoId) fetchTreino()
  }, [fetchTreino, alunoId])
  useEffect(() => {
    if (treinoSelecionado) fetchUltimasCargas(treinoSelecionado.exercicios)
  }, [treinoSelecionado, fetchUltimasCargas])

  // Timer countdown — depende APENAS de timerActive para não recriar interval a cada segundo
  useEffect(() => {
    if (!timerActive) {
      clearInterval(intervalRef.current!)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimerSecs(s => {
        if (s <= 1) {
          playBeep()
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

  const goTo = (i: number) => { setCurrentIndex(i) }

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
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
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
      // Voltar para o seletor após finalizar (permite escolher próximo treino A/B/C)
      setTreinoSelecionado(null)
      setCurrentIndex(0)
    }
  }

  // ── Render flow ──────────────────────────────────────────────────────────────────
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

  // Sem treinos ativos
  if (treinos.length === 0) return (
    <div className="max-w-lg mx-auto card-base p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4 animate-float">🏗️</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhum treino ativo</h2>
      <p className="text-gray-500">Seu professor ainda não criou um treino para você.</p>
    </div>
  )

  // Seletor de treinos A/B/C (quando não há treino selecionado)
  if (!treinoSelecionado) return (
    <TreinoSelectorScreen
      treinos={treinos}
      recomendadoIdx={recomendadoIdx}
      isOffline={isOfflineCache}
      onSelect={(t) => {
        setTreinoSelecionado(t)
        initStates(t)
        setCurrentIndex(0)
        setImgErrs({})
      }}
    />
  )

  if (!started) return (
    <StartScreen
      treino={treinoSelecionado}
      onStart={() => {
        setStarted(true)
        autoCheckin()
      }}
    />
  )

  // A partir daqui treinoSelecionado está garantido (guard acima)
  const t = treinoSelecionado

  // Tela de execução
  const totalConcluidos = Object.values(states).filter(s => s.concluido).length
  const progress = t.exercicios.length > 0 ? (totalConcluidos / t.exercicios.length) * 100 : 0
  const ex = t.exercicios[currentIndex]
  if (!ex) return null

  const rawNomeObj = ex.exercicio?.nome ?? ex.observacoes ?? `Exercício ${currentIndex + 1}`
  const nome = rawNomeObj.includes(' | ') ? rawNomeObj.split(' | ')[0].trim() : rawNomeObj
  const observacoes = rawNomeObj.includes(' | ') ? rawNomeObj.split(' | ').slice(1).join(' | ').trim() : null
  const grupo = ex.exercicio?.grupo_muscular?.replace(/_/g, ' ') ?? null
  const state = states[ex.id] ?? {
    series: Array.from({ length: ex.series }, () => ({ carga: '', done: false })),
    concluido: false,
  }
  const seriesFeitas = state.series.filter(s => s.done).length

  // ── Prepara dados do GIF fora do JSX ──────────────────────────
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  const nName = normalize(nome)
  const words = nName.split(' ').filter(w => w.length > 3)
  const mockEx = mockExercicios.find(m => normalize(m.nome) === nName)
    || mockExercicios.find(m => normalize(m.nome).includes(nName) || nName.includes(normalize(m.nome)))
    || (words.length > 0 && mockExercicios.find(m => words.every(w => normalize(m.nome).includes(w))))
    || (words.length > 0 && mockExercicios.find(m => words.some(w => w.length > 5 && normalize(m.nome).includes(w))))
    || null
  const gifUrl = ex.exercicio?.gif_url || mockEx?.gif_url || null
  const imgErr = imgErrs[ex.id] ?? false
  const hasGif = !!gifUrl && !imgErr
  const youtubeUrl = ex.exercicio?.youtube_url ?? null
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${nome} academia execução correta`)}`
  const ytIdMatch = youtubeUrl?.match(/(?:v=|youtu\.be\/)([^&?\s]{11})/)
  const ytThumbnail = ytIdMatch ? `https://img.youtube.com/vi/${ytIdMatch[1]}/mqdefault.jpg` : null
  const exercicioId = ex.exercicio?.id
  const ultimaCarga = exercicioId ? (ultimasCargas[exercicioId] ?? null) : null

  return (
    <>
      {youtubeModal && (
        <YouTubeModal url={youtubeModal.url} nome={youtubeModal.nome} onClose={() => setYoutubeModal(null)} />
      )}
      {showFeedback && (
        <FeedbackModal onSave={saveFeedback} saving={feedbackSaving} />
      )}
      {showTimer && !showFeedback && (
        <FloatingTimer
          seconds={timerSecs} total={timerTotal} active={timerActive}
          onToggle={() => setTimerActive(a => !a)}
          onAddTime={addTimerTime}
          onClose={() => { setShowTimer(false); setTimerActive(false) }}
        />
      )}

      {/* ── Layout sem max-w para o hero de imagem ── */}
      <div className="page-enter -mx-4 sm:-mx-6">

        {/* ══ HERO: GIF full-bleed ══════════════════════════ */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          className="relative group" style={{ height: '52vw', minHeight: '200px', maxHeight: '280px' }}>

          {/* Imagem / GIF */}
          {hasGif ? (
            <AnimatedExerciseImage src={gifUrl!} alt={nome}
              className="w-full h-full object-cover"
              onError={() => setImgErrs(prev => ({ ...prev, [ex.id]: true }))} />
          ) : ytThumbnail ? (
            <img src={ytThumbnail} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(160deg, #1a1a24 0%, #0d0d14 100%)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--neon-dim)' }}>
                <Dumbbell className="w-8 h-8" style={{ color: 'var(--neon)' }} />
              </div>
            </div>
          )}

          {/* Gradientes de overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.75) 100%)' }} />

          {/* ── Barra de progresso topo ── */}
          <div className="absolute top-0 inset-x-0 px-4 pt-3 pb-2">
            {isOfflineCache && (
              <div className="flex items-center gap-1.5 mb-2">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-300 font-medium">Offline</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {t.dia_semana && (
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(255,107,0,0.3)', color: 'var(--neon)' }}>
                      {t.dia_semana}
                    </span>
                  )}
                  <span className="text-xs font-medium truncate text-white/70">{t.nome}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: progress === 100 ? '#22c55e' : 'var(--neon)' }} />
                </div>
              </div>
              <span className="text-white font-black text-lg leading-none flex-shrink-0"
                style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                {totalConcluidos}/{t.exercicios.length}
              </span>
            </div>
          </div>

          {/* ── Badges (grupo muscular, vídeo) ── */}
          <div className="absolute left-4 bottom-3 flex gap-2">
            {grupo && (
              <span className={`text-xs px-2 py-1 rounded-lg font-semibold shadow ${grupoColors[grupo] ?? 'badge-gray'}`}>
                {grupo}
              </span>
            )}
            {youtubeUrl && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded-lg font-bold shadow">
                <Youtube className="w-3 h-3" /> Vídeo
              </span>
            )}
          </div>

          {/* ── Botão YouTube play ── */}
          {youtubeUrl && !state.concluido && (
            <button onClick={() => setYoutubeModal({ url: youtubeUrl, nome })}
              className="absolute inset-0 flex items-center justify-center" aria-label="Assistir vídeo">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 active:scale-95"
                style={{ background: 'rgba(220,38,38,0.9)' }}>
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            </button>
          )}

          {/* Overlay concluído */}
          {state.concluido && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: 'rgba(34,197,94,0.18)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.9)' }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
          )}

          {/* Link busca YouTube (canto inferior direito) */}
          {!youtubeUrl && (
            <a href={searchUrl} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-3 right-4 flex items-center gap-1.5 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium active:scale-95 transition-all"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </a>
          )}

          {/* Série progress bar na borda inferior do hero */}
          <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-1 transition-all duration-500"
              style={{
                width: `${ex.series > 0 ? (seriesFeitas / ex.series) * 100 : 0}%`,
                background: seriesFeitas === ex.series ? '#22c55e' : 'var(--neon)'
              }} />
          </div>
        </div>

        {/* ══ CORPO DO CARD ════════════════════════════════ */}
        <div className="px-4 sm:px-6 max-w-lg mx-auto space-y-4 pt-4 pb-6">

          {/* ── Navegação dots ── */}
          <div className="flex items-center justify-between">
            <button onClick={() => goTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
              className="btn-ghost p-2 rounded-xl disabled:opacity-25 active:scale-90 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5 flex-wrap justify-center px-2">
              {t.exercicios.map((e, i) => (
                <button key={e.id} onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIndex ? '22px' : '8px',
                    height: '8px',
                    background: i === currentIndex
                      ? 'var(--neon)'
                      : states[e.id]?.concluido ? '#22c55e' : 'var(--border)'
                  }} />
              ))}
            </div>
            <button onClick={() => goTo(Math.min(t.exercicios.length - 1, currentIndex + 1))}
              disabled={currentIndex === t.exercicios.length - 1}
              className="btn-ghost p-2 rounded-xl disabled:opacity-25 active:scale-90 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* ── Nome do exercício ── */}
          <div>
            <h2 className={clsx('font-black uppercase leading-tight', state.concluido && 'line-through opacity-40')}
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', letterSpacing: '-0.01em' }}>
              {nome}
            </h2>

            {/* Chips de info */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--neon-dim)' }}>
                <Dumbbell className="w-3.5 h-3.5" style={{ color: 'var(--neon)' }} />
                <span className="text-sm font-black" style={{ color: 'var(--neon)' }}>{ex.repeticoes} reps</span>
              </div>
              <button onClick={() => startTimer(ex.tempo_descanso_seg)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                style={{ background: 'var(--bg-chip)' }}>
                <Timer className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{ex.tempo_descanso_seg}s</span>
              </button>
              {ex.carga_sugerida ? (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--bg-chip)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>~{ex.carga_sugerida}kg sugerido</span>
                </div>
              ) : null}
              {ultimaCarga !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(96,165,250,0.12)' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
                  <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>Última: {ultimaCarga}kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {(ex.observacoes || observacoes) && (
            <div className="flex gap-2.5 rounded-2xl p-3.5"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300 leading-relaxed">{ex.observacoes || observacoes}</p>
            </div>
          )}

          {/* ── Séries ── */}
          <div className="space-y-2.5">
            <p className="text-xs font-black uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-3)' }}>
              Séries — {ex.series}× {ex.repeticoes} reps
            </p>

            {state.series.map((serie, si) => {
              const isActive = si === seriesFeitas && !serie.done
              return (
                <div key={si}
                  className="flex items-center gap-3 rounded-2xl transition-all duration-200"
                  style={{
                    padding: '10px 12px',
                    background: serie.done
                      ? 'rgba(34,197,94,0.07)'
                      : isActive ? 'var(--neon-dim)' : 'var(--bg-chip)',
                    border: isActive
                      ? '1.5px solid rgba(255,107,0,0.3)'
                      : serie.done
                        ? '1.5px solid rgba(34,197,94,0.2)'
                        : '1.5px solid transparent',
                  }}>

                  {/* Número da série */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: serie.done ? '#22c55e' : isActive ? 'var(--neon)' : 'var(--border)',
                      color: serie.done || isActive ? 'white' : 'var(--text-3)',
                    }}>
                    {serie.done ? '✓' : si + 1}
                  </div>

                  {/* Input carga + label */}
                  <div className="flex items-center gap-1 flex-shrink-0"
                    style={{ background: 'var(--bg-base)', borderRadius: '10px', border: '1.5px solid var(--border)', overflow: 'hidden', opacity: serie.done ? 0.5 : 1 }}>
                    <input
                      type="number" inputMode="decimal"
                      value={serie.carga}
                      onChange={e => handleCarga(ex.id, si, e.target.value)}
                      placeholder={ultimaCarga !== null ? ultimaCarga.toString() : (ex.carga_sugerida?.toString() ?? '0')}
                      className="w-16 text-center font-black text-base focus:outline-none bg-transparent"
                      style={{ color: 'var(--text-1)', padding: '8px 4px' }}
                      min="0" step="0.5"
                      disabled={serie.done}
                    />
                    <span className="text-xs pr-2 font-semibold" style={{ color: 'var(--text-3)' }}>kg</span>
                  </div>

                  {/* Botão FAZER */}
                  <button
                    onClick={() => handleSerie(ex.id, si, ex.tempo_descanso_seg)}
                    className="flex-1 rounded-xl font-black text-sm active:scale-95 transition-all"
                    style={{
                      minHeight: '44px',
                      fontFamily: 'var(--font-display)',
                      background: serie.done
                        ? 'rgba(34,197,94,0.12)'
                        : isActive ? 'var(--neon)' : 'var(--border)',
                      color: serie.done ? '#86efac' : isActive ? 'white' : 'var(--text-3)',
                    }}>
                    {serie.done ? '✓ Feita' : 'FAZER'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Gráfico evolução */}
          {alunoId && ex.exercicio?.id && (
            <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <LoadEvolutionChart
                alunoId={alunoId}
                exercicioId={ex.exercicio.id}
                cargaSugerida={ex.carga_sugerida}
              />
            </div>
          )}

          {/* ── Tela de conclusão ── */}
          {totalConcluidos === t.exercicios.length && (
            <div className="rounded-3xl p-6 text-center animate-bounce-in"
              style={{ border: '2px solid var(--neon)', background: 'var(--bg-card)', boxShadow: '0 0 40px var(--neon-glow)' }}>
              <div className="text-5xl mb-3 animate-float">🎉</div>
              <h3 className="text-2xl font-black uppercase mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
                Treino Concluído!
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
                Parabéns! Você completou todos os exercícios.
              </p>
              <button onClick={finalizarTreino} disabled={saving}
                className="btn-primary w-full py-4 rounded-2xl text-base font-black"
                style={{ fontFamily: 'var(--font-display)', boxShadow: '0 4px 24px var(--neon-glow)' }}>
                {saving ? 'Registrando...' : '🏆 Finalizar e Registrar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
