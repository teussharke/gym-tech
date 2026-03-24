'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grip, X, Clock, Repeat, Weight, Copy, Save, ArrowLeft, Dumbbell } from 'lucide-react'

const workoutDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'A', 'B', 'C', 'D']

const mockAlunos = [
  { id: '1', nome: 'Carlos Silva', matricula: 'GF2024001' },
  { id: '2', nome: 'Ana Oliveira', matricula: 'GF2024002' },
  { id: '3', nome: 'Pedro Santos', matricula: 'GF2024003' },
  { id: '4', nome: 'Maria Costa', matricula: 'GF2024004' },
  { id: '5', nome: 'João Ferreira', matricula: 'GF2024005' },
]

const mockExercicios = [
  { id: '1', nome: 'Supino Reto com Barra', grupo: 'Peito' },
  { id: '2', nome: 'Supino Inclinado Halteres', grupo: 'Peito' },
  { id: '3', nome: 'Crucifixo', grupo: 'Peito' },
  { id: '4', nome: 'Crossover Polia', grupo: 'Peito' },
  { id: '5', nome: 'Puxada Frontal', grupo: 'Costas' },
  { id: '6', nome: 'Remada Curvada', grupo: 'Costas' },
  { id: '7', nome: 'Remada Unilateral', grupo: 'Costas' },
  { id: '8', nome: 'Agachamento Livre', grupo: 'Pernas' },
  { id: '9', nome: 'Leg Press 45°', grupo: 'Pernas' },
  { id: '10', nome: 'Cadeira Extensora', grupo: 'Pernas' },
  { id: '11', nome: 'Stiff', grupo: 'Pernas' },
  { id: '12', nome: 'Desenvolvimento', grupo: 'Ombro' },
  { id: '13', nome: 'Elevação Lateral', grupo: 'Ombro' },
  { id: '14', nome: 'Rosca Direta', grupo: 'Bíceps' },
  { id: '15', nome: 'Rosca Concentrada', grupo: 'Bíceps' },
  { id: '16', nome: 'Tríceps Pulley', grupo: 'Tríceps' },
  { id: '17', nome: 'Tríceps Francês', grupo: 'Tríceps' },
  { id: '18', nome: 'Abdominal Crunch', grupo: 'Abdômen' },
  { id: '19', nome: 'Prancha', grupo: 'Abdômen' },
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

type Step = 'info' | 'exercicios'

export default function NovoTreinoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [treino, setTreino] = useState({
    nome: '', aluno_id: '', dia_semana: 'A', objetivo: '', descricao: '',
  })
  const [exercicios, setExercicios] = useState<ExercicioTreino[]>([])
  const [showBusca, setShowBusca] = useState(false)
  const [busca, setBusca] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addExercicio = (ex: typeof mockExercicios[0]) => {
    setExercicios(prev => [...prev, {
      id: Date.now().toString(),
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo: ex.grupo,
      series: 3,
      repeticoes: '10-12',
      carga: '',
      descanso: 60,
      observacoes: '',
    }])
    setShowBusca(false)
    setBusca('')
  }

  const removeExercicio = (id: string) => setExercicios(prev => prev.filter(e => e.id !== id))

  const updateExercicio = (id: string, field: keyof ExercicioTreino, value: string | number) => {
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const duplicar = (ex: ExercicioTreino) => {
    setExercicios(prev => [...prev, { ...ex, id: Date.now().toString() }])
  }

  const salvar = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsLoading(false)
    router.push('/professor/treinos')
  }

  const filtrados = mockExercicios.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.grupo.toLowerCase().includes(busca.toLowerCase())
  )

  const grupoColors: Record<string, string> = {
    'Peito': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Costas': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Pernas': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Ombro': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Bíceps': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Tríceps': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Abdômen': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Criar Treino</h1>
          <p className="page-subtitle">Monte a ficha de treino do aluno</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(['info', 'exercicios'] as Step[]).map((s, i) => (
          <button
            key={s}
            onClick={() => step === 'exercicios' && s === 'info' && setStep('info')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              step === s
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {i + 1}. {s === 'info' ? 'Informações' : 'Exercícios'}
          </button>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 'info' && (
        <div className="card-base p-5 space-y-4">
          <div>
            <label className="label-base">Aluno *</label>
            <select
              value={treino.aluno_id}
              onChange={e => setTreino(p => ({ ...p, aluno_id: e.target.value }))}
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
              onChange={e => setTreino(p => ({ ...p, nome: e.target.value }))}
              className="input-base"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div>
            <label className="label-base">Dia / Divisão</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {workoutDays.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setTreino(p => ({ ...p, dia_semana: day }))}
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
              onChange={e => setTreino(p => ({ ...p, objetivo: e.target.value }))}
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
            <label className="label-base">Descrição / Observações gerais</label>
            <textarea
              value={treino.descricao}
              onChange={e => setTreino(p => ({ ...p, descricao: e.target.value }))}
              className="input-base resize-none"
              rows={3}
              placeholder="Instruções gerais, avisos, observações..."
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

      {/* STEP 2 */}
      {step === 'exercicios' && (
        <div className="space-y-4">
          {/* Resumo */}
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

          {/* Lista de exercícios */}
          <div className="space-y-3">
            {exercicios.map((ex, index) => (
              <div key={ex.id} className="card-base p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ex.nome}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[ex.grupo] ?? 'badge-gray'}`}>
                      {ex.grupo}
                    </span>
                  </div>
                  <button onClick={() => duplicar(ex)} className="btn-ghost p-1.5" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeExercicio(ex.id)} className="btn-ghost p-1.5 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> Séries
                    </label>
                    <input type="number" value={ex.series} onChange={e => updateExercicio(ex.id, 'series', Number(e.target.value))} className="input-base text-center" min="1" max="10" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Repetições</label>
                    <input type="text" value={ex.repeticoes} onChange={e => updateExercicio(ex.id, 'repeticoes', e.target.value)} className="input-base text-center" placeholder="10-12" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Carga (kg)
                    </label>
                    <input type="text" value={ex.carga} onChange={e => updateExercicio(ex.id, 'carga', e.target.value)} className="input-base text-center" placeholder="—" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Descanso (s)
                    </label>
                    <input type="number" value={ex.descanso} onChange={e => updateExercicio(ex.id, 'descanso', Number(e.target.value))} className="input-base text-center" min="0" step="15" />
                  </div>
                </div>

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

          {/* Botão adicionar */}
          <button
            onClick={() => setShowBusca(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">Adicionar Exercício</span>
          </button>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-secondary flex-1">← Voltar</button>
            <button
              onClick={salvar}
              disabled={isLoading || exercicios.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
                : <><Save className="w-4 h-4" /> Salvar Treino</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Modal busca de exercício */}
      {showBusca && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Adicionar Exercício</h3>
              <button onClick={() => setShowBusca(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-3">
              <input
                type="text"
                placeholder="Buscar exercício ou grupo muscular..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="input-base"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filtrados.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercicio(ex)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ex.nome}</p>
                    <p className="text-xs text-gray-400">{ex.grupo}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary-500 flex-shrink-0" />
                </button>
              ))}
              {filtrados.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhum exercício encontrado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
