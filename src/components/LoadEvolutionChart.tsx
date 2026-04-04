'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

interface ChartPoint { data: string; carga: number; dataFormatada: string }

interface Props {
  alunoId: string
  exercicioId: string
  cargaSugerida?: number | null
}

// ── Tooltip customizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-orange-400 font-black text-sm">{payload[0].value}kg</p>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function LoadEvolutionChart({ alunoId, exercicioId, cargaSugerida }: Props) {
  const [points, setPoints] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!alunoId || !exercicioId) return

    let cancelled = false
    setLoading(true)

    async function load() {
      // Busca os 3 mais recentes em ordem DESC, depois inverte para exibição cronológica
      const { data } = await supabase
        .from('registro_cargas')
        .select('carga_utilizada, data_registro')
        .eq('aluno_id', alunoId)
        .eq('exercicio_id', exercicioId)
        .order('data_registro', { ascending: false })
        .limit(3)

      if (cancelled) return

      const mapped: ChartPoint[] = (data ?? [])
        .reverse()
        .map(r => ({
          data: r.data_registro,
          carga: r.carga_utilizada,
          dataFormatada: format(parseISO(r.data_registro), 'd/M', { locale: ptBR }),
        }))

      setPoints(mapped)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [alunoId, exercicioId])

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-2 pt-1">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-20 bg-gray-100 dark:bg-gray-700/40 rounded-xl animate-pulse" />
      </div>
    )
  }

  // ── Sem histórico ────────────────────────────────────────────────────────
  if (points.length < 2) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl px-3 py-2.5 mt-1">
        <TrendingUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Finalize pelo menos 2 treinos para ver seu gráfico de evolução 📈
        </p>
      </div>
    )
  }

  // ── Cálculo de tendência ─────────────────────────────────────────────────
  const ultima = points[points.length - 1].carga
  const penultima = points[points.length - 2].carga
  const diff = +(ultima - penultima).toFixed(1)
  const diffAbs = Math.abs(diff)

  const trend = diff > 0
    ? { label: `+${diffAbs}kg`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', Icon: TrendingUp }
    : diff < 0
      ? { label: `-${diffAbs}kg`, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20', Icon: TrendingDown }
      : { label: 'Estável', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', Icon: Minus }

  // Calcular domínio do eixo Y com padding visual
  const values = points.map(p => p.carga)
  if (cargaSugerida) values.push(cargaSugerida)
  const minVal = Math.floor(Math.min(...values) * 0.9)
  const maxVal = Math.ceil(Math.max(...values) * 1.1)

  return (
    <div className="space-y-2 pt-1">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          Evolução de carga
        </span>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${trend.color} ${trend.bg}`}>
          <trend.Icon className="w-3 h-3" />
          {trend.label}
        </span>
      </div>

      {/* Gráfico */}
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="dataFormatada"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              domain={[minVal, maxVal]}
              tickFormatter={v => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linha de referência da carga sugerida */}
            {cargaSugerida != null && cargaSugerida > 0 && (
              <ReferenceLine
                y={cargaSugerida}
                stroke="#6b7280"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
              />
            )}

            <Line
              type="monotone"
              dataKey="carga"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
              activeDot={{ fill: '#f97316', r: 6, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda de rodapé */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[10px] text-gray-400">
          Últimos {points.length} treinos
        </p>
        <p className="text-[10px] text-gray-400">
          Última: <span className="font-bold text-orange-500">{ultima}kg</span>
          {cargaSugerida != null && cargaSugerida > 0 && (
            <span className="text-gray-400"> · Alvo: {cargaSugerida}kg</span>
          )}
        </p>
      </div>
    </div>
  )
}
