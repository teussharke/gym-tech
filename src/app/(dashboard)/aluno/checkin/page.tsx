'use client'

import { useState } from 'react'
import { CheckCircle2, MapPin, Clock, Calendar, Trophy, TrendingUp, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const mockCheckins = [
  { id: '1', data: '2024-01-22', hora: '07:32', duracao: 65 },
  { id: '2', data: '2024-01-20', hora: '08:15', duracao: 72 },
  { id: '3', data: '2024-01-18', hora: '07:45', duracao: 58 },
  { id: '4', data: '2024-01-17', hora: '18:20', duracao: 80 },
  { id: '5', data: '2024-01-15', hora: '07:30', duracao: 68 },
  { id: '6', data: '2024-01-13', hora: '09:10', duracao: 55 },
  { id: '7', data: '2024-01-10', hora: '07:25', duracao: 70 },
]

// Frequency heatmap data (last 4 weeks)
const semanas = [
  [false, true, false, true, true, true, false],  // week 1
  [true, false, true, true, false, false, false],  // week 2
  [false, true, true, false, true, true, false],   // week 3
  [true, true, false, true, true, false, false],   // week 4
]

const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function CheckinPage() {
  const [checkinFeito, setCheckinFeito] = useState(false)
  const [loading, setLoading] = useState(false)

  const totalMes = mockCheckins.length
  const metaMes = 20
  const progressoMes = (totalMes / metaMes) * 100
  const sequencia = 3 // dias consecutivos

  const handleCheckin = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setCheckinFeito(true)
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Check-in</h1>
        <p className="page-subtitle">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Check-in card */}
      {!checkinFeito ? (
        <div className="card-base p-6 text-center space-y-4">
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-12 h-12 text-primary-500" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Fazer Check-in</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registre sua presença na academia
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(), 'HH:mm')}</span>
              <span className="text-gray-300">·</span>
              <span>GymFlow Academia</span>
            </div>
          </div>

          <button
            onClick={handleCheckin}
            disabled={loading}
            className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirmar Check-in
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card-base p-6 text-center space-y-4 border-2 border-primary-400 dark:border-primary-500 animate-slide-in">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Check-in feito! 🎉</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {format(new Date(), "HH:mm 'de' dd/MM/yyyy")}
            </p>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-sm font-medium text-primary-700 dark:text-primary-400">
            Bom treino! 💪
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Calendar className="w-5 h-5 text-primary-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalMes}</p>
          <p className="text-xs text-gray-400">Check-ins/mês</p>
        </div>
        <div className="stat-card text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{sequencia}</p>
          <p className="text-xs text-gray-400">Dias seguidos</p>
        </div>
        <div className="stat-card text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">#4</p>
          <p className="text-xs text-gray-400">Ranking</p>
        </div>
      </div>

      {/* Monthly progress */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Meta mensal
          </h3>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {totalMes}/{metaMes} dias
          </span>
        </div>

        <div className="progress-bar h-3">
          <div
            className="progress-fill h-3"
            style={{ width: `${Math.min(progressoMes, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 text-right">
          {Math.round(progressoMes)}% da meta atingida
        </p>
      </div>

      {/* Frequency heatmap */}
      <div className="card-base p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Frequência - Últimas 4 semanas</h3>

        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {diasSemana.map((d, i) => (
              <div key={i} className="text-center text-xs text-gray-400 font-medium">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {semanas.map((semana, si) => (
              <div key={si} className="grid grid-cols-7 gap-1">
                {semana.map((presente, di) => (
                  <div
                    key={di}
                    className={`h-8 rounded-lg transition-colors ${
                      presente
                        ? 'bg-primary-500 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-sm" />
            <span className="text-xs text-gray-400">Faltou</span>
            <div className="w-3 h-3 bg-primary-500 rounded-sm" />
            <span className="text-xs text-gray-400">Presente</span>
          </div>
        </div>
      </div>

      {/* Recent check-ins */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Histórico de Check-ins</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {mockCheckins.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {format(new Date(c.data), "EEEE, d/MM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-400">Check-in às {c.hora}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{c.duracao} min</p>
                <p className="text-xs text-gray-400">duração</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
