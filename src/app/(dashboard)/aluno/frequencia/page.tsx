'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const meta = 20

  const fetchTudo = useCallback(async () => {
    if (!usuario?.id || !usuario?.academia_id) return
    setLoading(true)

    try {
      // Buscar aluno_id
      const { data: alunoData } = await supabase
        .from('alunos')
        .select('id')
        .eq('usuario_id', usuario.id)
        .single()

      if (!alunoData) { setLoading(false); return }
      const alunoId = alunoData.id

      // Data de 6 meses atrás
      const inicio6Meses = startOfMonth(subMonths(new Date(), 5)).toISOString()

      // Uma única query para todas as presenças dos últimos 6 meses
      const { data: todasPresencas } = await supabase
        .from('presencas')
        .select('aluno_id, data_checkin')
        .eq('academia_id', usuario.academia_id)
        .gte('data_checkin', inicio6Meses)

      if (!todasPresencas) { setLoading(false); return }

      // Filtrar minhas presenças
      const minhasPresencas = todasPresencas.filter(p => p.aluno_id === alunoId)

      // Dias do mês atual
      const mesStr = format(mesAtual, 'yyyy-MM')
      const diasDoMes = new Set(
        minhasPresencas
          .filter(p => p.data_checkin.startsWith(mesStr))
          .map(p => p.data_checkin.split('T')[0])
      )
      setDiasPresente(diasDoMes)

      // Histórico dos últimos 6 meses
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

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minha Frequência</h1>
        <p className="page-subtitle">Acompanhe sua assiduidade</p>
      </div>

      {loading ? (
        <div className="card-base p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando frequência...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card text-center">
              <Calendar className="w-5 h-5 text-primary-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPresencas}</p>
              <p className="text-xs text-gray-400">Presenças/mês</p>
            </div>
            <div className="stat-card text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{percentual}%</p>
              <p className="text-xs text-gray-400">Da meta</p>
            </div>
            <div className="stat-card text-center">
              <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{meuRanking > 0 ? `#${meuRanking}` : '—'}</p>
              <p className="text-xs text-gray-400">Ranking</p>
            </div>
          </div>

          {/* Meta */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meta do Mês</h3>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{totalPresencas}/{meta} dias</span>
            </div>
            <div className="progress-bar h-3"><div className="progress-fill h-3" style={{ width: `${Math.min(percentual, 100)}%` }} /></div>
            <p className="text-xs text-gray-400 text-right">Faltam {Math.max(meta - totalPresencas, 0)} dias</p>
          </div>

          {/* Calendário */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="btn-ghost p-1.5"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {diasSemana.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
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
                    'h-9 rounded-lg flex items-center justify-center text-sm font-medium',
                    presente ? 'bg-primary-500 text-white shadow-sm' :
                    hoje ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 ring-2 ring-primary-500' :
                    'text-gray-400 dark:text-gray-600'
                  )}>{dia}</div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary-500 rounded" /><span>Presente</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" /><span>Ausente</span></div>
            </div>
          </div>

          {/* Histórico */}
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Últimos 6 meses</h3>
            {historicoMeses.map(m => (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 flex-shrink-0 capitalize">{m.mes}</span>
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min((m.presencas / meta) * 100, 100)}%`,
                    background: m.presencas >= meta ? '#22c55e' : m.presencas >= meta * 0.7 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right">{m.presencas}/{meta}</span>
                {m.presencas >= meta && <span className="text-xs">🏆</span>}
              </div>
            ))}
          </div>

          {/* Ranking */}
          {ranking.length > 0 && (
            <div className="card-base overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />Ranking do Mês
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {ranking.map((r, i) => (
                  <div key={r.nome} className={clsx('flex items-center gap-3 p-3.5', r.isMe && 'bg-primary-50 dark:bg-primary-900/20')}>
                    <span className="text-base w-7 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}°`}</span>
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', r.isMe ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600')}>
                      {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm font-medium truncate', r.isMe ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200')}>
                        {r.nome} {r.isMe && <span className="text-xs">(você)</span>}
                      </p>
                      <div className="progress-bar mt-0.5">
                        <div className="progress-fill" style={{ width: `${(r.checkins / (ranking[0]?.checkins || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <span className={clsx('text-sm font-bold flex-shrink-0', r.isMe ? 'text-primary-600' : 'text-gray-500')}>{r.checkins}x</span>
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
