'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Clock, Calendar, Trophy, TrendingUp, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay, subMonths, addMonths, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Presenca {
  id: string
  data_checkin: string
}

function computeStreak(presencas: Presenca[]): number {
  const dias = new Set(presencas.map(p => p.data_checkin.split('T')[0]))
  let streak = 0
  const hoje = new Date()
  for (let i = 0; i < 60; i++) {
    const d = subDays(hoje, i)
    const ds = format(d, 'yyyy-MM-dd')
    if (dias.has(ds)) streak++
    else if (i > 0) break
  }
  return streak
}

export default function CheckinPage() {
  const { usuario, session } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(false)
  const [loading, setLoading] = useState(false)
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [mesAtual, setMesAtual] = useState(new Date())
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [hora, setHora] = useState(format(new Date(), 'HH:mm'))

  useEffect(() => {
    const t = setInterval(() => setHora(format(new Date(), 'HH:mm')), 10_000)
    return () => clearInterval(t)
  }, [])

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchPresencas = useCallback(async () => {
    if (!alunoId) return
    // Busca últimos 2 meses para calcular streak
    const inicio = startOfMonth(subMonths(mesAtual, 1)).toISOString()
    const fim = endOfMonth(mesAtual).toISOString()
    const { data } = await supabase
      .from('presencas')
      .select('id, data_checkin')
      .eq('aluno_id', alunoId)
      .gte('data_checkin', inicio)
      .lte('data_checkin', fim)
    const lista = data ?? []
    setPresencas(lista)
    setStreak(computeStreak(lista))
    const hoje = new Date().toISOString().split('T')[0]
    setCheckinHoje(lista.some(p => p.data_checkin.startsWith(hoje)))
  }, [alunoId, mesAtual])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { fetchPresencas() }, [fetchPresencas])

  const handleCheckin = async () => {
    if (!alunoId || !usuario?.academia_id) { toast.error('Dados incompletos'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ aluno_id: alunoId, academia_id: usuario.academia_id }),
      })
      const data = await res.json()
      if (res.status === 409) {
        // Já fez check-in hoje — atualiza UI para refletir isso
        setCheckinHoje(true)
        toast('Você já fez check-in hoje! ✅', { icon: '📋' })
        return
      }
      if (!res.ok) throw new Error(data.error)
      setCheckinHoje(true)
      setStreak(s => s + 1)
      toast.success('Check-in realizado! 💪')
      fetchPresencas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer check-in')
    } finally {
      setLoading(false)
    }
  }

  const totalPresencas = new Set(presencas.filter(p => p.data_checkin.startsWith(format(mesAtual, 'yyyy-MM'))).map(p => p.data_checkin.split('T')[0])).size
  const meta = 20
  const percentual = Math.round((totalPresencas / meta) * 100)
  const totalDias = getDaysInMonth(mesAtual)
  const primeiroDia = getDay(new Date(format(mesAtual, 'yyyy-MM') + '-01'))
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diasPresente = new Set(presencas.map(p => p.data_checkin.split('T')[0]))

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Check-in</h1>
        <p className="page-subtitle capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      {/* Hero check-in */}
      {!checkinHoje ? (
        <div className="card-base p-8 flex flex-col items-center gap-6">
          <p className="text-[var(--text-2)] text-sm font-medium">{greeting()}, {usuario?.nome.split(' ')[0]}! Pronto para treinar?</p>

          {/* Pulsing button */}
          <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
            {/* Outer rings */}
            <span className="absolute inset-0 rounded-full border border-[var(--neon)] opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute rounded-full border border-[var(--neon)] opacity-30"
              style={{ width: 150, height: 150, top: 15, left: 15, animation: 'pulse-ring 2.5s ease-out infinite 0.5s' }} />

            <button
              onClick={handleCheckin}
              disabled={loading || !alunoId}
              className="relative w-36 h-36 rounded-full gradient-orange neon-glow flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform duration-150 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
                  <span className="text-white font-bold text-sm tracking-wide">CHECK-IN</span>
                </>
              )}
            </button>
          </div>

          {/* Hora */}
          <div className="flex items-center gap-2 text-[var(--text-2)] text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">{hora}</span>
          </div>

          {!alunoId && <p className="text-xs text-amber-500 text-center">Seu perfil de aluno não foi encontrado.</p>}
        </div>
      ) : (
        <div className="card-base p-8 flex flex-col items-center gap-4 border border-[var(--border-neon)] animate-scale-in">
          {/* Celebration */}
          <div className="w-24 h-24 gradient-orange rounded-full flex items-center justify-center neon-glow animate-bounce-in">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-[var(--text-1)]">Check-in feito! 🎉</h2>
            <p className="text-[var(--text-2)] text-sm mt-1">{format(new Date(), "HH:mm 'de' dd/MM/yyyy")}</p>
          </div>
          <div className="w-full bg-[var(--neon-dim)] border border-[var(--border-neon)] rounded-xl py-3 text-center">
            <p className="text-[var(--neon)] font-bold">Bom treino! 💪</p>
          </div>
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="card-base p-4 flex items-center gap-4 border border-orange-500/20">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[var(--text-2)] text-xs font-medium">Sequência atual</p>
            <p className="text-[var(--text-1)] font-black text-xl leading-tight">
              {streak} {streak === 1 ? 'dia' : 'dias'} seguidos 🔥
            </p>
          </div>
          {streak >= 5 && (
            <span className="badge-info text-xs px-2 py-1 flex-shrink-0">
              {streak >= 20 ? 'Lenda 🏆' : streak >= 10 ? 'Elite 💎' : 'Em chama 🔥'}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card-gradient gradient-orange text-center relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <Calendar className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{totalPresencas}</p>
            <p className="text-white/70 text-xs">Check-ins</p>
          </div>
        </div>
        <div className="stat-card-gradient gradient-blue text-center relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <TrendingUp className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{percentual}%</p>
            <p className="text-white/70 text-xs">Da meta</p>
          </div>
        </div>
        <div className="stat-card-gradient gradient-success text-center relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <Trophy className="w-4 h-4 text-white/70 mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{meta}</p>
            <p className="text-white/70 text-xs">Meta/mês</p>
          </div>
        </div>
      </div>

      {/* Meta progress */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-1)]">Meta do Mês</h3>
          <span className="text-sm font-bold neon-text">{totalPresencas}/{meta} dias</span>
        </div>
        <div className="progress-bar h-3">
          <div className="progress-fill h-3" style={{ width: `${Math.min(percentual, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
          <span>{Math.max(meta - totalPresencas, 0)} dias restantes</span>
          {totalPresencas >= meta && <span className="text-green-400 font-semibold">🏆 Meta atingida!</span>}
        </div>
      </div>

      {/* Calendário */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="btn-ghost p-2 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h3 className="font-semibold text-[var(--text-1)] capitalize">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="btn-ghost p-2 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map(d => (
            <div key={d} className="text-center text-xs text-[var(--text-3)] font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1
            const dataStr = `${format(mesAtual, 'yyyy-MM')}-${String(dia).padStart(2, '0')}`
            const presente = diasPresente.has(dataStr)
            const hoje = format(new Date(), 'yyyy-MM-dd') === dataStr
            return (
              <div key={dia} className={clsx(
                'h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all',
                presente ? 'gradient-orange text-white shadow-sm shadow-orange-500/20' :
                hoje ? 'border border-[var(--border-neon)] text-[var(--neon)]' :
                'text-[var(--text-3)]'
              )}>{dia}</div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-5 text-xs text-[var(--text-3)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded gradient-orange" />
            <span>Presente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-[var(--border-neon)]" />
            <span>Hoje</span>
          </div>
        </div>
      </div>
    </div>
  )
}
