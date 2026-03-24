'use client'

import { useState } from 'react'
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, TrendingUp, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const mockHistorico = [
  {
    id: '1',
    data: '2024-01-22',
    treino: 'Treino A - Peito e Tríceps',
    dia_semana: 'A',
    duracao_min: 65,
    status: 'concluido',
    exercicios: [
      { nome: 'Supino Reto', series: 4, repeticoes: '10', carga: 80 },
      { nome: 'Supino Inclinado', series: 3, repeticoes: '12', carga: 30 },
      { nome: 'Crossover', series: 3, repeticoes: '15', carga: 20 },
      { nome: 'Tríceps Pulley', series: 4, repeticoes: '12', carga: 35 },
    ],
  },
  {
    id: '2',
    data: '2024-01-20',
    treino: 'Treino B - Costas e Bíceps',
    dia_semana: 'B',
    duracao_min: 72,
    status: 'concluido',
    exercicios: [
      { nome: 'Puxada Frontal', series: 4, repeticoes: '10', carga: 65 },
      { nome: 'Remada Curvada', series: 3, repeticoes: '10', carga: 60 },
      { nome: 'Rosca Direta', series: 3, repeticoes: '12', carga: 25 },
      { nome: 'Rosca Concentrada', series: 3, repeticoes: '12', carga: 14 },
    ],
  },
  {
    id: '3',
    data: '2024-01-18',
    treino: 'Treino C - Pernas',
    dia_semana: 'C',
    duracao_min: 80,
    status: 'concluido',
    exercicios: [
      { nome: 'Agachamento Livre', series: 4, repeticoes: '8', carga: 100 },
      { nome: 'Leg Press', series: 4, repeticoes: '12', carga: 180 },
      { nome: 'Cadeira Extensora', series: 3, repeticoes: '15', carga: 50 },
      { nome: 'Stiff', series: 3, repeticoes: '12', carga: 60 },
    ],
  },
  {
    id: '4',
    data: '2024-01-16',
    treino: 'Treino A - Peito e Tríceps',
    dia_semana: 'A',
    duracao_min: 58,
    status: 'concluido',
    exercicios: [
      { nome: 'Supino Reto', series: 4, repeticoes: '10', carga: 77.5 },
      { nome: 'Supino Inclinado', series: 3, repeticoes: '12', carga: 28 },
      { nome: 'Crossover', series: 3, repeticoes: '15', carga: 18 },
      { nome: 'Tríceps Pulley', series: 4, repeticoes: '12', carga: 32 },
    ],
  },
  {
    id: '5',
    data: '2024-01-14',
    treino: 'Treino B - Costas e Bíceps',
    dia_semana: 'B',
    duracao_min: 68,
    status: 'concluido',
    exercicios: [
      { nome: 'Puxada Frontal', series: 4, repeticoes: '10', carga: 62.5 },
      { nome: 'Remada Curvada', series: 3, repeticoes: '10', carga: 57.5 },
      { nome: 'Rosca Direta', series: 3, repeticoes: '12', carga: 24 },
    ],
  },
  {
    id: '6',
    data: '2024-01-11',
    treino: 'Treino C - Pernas',
    dia_semana: 'C',
    duracao_min: 75,
    status: 'interrompido',
    exercicios: [
      { nome: 'Agachamento Livre', series: 3, repeticoes: '8', carga: 95 },
      { nome: 'Leg Press', series: 4, repeticoes: '12', carga: 175 },
    ],
  },
]

const diaColors: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  B: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  C: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function HistoricoPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'A' | 'B' | 'C'>('todos')

  const filtered = mockHistorico.filter(h =>
    filtro === 'todos' || h.dia_semana === filtro
  )

  const totalTreinos = mockHistorico.length
  const totalMinutos = mockHistorico.reduce((s, h) => s + h.duracao_min, 0)
  const mediaDuracao = Math.round(totalMinutos / totalTreinos)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Histórico de Treinos</h1>
        <p className="page-subtitle">Todos os seus treinos registrados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Dumbbell className="w-5 h-5 text-primary-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTreinos}</p>
          <p className="text-xs text-gray-400">Treinos</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mediaDuracao}</p>
          <p className="text-xs text-gray-400">Min. médio</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round((mockHistorico.filter(h => h.status === 'concluido').length / totalTreinos) * 100)}%
          </p>
          <p className="text-xs text-gray-400">Concluídos</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['todos', 'A', 'B', 'C'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtro === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {f === 'todos' ? 'Todos' : `Treino ${f}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(h => {
          const isExpanded = expandedId === h.id
          return (
            <div key={h.id} className="card-base overflow-hidden">
              {/* Header */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : h.id)}
              >
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{h.treino}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${diaColors[h.dia_semana] ?? 'badge-gray'}`}>
                      {h.dia_semana}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {format(new Date(h.data), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{h.duracao_min} min
                    </span>
                    <span className={`text-xs font-medium ${h.status === 'concluido' ? 'text-green-500' : 'text-amber-500'}`}>
                      {h.status === 'concluido' ? '✓ Concluído' : '⚠ Interrompido'}
                    </span>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>

              {/* Detalhes */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    Exercícios realizados
                  </p>
                  <div className="space-y-2">
                    {h.exercicios.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{ex.nome}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{ex.series}x{ex.repeticoes}</span>
                          {ex.carga > 0 && (
                            <span className="font-semibold text-primary-600 dark:text-primary-400">{ex.carga}kg</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card-base p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum treino encontrado</p>
        </div>
      )}
    </div>
  )
}
