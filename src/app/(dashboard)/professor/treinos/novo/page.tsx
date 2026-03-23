'use client'

import { useState } from 'react'
import { Plus, Grip, X, Clock, Repeat, Weight, ChevronDown, Copy, Save, ArrowLeft, Dumbbell } from 'lucide-react'

const workoutDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'A', 'B', 'C', 'D']

const mockAlunos = [
  { id: '1', nome: 'Carlos Silva', matricula: 'GF2024001' },
  { id: '2', nome: 'Ana Oliveira', matricula: 'GF2024002' },
  { id: '3', nome: 'Pedro Santos', matricula: 'GF2024003' },
]

const mockExercicios = [
  { id: '1', nome: 'Supino Reto com Barra', grupo: 'Peito' },
  { id: '2', nome: 'Supino Inclinado Halteres', grupo: 'Peito' },
  { id: '3', nome: 'Puxada Frontal', grupo: 'Costas' },
  { id: '4', nome: 'Remada Curvada', grupo: 'Costas' },
  { id: '5', nome: 'Agachamento Livre', grupo: 'Pernas' },
  { id: '6', nome: 'Leg Press', grupo: 'Pernas' },
  { id: '7', nome: 'Desenvolvimento', grupo: 'Ombro' },
  { id: '8', nome: 'Elevação Lateral', grupo: 'Ombro' },
  { id: '9', nome: 'Rosca Direta', grupo: 'Bíceps' },
  { id: '10', nome: 'Tríceps Pulley', grupo: 'Tríceps' },
]

interface ExercicioTreino {
  id: string
  exercicio_id: string
  nome: string
  grupo: string
  series: number
  repeticoes: string
  carga: string
  descanso: number
  observacoes: string
}

