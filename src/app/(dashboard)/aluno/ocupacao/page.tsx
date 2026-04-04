'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Clock, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

interface Registro { hora: number; dia_semana: number; quantidade: number; created_at: string }

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORAS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const CAPACIDADE_DEFAULT = 50

function label(pct: number) {
  if (pct >= 0.8) return { text: 'Lotado', cls: 'text-red-500', bg: 'bg-red-500' }
  if (pct >= 0.5) return { text: 'Movimentado', cls: 'text-orange-500', bg: 'bg-orange-400' }
  return { text: 'Tranquilo', cls: 'text-green-500', bg: 'bg-green-500' }
}

export default function OcupacaoAlunoPage() {
  const { usuario } = useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [diaVer, setDiaVer] = useState(new Date().getDay())

  const now = new Date()
  const horaAtual = now.getHours()
  const diaAtual = now.getDay()

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) { setLoading(false); return }
    setLoading(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - 14)

      const { data } = await supabase
        .from('ocupacao_academia')
        .select('hora, dia_semana, quantidade, created_at')
        .eq('academia_id', usuario.academia_id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      setRegistros((data ?? []) as Registro[])
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  // Último registro (agora)
  const ultimoReg = registros[0]
  const ocupacaoAgora = ultimoReg?.quantidade ?? null
  const pctAgora = ocupacaoAgora !== null ? ocupacaoAgora / CAPACIDADE_DEFAULT : null

  // Média por hora para o dia selecionado
  const mediaHora = (dia: number, hora: number) => {
    const rs = registros.filter(r => r.dia_semana === dia && r.hora === hora)
    if (!rs.length) return null
    return Math.round(rs.reduce((s, r) => s + r.quantidade, 0) / rs.length)
  }

  // Melhor hora (menor média) no dia selecionado
  const mediasHoje = HORAS.map(h => ({ h, med: mediaHora(diaVer, h) })).filter(x => x.med !== null)
  const melhorHora = mediasHoje.length > 0
    ? mediasHoje.reduce((a, b) => (a.med ?? 999) < (b.med ?? 999) ? a : b)
    : null

  return (
    <div className="max-w-lg mx-auto space-y-6 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Ocupação da Academia</h1>
          <p className="text-gray-500 text-sm mt-1">Escolha o melhor horário para treinar</p>
        </div>
        <button onClick={fetchDados} className="btn-ghost p-2 rounded-xl">
          <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Status agora */}
      {pctAgora !== null ? (
        <div className={clsx('card-base p-5 text-center border-2 space-y-2',
          pctAgora >= 0.8 ? 'border-red-300 dark:border-red-700'
            : pctAgora >= 0.5 ? 'border-orange-300 dark:border-orange-700'
              : 'border-green-300 dark:border-green-700'
        )}>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Agora · {String(ultimoReg.hora).padStart(2, '0')}h</span>
          </div>
          <p className={clsx('text-5xl font-black', label(pctAgora).cls)}>{ocupacaoAgora}</p>
          <p className="text-gray-500 text-sm">pessoas na academia</p>
          <span className={clsx('inline-block text-sm font-bold px-3 py-1 rounded-full text-white', label(pctAgora).bg)}>
            {label(pctAgora).text} · {Math.round(pctAgora * 100)}% da capacidade
          </span>
        </div>
      ) : (
        <div className="card-base p-5 text-center text-gray-400 text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhum dado disponível ainda. A academia registrará a ocupação em breve.
        </div>
      )}

      {/* Seletor de dia */}
      <div className="card-base p-4 space-y-3">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Ver por dia da semana</h2>
        <div className="flex gap-1.5 flex-wrap">
          {DIAS_SHORT.map((d, i) => (
            <button key={i} onClick={() => setDiaVer(i)}
              className={clsx(
                'flex-1 min-w-[36px] py-2 rounded-xl text-xs font-bold transition-all',
                diaVer === i
                  ? 'gradient-orange text-white shadow-sm shadow-orange-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}>
              {d}
            </button>
          ))}
        </div>

        {melhorHora && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
              🎯 Melhor horário em {DIAS[diaVer]}
            </p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">
              {String(melhorHora.h).padStart(2, '0')}h
            </p>
            <p className="text-xs text-gray-400">média de {melhorHora.med} pessoas</p>
          </div>
        )}

        {/* Gráfico barras por hora */}
        <div className="space-y-1.5 pt-1">
          {HORAS.map(h => {
            const med = mediaHora(diaVer, h)
            const pct = med !== null ? Math.min(med / CAPACIDADE_DEFAULT, 1) : 0
            const info = label(pct)
            const isNow = h === horaAtual && diaVer === diaAtual
            return (
              <div key={h} className={clsx('flex items-center gap-3 rounded-lg px-2 py-1',
                isNow && 'bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-300 dark:ring-orange-700'
              )}>
                <span className={clsx(
                  'text-xs font-mono w-6 text-right font-bold',
                  isNow ? 'text-orange-500' : 'text-gray-400'
                )}>
                  {String(h).padStart(2, '0')}h
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  {med !== null && (
                    <div className={clsx('h-4 rounded-full transition-all', info.bg)}
                      style={{ width: `${Math.max(pct * 100, 2)}%` }} />
                  )}
                </div>
                <div className="w-20 text-right">
                  {med !== null ? (
                    <span className={clsx('text-xs font-bold', info.cls)}>
                      {info.text}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">sem dados</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 text-center">Baseado nos últimos 14 dias</p>
      </div>
    </div>
  )
}
