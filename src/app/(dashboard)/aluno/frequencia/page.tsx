'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, Calendar, ChevronLeft, ChevronRight, Flame, Star } from 'lucide-react'
import { format, getDaysInMonth, startOfMonth, getDay, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

interface RankingItem { nome: string; checkins: number; isMe: boolean }

export default function FrequenciaPage() {
  const { usuario } = useAuth()
  const [mesAtual, setMesAtual] = useState(new Date())
  const [diasPresente, setDiasPresente] = useState<Set<string>>(new Set())
  const [historicoMeses, setHistoricoMeses] = useState<{ mes: string; presencas: number }[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [meuRanking, setMeuRanking] = useState(0)
  const [streak, setStreak] = useState(0)
  const meta = 20

  const fetchTudo = useCallback(async () => {
    if (!usuario?.id || !usuario?.academia_id) {
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      const { data: alunoData } = await supabase
        .from('alunos')
        .select('id')
        .eq('usuario_id', usuario.id)
        .single()

      if (!alunoData) { setLoading(false); return }
      const alunoId = alunoData.id

      const inicio6Meses = startOfMonth(subMonths(new Date(), 5)).toISOString()

      const { data: todasPresencas } = await supabase
        .from('presencas')
        .select('aluno_id, data_checkin')
        .eq('academia_id', usuario.academia_id)
        .gte('data_checkin', inicio6Meses)

      if (!todasPresencas) { setLoading(false); return }

      const minhasPresencas = todasPresencas.filter(p => p.aluno_id === alunoId)

      // Dias do mês atual
      const mesStr = format(mesAtual, 'yyyy-MM')
      const diasDoMes = new Set(
        minhasPresencas
          .filter(p => p.data_checkin.startsWith(mesStr))
          .map(p => p.data_checkin.split('T')[0])
      )
      setDiasPresente(diasDoMes)

      // Streak
      const todosDias = new Set(minhasPresencas.map(p => p.data_checkin.split('T')[0]))
      let s = 0
      const hoje = new Date()
      for (let i = 0; i < 60; i++) {
        const d = new Date(hoje); d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        if (todosDias.has(ds)) s++
        else if (i > 0) break
      }
      setStreak(s)

      // Histórico 6 meses
      const historico = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i)
        const mesRef = format(d, 'yyyy-MM')
        const presencas = new Set(
          minhasPresencas
            .filter(p => p.data_checkin.startsWith(mesRef))
            .map(p => p.data_checkin.split('T')[0])
        ).size
        return { mes: format(d, 'MMM/yy', { locale: ptBR }), presencas }
      })
      setHistoricoMeses(historico)

      // Ranking do mês atual
      const mesAtualStr = format(new Date(), 'yyyy-MM')
      const presencasMes = todasPresencas.filter(p => p.data_checkin.startsWith(mesAtualStr))
      const contagem: Record<string, number> = {}
      presencasMes.forEach(p => { contagem[p.aluno_id] = (contagem[p.aluno_id] ?? 0) + 1 })

      const topIds = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

      if (topIds.length > 0) {
        const { data: alunosRanking } = await supabase
          .from('alunos')
          .select('id, usuario:usuarios!alunos_usuario_id_fkey(nome)')
          .in('id', topIds)

        const rankingFull: RankingItem[] = topIds.map(id => {
          const aluno = (alunosRanking ?? []).find(a => a.id === id)
          return {
            nome: (aluno?.usuario as unknown as { nome: string })?.nome ?? 'Desconhecido',
            checkins: contagem[id],
            isMe: id === alunoId,
          }
        })

        setRanking(rankingFull)
        setMeuRanking(rankingFull.findIndex(r => r.isMe) + 1)
      }
    } catch (err) {
      console.error('Erro frequência:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.id, usuario?.academia_id, mesAtual])

  useEffect(() => { fetchTudo() }, [fetchTudo])

  const totalPresencas = diasPresente.size
  const percentual = Math.round((totalPresencas / meta) * 100)
  const totalDias = getDaysInMonth(mesAtual)
  const primeiroDia = getDay(startOfMonth(mesAtual))
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const rankEmoji = (i: number) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `${i + 1}°`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minha Frequência</h1>
        <p className="page-subtitle">Acompanhe sua assiduidade</p>
      </div>

      {loading ? (
        <div className="card-base p-12 text-center">
          <div className="w-8 h-8 border-4 border-[var(--neon)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--text-3)] text-sm">Carregando frequência...</p>
        </div>
      ) : (
        <>
          {/* Stats gradient */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card-gradient gradient-orange relative overflow-hidden text-center">
              <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <Calendar className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-black text-white">{totalPresencas}</p>
                <p className="text-white/70 text-xs">Presenças</p>
              </div>
            </div>
            <div className="stat-card-gradient gradient-blue relative overflow-hidden text-center">
              <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <TrendingUp className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-black text-white">{percentual}%</p>
                <p className="text-white/70 text-xs">Da meta</p>
              </div>
            </div>
            <div className="stat-card-gradient gradient-purple relative overflow-hidden text-center">
              <div className="absolute -right-3 -top-3 w-14 h-14 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <Trophy className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <p className="text-2xl font-black text-white">{meuRanking > 0 ? `#${meuRanking}` : '—'}</p>
                <p className="text-white/70 text-xs">Ranking</p>
              </div>
            </div>
          </div>

          {/* Streak banner */}
          {streak > 0 && (
            <div className="card-base p-4 flex items-center gap-4 border border-orange-500/30 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-[var(--text-3)] text-xs">Sequência atual</p>
                <p className="text-[var(--text-1)] font-black text-lg leading-tight">
                  {streak} {streak === 1 ? 'dia' : 'dias'} consecutivos
                </p>
              </div>
              {streak >= 7 && (
                <div className="flex flex-col items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-yellow-400 font-bold">
                    {streak >= 30 ? 'Lenda' : streak >= 14 ? 'Elite' : 'Dedicado'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-1)]">Meta do Mês</h3>
              <span className="text-sm font-bold neon-text">{totalPresencas}/{meta} dias</span>
            </div>
            <div className="relative h-3 bg-[var(--bg-chip)] rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(percentual, 100)}%`,
                  background: 'linear-gradient(90deg, var(--neon), var(--neon-secondary))',
                  boxShadow: '0 0 8px var(--neon-glow)',
                }}
              />
              {/* Milestone marker */}
              {totalPresencas < meta && (
                <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: '50%' }} />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
              <span>Faltam {Math.max(meta - totalPresencas, 0)} dias</span>
              {totalPresencas >= meta
                ? <span className="text-green-400 font-semibold">🏆 Meta atingida!</span>
                : <span>{Math.round((totalPresencas / meta) * 100)}% concluído</span>
              }
            </div>
          </div>

          {/* Calendário */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="btn-ghost p-2 rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-[var(--text-1)] capitalize">
                {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="btn-ghost p-2 rounded-xl">
                <ChevronRight className="w-4 h-4" />
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

          {/* Histórico 6 meses */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-1)]">Últimos 6 meses</h3>
            {historicoMeses.map(m => {
              const pct = Math.min((m.presencas / meta) * 100, 100)
              const cor = m.presencas >= meta ? '#22c55e' : m.presencas >= meta * 0.7 ? '#f59e0b' : 'var(--neon)'
              return (
                <div key={m.mes} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-2)] w-14 flex-shrink-0 capitalize font-medium">{m.mes}</span>
                  <div className="flex-1 h-2 bg-[var(--bg-chip)] rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-2)] w-10 text-right">{m.presencas}/{meta}</span>
                  {m.presencas >= meta && <span className="text-sm">🏆</span>}
                </div>
              )
            })}
          </div>

          {/* Ranking */}
          {ranking.length > 0 && (
            <div className="card-base overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-1)] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Ranking do Mês
                </h3>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {ranking.map((r, i) => (
                  <div key={r.nome} className={clsx(
                    'flex items-center gap-3 p-3.5 transition-colors',
                    r.isMe ? 'bg-[var(--neon-dim)]' : 'hover:bg-[var(--bg-card-h)]'
                  )}>
                    <span className="text-base w-8 text-center font-bold">{rankEmoji(i)}</span>
                    <div className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0',
                      r.isMe ? 'gradient-orange text-white shadow-sm shadow-orange-500/20' : 'bg-[var(--bg-chip)] text-[var(--text-2)]'
                    )}>
                      {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-sm font-semibold truncate',
                        r.isMe ? 'text-[var(--neon)]' : 'text-[var(--text-1)]'
                      )}>
                        {r.nome} {r.isMe && <span className="text-xs text-[var(--text-3)]">(você)</span>}
                      </p>
                      <div className="h-1.5 bg-[var(--bg-chip)] rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${(r.checkins / (ranking[0]?.checkins || 1)) * 100}%`,
                            background: r.isMe ? 'var(--neon)' : 'var(--text-3)',
                          }}
                        />
                      </div>
                    </div>
                    <span className={clsx(
                      'text-sm font-black flex-shrink-0',
                      r.isMe ? 'text-[var(--neon)]' : 'text-[var(--text-2)]'
                    )}>{r.checkins}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
