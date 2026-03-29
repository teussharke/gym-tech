'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Clock, TrendingUp, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface Registro { id: string; hora: number; dia_semana: number; quantidade: number; created_at: string }

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORAS_FUNCIONAMENTO = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

function barColor(pct: number) {
  if (pct >= 0.8) return 'bg-red-500'
  if (pct >= 0.5) return 'bg-orange-400'
  return 'bg-green-500'
}

function textColor(pct: number) {
  if (pct >= 0.8) return 'text-red-500'
  if (pct >= 0.5) return 'text-orange-500'
  return 'text-green-500'
}

export default function OcupacaoPage() {
  const { usuario } = useAuth()
  const [hoje, setHoje] = useState<Registro[]>([])
  const [semana, setSemana] = useState<Registro[]>([])
  const [quantidade, setQuantidade] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [capacidade, setCapacidade] = useState(50)

  const now = new Date()
  const horaAtual = now.getHours()
  const diaAtual = now.getDay()

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - 7)

      const { data } = await supabase
        .from('ocupacao_academia')
        .select('id, hora, dia_semana, quantidade, created_at')
        .eq('academia_id', usuario.academia_id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      const registros = (data ?? []) as Registro[]

      // Hoje: registros do dia atual
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      setHoje(registros.filter(r => new Date(r.created_at) >= todayStart))
      setSemana(registros)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const registrar = async () => {
    if (!usuario?.academia_id || !usuario?.id) return
    const qty = Number(quantidade)
    if (isNaN(qty) || qty < 0) { toast.error('Quantidade inválida'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('ocupacao_academia').insert({
        academia_id: usuario.academia_id,
        hora: horaAtual,
        dia_semana: diaAtual,
        quantidade: qty,
        registrado_por: usuario.id,
      })
      if (error) throw error
      toast.success('Ocupação registrada!')
      setQuantidade('')
      fetchDados()
    } catch { toast.error('Erro ao registrar') }
    finally { setSaving(false) }
  }

  // Média por hora da semana
  const mediaHora = (hora: number) => {
    const registros = semana.filter(r => r.hora === hora)
    if (!registros.length) return null
    return Math.round(registros.reduce((s, r) => s + r.quantidade, 0) / registros.length)
  }

  // Último registro de hoje
  const ultimoHoje = hoje[0]
  const ocupacaoAtual = ultimoHoje?.quantidade ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Ocupação em Tempo Real</h1>
          <p className="text-gray-500 text-sm mt-1">Registre a lotação atual para os alunos verem</p>
        </div>
        <button onClick={fetchDados} className="btn-ghost p-2 rounded-xl flex-shrink-0" title="Atualizar">
          <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Registro atual */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Registrar agora</h2>
          <span className="text-xs text-gray-400 ml-auto">{DIAS[diaAtual]} · {String(horaAtual).padStart(2, '0')}h</span>
        </div>

        {ocupacaoAtual !== null && (
          <div className={clsx('rounded-xl p-3 text-center border',
            ocupacaoAtual / capacidade >= 0.8
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : ocupacaoAtual / capacidade >= 0.5
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          )}>
            <p className="text-xs text-gray-500 mb-1">Último registro de hoje</p>
            <p className={clsx('text-4xl font-black', textColor(ocupacaoAtual / capacidade))}>
              {ocupacaoAtual}
            </p>
            <p className="text-sm text-gray-500">pessoas · {Math.round(ocupacaoAtual / capacidade * 100)}% da capacidade</p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Pessoas na academia agora</label>
            <input
              type="number" min="0" inputMode="numeric"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registrar()}
              placeholder="Ex: 23"
              className="input-base w-full text-lg font-bold"
            />
          </div>
          <div className="flex-shrink-0">
            <label className="text-xs text-gray-500 mb-1 block">Capacidade máx.</label>
            <input
              type="number" min="1" inputMode="numeric"
              value={capacidade}
              onChange={e => setCapacidade(Number(e.target.value))}
              className="input-base w-24 text-center"
            />
          </div>
        </div>

        <button onClick={registrar} disabled={saving || !quantidade}
          className="btn-primary w-full py-3 font-bold flex items-center justify-center gap-2">
          <Users className="w-4 h-4" />
          {saving ? 'Registrando...' : 'Registrar ocupação'}
        </button>
      </div>

      {/* Gráfico de barras por hora (hoje) */}
      {hoje.length > 0 && (
        <div className="card-base p-5 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Hoje — histórico por hora
          </h2>
          <div className="space-y-2">
            {[...hoje].reverse().map(r => {
              const pct = Math.min(r.quantidade / capacidade, 1)
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 w-6 text-right">{String(r.hora).padStart(2, '0')}h</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                    <div className={clsx('h-5 rounded-full transition-all', barColor(pct))}
                      style={{ width: `${Math.max(pct * 100, 2)}%` }} />
                  </div>
                  <span className={clsx('text-xs font-black w-10 text-right', textColor(pct))}>
                    {r.quantidade}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gráfico de média por hora da semana */}
      <div className="card-base p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart2Icon />
          Média por hora (últimos 7 dias)
        </h2>
        <div className="space-y-1.5">
          {HORAS_FUNCIONAMENTO.map(h => {
            const med = mediaHora(h)
            const pct = med !== null ? Math.min(med / capacidade, 1) : 0
            return (
              <div key={h} className="flex items-center gap-3">
                <span className={clsx(
                  'text-xs font-mono w-6 text-right',
                  h === horaAtual ? 'text-orange-500 font-bold' : 'text-gray-500'
                )}>
                  {String(h).padStart(2, '0')}h
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  {med !== null && (
                    <div className={clsx('h-4 rounded-full transition-all', barColor(pct))}
                      style={{ width: `${Math.max(pct * 100, 2)}%` }} />
                  )}
                </div>
                <span className={clsx('text-xs font-bold w-12 text-right', med !== null ? textColor(pct) : 'text-gray-300')}>
                  {med !== null ? `~${med}` : '—'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 text-center">
          Verde = até 50% · Laranja = até 80% · Vermelho = acima de 80%
        </p>
      </div>
    </div>
  )
}

// Ícone inline para evitar import adicional
function BarChart2Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