export default function NovoTreinoPage() {
  const [step, setStep] = useState<'info' | 'exercicios'>('info')
  const [treino, setTreino] = useState({
    nome: '',
    aluno_id: '',
    dia_semana: 'A',
    objetivo: '',
    descricao: '',
  })
  const [exercicios, setExercicios] = useState<ExercicioTreino[]>([])
  const [showExercicioSearch, setShowExercicioSearch] = useState(false)
  const [exercicioSearch, setExercicioSearch] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const addExercicio = (ex: typeof mockExercicios[0]) => {
    const newEx: ExercicioTreino = {
      id: Date.now().toString(),
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo: ex.grupo,
      series: 3,
      repeticoes: '10-12',
      carga: '',
      descanso: 60,
      observacoes: '',
    }
    setExercicios(prev => [...prev, newEx])
    setShowExercicioSearch(false)
    setExercicioSearch('')
  }

  const removeExercicio = (id: string) => {
    setExercicios(prev => prev.filter(e => e.id !== id))
  }

  const updateExercicio = (id: string, field: keyof ExercicioTreino, value: string | number) => {
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const duplicateExercicio = (ex: ExercicioTreino) => {
    const dup = { ...ex, id: Date.now().toString() }
    setExercicios(prev => [...prev, dup])
  }

  const filteredEx = mockExercicios.filter(e =>
    e.nome.toLowerCase().includes(exercicioSearch.toLowerCase()) ||
    e.grupo.toLowerCase().includes(exercicioSearch.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/professor/treinos" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="page-title">Criar Treino</h1>
          <p className="page-subtitle">Monte a ficha de treino do aluno</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {['info', 'exercicios'].map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s as typeof step)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              step === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {i + 1}. {s === 'info' ? 'Informações' : 'Exercícios'}
          </button>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 'info' && (
        <div className="card-base p-5 space-y-4">
          <div>
            <label className="label-base">Aluno *</label>
            <select
              value={treino.aluno_id}
              onChange={e => setTreino(prev => ({ ...prev, aluno_id: e.target.value }))}
              className="input-base"
            >
              <option value="">Selecionar aluno...</option>
              {mockAlunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome} ({a.matricula})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Nome do treino *</label>
            <input
              type="text"
              value={treino.nome}
              onChange={e => setTreino(prev => ({ ...prev, nome: e.target.value }))}
              className="input-base"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div>
            <label className="label-base">Dia / Divisão</label>
            <div className="flex gap-2 flex-wrap">
              {workoutDays.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTreino(prev => ({ ...prev, dia_semana: day }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    treino.dia_semana === day
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-base">Objetivo</label>
            <select
              value={treino.objetivo}
              onChange={e => setTreino(prev => ({ ...prev, objetivo: e.target.value }))}
              className="input-base"
            >
              <option value="">Selecionar...</option>
              <option>Hipertrofia</option>
              <option>Emagrecimento</option>
              <option>Força</option>
              <option>Resistência</option>
              <option>Reabilitação</option>
              <option>Condicionamento</option>
            </select>
          </div>

          <div>
            <label className="label-base">Descrição / Observações</label>
            <textarea
              value={treino.descricao}
              onChange={e => setTreino(prev => ({ ...prev, descricao: e.target.value }))}
              className="input-base resize-none"
              rows={3}
              placeholder="Instruções gerais para este treino..."
            />
          </div>

          <button
            onClick={() => setStep('exercicios')}
            disabled={!treino.nome || !treino.aluno_id}
            className="btn-primary w-full"
          >
            Próximo: Adicionar Exercícios →
          </button>
        </div>
      )}

      {/* Step 2: Exercícios */}
      {step === 'exercicios' && (
        <div className="space-y-4">
          {/* Treino summary */}
          <div className="card-base p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{treino.nome}</p>
              <p className="text-xs text-gray-400">
                {mockAlunos.find(a => a.id === treino.aluno_id)?.nome} · Divisão {treino.dia_semana}
              </p>
            </div>
            <span className="badge-info">{exercicios.length} exerc.</span>
          </div>

          {/* Exercises list */}
          <div className="space-y-3">
            {exercicios.map((ex, index) => (
              <div key={ex.id} className="card-base p-4 space-y-3">
                {/* Exercise header */}
                <div className="flex items-center gap-2">
                  <button className="text-gray-300 hover:text-gray-500 cursor-grab">
                    <Grip className="w-4 h-4" />
                  </button>
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ex.nome}</p>
                    <span className="text-xs text-gray-400">{ex.grupo}</span>
                  </div>
                  <button onClick={() => duplicateExercicio(ex)} className="btn-ghost p-1.5" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeExercicio(ex.id)} className="btn-ghost p-1.5 text-red-500" title="Remover">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> Séries
                    </label>
                    <input
                      type="number"
                      value={ex.series}
                      onChange={e => updateExercicio(ex.id, 'series', Number(e.target.value))}
                      className="input-base text-center"
                      min="1" max="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Repetições</label>
                    <input
                      type="text"
                      value={ex.repeticoes}
                      onChange={e => updateExercicio(ex.id, 'repeticoes', e.target.value)}
                      className="input-base text-center"
                      placeholder="10-12"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Carga (kg)
                    </label>
                    <input
                      type="text"
                      value={ex.carga}
                      onChange={e => updateExercicio(ex.id, 'carga', e.target.value)}
                      className="input-base text-center"
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Descanso (s)
                    </label>
                    <input
                      type="number"
                      value={ex.descanso}
                      onChange={e => updateExercicio(ex.id, 'descanso', Number(e.target.value))}
                      className="input-base text-center"
                      min="0" step="15"
                    />
                  </div>
                </div>

                {/* Observações */}
                <input
                  type="text"
                  value={ex.observacoes}
                  onChange={e => updateExercicio(ex.id, 'observacoes', e.target.value)}
                  className="input-base text-sm"
                  placeholder="Observações (opcional)..."
                />
              </div>
            ))}
          </div>

          {/* Add exercise button */}
          <button
            onClick={() => setShowExercicioSearch(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">Adicionar Exercício</span>
          </button>

          {/* Save */}
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Treino
          </button>
        </div>
      )}

      {/* Exercise search modal */}
      {showExercicioSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Adicionar Exercício</h3>
              <button onClick={() => setShowExercicioSearch(false)} className="btn-ghost p-1.5">✕</button>
            </div>

            <div className="p-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar exercício..."
                  value={exercicioSearch}
                  onChange={e => setExercicioSearch(e.target.value)}
                  className="input-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredEx.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercicio(ex)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ex.nome}</p>
                    <p className="text-xs text-gray-400">{ex.grupo}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary-500 ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
