'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, MapPin, Clock, Calendar, Trophy, TrendingUp, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, startOfMonth, endOfMonth, getDaysInMonth, startOfDay, getDay, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Presenca {
  id: string
  data_checkin: string
}

export default function CheckinPage() {
  const { usuario } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(false)
  const [loading, setLoading] = useState(false)
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [mesAtual, setMesAtual] = useState(new Date())
  const [alunoId, setAlunoId] = useState<string | null>(null)

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchPresencas = useCallback(async () => {
    if (!alunoId) return
    const inicio = startOfMonth(mesAtual).toISOString()
    const fim = endOfMonth(mesAtual).toISOString()
    const { data } = await supabase
      .from('presencas')
      .select('id, data_checkin')
      .eq('aluno_id', alunoId)
      .gte('data_checkin', inicio)
      .lte('data_checkin', fim)
    setPresencas(data ?? [])

    // Verificar se já fez check-in hoje
    const hoje = new Date().toISOString().split('T')[0]
    setCheckinHoje(data?.some(p => p.data_checkin.startsWith(hoje)) ?? false)
  }, [alunoId, mesAtual])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { fetchPresencas() }, [fetchPresencas])

  const handleCheckin = async () => {
    if (!alunoId || !usuario?.academia_id) { toast.error('Dados incompletos'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: alunoId, academia_id: usuario.academia_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCheckinHoje(true)
      toast.success('Check-in realizado! 💪')
      fetchPresencas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer check-in')
    } finally {
      setLoading(false)
    }
  }

  const totalPresencas = presencas.length
  const meta = 20
  const percentual = Math.round((totalPresencas / meta) * 100)

  // Calendário
  const totalDias = getDaysInMonth(mesAtual)
  const primeiroDia = getDay(startOfMonth(mesAtual))
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diasPresente = new Set(presencas.map(p => p.data_checkin.split('T')[0]))

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Check-in</h1>
        <p className="page-subtitle">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      {/* Botão check-in */}
      {!checkinHoje ? (
        <div className="card-base p-6 text-center space-y-4">
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-12 h-12 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Fazer Check-in</h2>
            <p className="text-sm text-gray-500 mt-1">Registre sua presença na academia</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(), 'HH:mm')}</span>
          </div>
          <button onClick={handleCheckin} disabled={loading || !alunoId} className="btn-primary w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2">
            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Registrando...</> : <><CheckCircle2 className="w-5 h-5" />Confirmar Check-in</>}
          </button>
          {!alunoId && <p className="text-xs text-amber-500">Seu perfil de aluno não foi encontrado.</p>}
        </div>
      ) : (
        <div className="card-base p-6 text-center space-y-4 border-2 border-primary-400 dark:border-primary-500 animate-slide-in">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Check-in feito! 🎉</h2>
            <p className="text-sm text-gray-500 mt-1">{format(new Date(), "HH:mm 'de' dd/MM/yyyy")}</p>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-sm font-medium text-primary-700 dark:text-primary-400">Bom treino! 💪</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Calendar className="w-5 h-5 text-primary-500 mx-auto" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalPresencas}</p>
          <p className="text-xs text-gray-400">Check-ins/mês</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{percentual}%</p>
          <p className="text-xs text-gray-400">Da meta</p>
        </div>
        <div className="stat-card text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{meta}</p>
          <p className="text-xs text-gray-400">Meta</p>
        </div>
      </div>

      {/* Meta progress */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meta do Mês</h3>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{totalPresencas}/{meta} dias</span>
        </div>
        <div className="progress-bar h-3"><div className="progress-fill h-3" style={{ width: `${Math.min(percentual, 100)}%` }} /></div>
        <p className="text-xs text-gray-400 text-right">Faltam {Math.max(meta - totalPresencas, 0)} dias para bater a meta</p>
      </div>

      {/* Calendário */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="btn-ghost p-1.5">‹</button>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="btn-ghost p-1.5">›</button>
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
              )}>
                {dia}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary-500 rounded" /><span>Presente</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" /><span>Ausente</span></div>
        </div>
      </div>
    </div>
  )
}
