'use client'

import { useState } from 'react'
import { Trophy, TrendingUp, Calendar, Zap, Medal, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, getDaysInMonth, startOfMonth, getDay, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Dias em que o aluno foi à academia (mock)
const diasPresente = new Set([
  '2024-01-02', '2024-01-04', '2024-01-06', '2024-01-08', '2024-01-09',
  '2024-01-11', '2024-01-13', '2024-01-15', '2024-01-16', '2024-01-18',
  '2024-01-20', '2024-01-22', '2024-01-23', '2024-01-25', '2024-01-27',
])

const rankingMes = [
  { pos: 1, nome: 'Carlos Silva', checkins: 24, avatar: 'CS' },
  { pos: 2, nome: 'Ana Oliveira', checkins: 22, avatar: 'AO' },
  { pos: 3, nome: 'Pedro Santos', checkins: 21, avatar: 'PS' },
  { pos: 4, nome: 'João Aluno Silva', checkins: 15, avatar: 'JA', isMe: true },
  { pos: 5, nome: 'Maria Costa', checkins: 14, avatar: 'MC' },
  { pos: 6, nome: 'Fernanda Lima', checkins: 13, avatar: 'FL' },
  { pos: 7, nome: 'Roberto Alves', checkins: 12, avatar: 'RA' },
  { pos: 8, nome: 'Juliana Santos', checkins: 11, avatar: 'JS' },
]

const historicoMeses = [
  { mes: 'Jul/23', presencas: 14, meta: 20 },
  { mes: 'Ago/23', presencas: 18, meta: 20 },
  { mes: 'Set/23', presencas: 16, meta: 20 },
  { mes: 'Out/23', presencas: 20, meta: 20 },
  { mes: 'Nov/23', presencas: 17, meta: 20 },
  { mes: 'Dez/23', presencas: 12, meta: 20 },
  { mes: 'Jan/24', presencas: 15, meta: 20 },
]

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function FrequenciaPage() {
  const [mesAtual, setMesAtual] = useState(new Date(2024, 0, 1))

  const totalDias = getDaysInMonth(mesAtual)
  const primeiroDia = getDay(startOfMonth(mesAtual))
  const totalPresencas = diasPresente.size
  const meta = 20
  const percentual = Math.round((totalPresencas / meta) * 100)
  const sequenciaAtual = 3

  const meuRanking = rankingMes.find(r => r.isMe)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minha Frequência</h1>
        <p className="page-subtitle">Acompanhe sua assiduidade na academia</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <Calendar className="w-5 h-5 text-primary-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPresencas}</p>
          <p className="text-xs text-gray-400">Presenças/mês</p>
        </div>
        <div className="stat-card text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sequenciaAtual}</p>
          <p className="text-xs text-gray-400">Sequência atual</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{percentual}%</p>
          <p className="text-xs text-gray-400">Da meta</p>
        </div>
        <div className="stat-card text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{meuRanking?.pos}</p>
          <p className="text-xs text-gray-400">Ranking</p>
        </div>
      </div>

      {/* Meta do mês */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meta do Mês</h3>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {totalPresencas}/{meta} dias
          </span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-fill h-3"
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Faltam {Math.max(meta - totalPresencas, 0)} dias para bater a meta</span>
          <span>{percentual}%</span>
        </div>
      </div>

      {/* Calendário */}
      <div className="card-base p-5 space-y-4">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMesAtual(m => subMonths(m, 1))}
            className="btn-ghost p-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button
            onClick={() => setMesAtual(m => addMonths(m, 1))}
            className="btn-ghost p-1.5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: primeiroDia }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Dias */}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1
            const dataStr = `${format(mesAtual, 'yyyy-MM')}-${String(dia).padStart(2, '0')}`
            const presente = diasPresente.has(dataStr)
            const hoje = format(new Date(), 'yyyy-MM-dd') === dataStr

            return (
              <div
                key={dia}
                className={`
                  h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                  ${presente
                    ? 'bg-primary-500 text-white shadow-sm'
                    : hoje
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500'
                    : 'text-gray-400 dark:text-gray-600'
                  }
                `}
              >
                {dia}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-primary-500 rounded" />
            <span>Presente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            <span>Ausente</span>
          </div>
        </div>
      </div>

      {/* Histórico de meses */}
      <div className="card-base p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Histórico de Frequência</h3>
        <div className="space-y-2">
          {historicoMeses.map(m => (
            <div key={m.mes} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">{m.mes}</span>
              <div className="flex-1 progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(m.presencas / m.meta) * 100}%`,
                    background: m.presencas >= m.meta ? '#22c55e' : m.presencas >= m.meta * 0.7 ? '#f59e0b' : '#ef4444',
                  }}
                />
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
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Ranking do Mês
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {rankingMes.map(r => (
            <div
              key={r.pos}
              className={`flex items-center gap-3 p-3.5 transition-colors ${
                r.isMe
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
            >
              <span className="text-base w-7 text-center flex-shrink-0">
                {r.pos === 1 ? '🥇' : r.pos === 2 ? '🥈' : r.pos === 3 ? '🥉' : `${r.pos}°`}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                r.isMe
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {r.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  r.isMe ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {r.nome} {r.isMe && <span className="text-xs">(você)</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="progress-bar flex-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${(r.checkins / 24) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${
                r.isMe ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {r.checkins}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
