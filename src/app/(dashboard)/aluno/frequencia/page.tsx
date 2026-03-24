'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, Calendar, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, getDaysInMonth, startOfMonth, getDay, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

interface RankingItem {
  aluno_id: string
  nome: string
  dias_presentes: number
}

export default function FrequenciaPage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [mesAtual, setMesAtual] = useState(new Date())
  const [diasPresente, setDiasPresente] = useState<Set<string>>(new Set())
  const [historicoMeses, setHistoricoMeses] = useState<{ mes: string; presencas: number; meta: number }[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const meta = 20

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchPresencas = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)

    const inicio = startOfMonth(mesAtual).toISOString()
    const fim = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('presencas')
      .select('data_checkin')
      .eq('aluno_id', alunoId)
      .gte('data_checkin', inicio)
      .lte('data_checkin', fim)

    const dias = new Set((data ?? []).map(p => p.data_checkin.split('T')[0]))
    setDiasPresente(dias)
    setLoading(false)
  }, [alunoId, mesAtual])

  const fetchHistorico = useCallback(async () => {
    if (!alunoId) return
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const inicio = startOfMonth(d).toISOString()
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const { data } = await supabase
        .from('presencas')
        .select('data_checkin')
        .eq('aluno_id', alunoId)
        .gte('data_checkin', inicio)
        .lte('data_checkin', fim)
      const presencas = new Set((data ?? []).map(p => p.data_checkin.split('T')[0])).size
      meses.push({ mes: format(d, 'MMM/yy', { locale: ptBR }), presencas, meta })
    }
    setHistoricoMeses(meses)
  }, [alunoId])

  const fetchRanking = useCallback(async () => {
    if (!usuario?.academia_id) return
    const inicio = startOfMonth(new Date()).toISOString()
    const fim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('presencas')
      .select('aluno_id, aluno:alunos(usuario:usuarios!alunos_usuario_id_fkey(nome))')
      .eq('academia_id', usuario.academia_id)
      .gte('data_checkin', inicio)
      .lte('data_checkin', fim)

    if (!data) return

    const contagem: Record<string, { nome: string; count: number }> = {}
    data.forEach((p: any) => {
      const nome = p.aluno?.usuario?.nome ?? 'Desconhecido'
      if (!contagem[p.aluno_id]) contagem[p.aluno_id] = { nome, count: 0 }
      contagem[p.aluno_id].count++
    })

    const r = Object.entries(contagem)
      .map(([id, v]) => ({ aluno_id: id, nome: v.nome, dias_presentes: v.count }))
      .sort((a, b) => b.dias_presentes - a.dias_presentes)
      .slice(0, 8)

    setRanking(r)
  }, [usuario?.academia_id])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { if (alunoId) { fetchPresencas(); fetchHistorico(); fetchRanking() } }, [alunoId, fetchPresencas, fetchHistorico, fetchRanking])

  const totalPresencas = diasPresente.size
  const percentual = Math.round((totalPresencas / meta) * 100)
  const meuRanking = ranking.findIndex(r => r.aluno_id === alunoId) + 1

  const totalDias = getDaysInMonth(mesAtual)
  const primeiroDia = getDay(startOfMonth(mesAtual))
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minha Frequência</h1>
        <p className="page-subtitle">Acompanhe sua assiduidade</p>
      </div>

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
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {meuRanking > 0 ? `#${meuRanking}` : '—'}
          </p>
          <p className="text-xs text-gray-400">Ranking</p>
        </div>
      </div>

      {/* Meta */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meta do Mês</h3>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{totalPresencas}/{meta} dias</span>
        </div>
        <div className="progress-bar h-3">
          <div className="progress-fill h-3" style={{ width: `${Math.min(percentual, 100)}%` }} />
        </div>
        <p className="text-xs text-gray-400 text-right">Faltam {Math.max(meta - totalPresencas, 0)} dias para a meta</p>
      </div>

      {/* Calendário */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="btn-ghost p-1.5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="btn-ghost p-1.5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
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
                )}>
                  {dia}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary-500 rounded" /><span>Presente</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" /><span>Ausente</span></div>
        </div>
      </div>

      {/* Histórico de meses */}
      <div className="card-base p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Últimos 6 meses</h3>
        <div className="space-y-2">
          {historicoMeses.map(m => (
            <div key={m.mes} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-14 flex-shrink-0 capitalize">{m.mes}</span>
              <div className="flex-1 progress-bar">
                <div className="progress-fill" style={{
                  width: `${Math.min((m.presencas / m.meta) * 100, 100)}%`,
                  background: m.presencas >= m.meta ? '#22c55e' : m.presencas >= m.meta * 0.7 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right flex-shrink-0">
                {m.presencas}/{m.meta}
              </span>
              {m.presencas >= m.meta && <span className="text-xs">🏆</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      {ranking.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Ranking do Mês
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {ranking.map((r, i) => {
              const isMe = r.aluno_id === alunoId
              return (
                <div key={r.aluno_id} className={clsx('flex items-center gap-3 p-3.5', isMe && 'bg-primary-50 dark:bg-primary-900/20')}>
                  <span className="text-base w-7 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                  </span>
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isMe ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}>
                    {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-medium truncate', isMe ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200')}>
                      {r.nome} {isMe && <span className="text-xs">(você)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="progress-bar flex-1">
                        <div className="progress-fill" style={{ width: `${(r.dias_presentes / meta) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className={clsx('text-sm font-bold flex-shrink-0', isMe ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400')}>
                    {r.dias_presentes}x
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
