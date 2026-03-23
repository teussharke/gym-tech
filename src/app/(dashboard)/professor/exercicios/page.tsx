'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Play, Dumbbell, ChevronDown } from 'lucide-react'

const muscleGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombro', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Glúteos']
const levels = ['Todos', 'Iniciante', 'Intermediário', 'Avançado']

const mockExercicios = [
  { id: '1', nome: 'Supino Reto com Barra', grupo: 'Peito', nivel: 'Intermediário', equipamento: 'Barra', has_gif: false, has_video: false },
  { id: '2', nome: 'Puxada Frontal', grupo: 'Costas', nivel: 'Iniciante', equipamento: 'Polia', has_gif: false, has_video: false },
  { id: '3', nome: 'Agachamento Livre', grupo: 'Pernas', nivel: 'Intermediário', equipamento: 'Barra', has_gif: false, has_video: false },
  { id: '4', nome: 'Desenvolvimento com Halteres', grupo: 'Ombro', nivel: 'Intermediário', equipamento: 'Halteres', has_gif: false, has_video: false },
  { id: '5', nome: 'Rosca Direta', grupo: 'Bíceps', nivel: 'Iniciante', equipamento: 'Barra/Halteres', has_gif: false, has_video: false },
  { id: '6', nome: 'Tríceps Pulley', grupo: 'Tríceps', nivel: 'Iniciante', equipamento: 'Polia', has_gif: false, has_video: false },
  { id: '7', nome: 'Abdominal Crunch', grupo: 'Abdômen', nivel: 'Iniciante', equipamento: 'Solo', has_gif: false, has_video: false },
  { id: '8', nome: 'Leg Press 45°', grupo: 'Pernas', nivel: 'Iniciante', equipamento: 'Máquina', has_gif: false, has_video: false },
  { id: '9', nome: 'Remada Curvada', grupo: 'Costas', nivel: 'Intermediário', equipamento: 'Barra', has_gif: false, has_video: false },
  { id: '10', nome: 'Elevação Lateral', grupo: 'Ombro', nivel: 'Iniciante', equipamento: 'Halteres', has_gif: false, has_video: false },
  { id: '11', nome: 'Stiff', grupo: 'Pernas', nivel: 'Intermediário', equipamento: 'Barra', has_gif: false, has_video: false },
  { id: '12', nome: 'Crucifixo', grupo: 'Peito', nivel: 'Iniciante', equipamento: 'Halteres', has_gif: false, has_video: false },
]

const grupoColors: Record<string, string> = {
  'Peito': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Costas': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pernas': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Ombro': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Bíceps': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Tríceps': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Abdômen': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Cardio': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Glúteos': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const nivelConfig: Record<string, string> = {
  'Iniciante': 'badge-success',
  'Intermediário': 'badge-warning',
  'Avançado': 'badge-danger',
}

export default function ExerciciosPage() {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [selectedLevel, setSelectedLevel] = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = mockExercicios.filter(e => {
    const matchSearch = e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.equipamento.toLowerCase().includes(search.toLowerCase())
    const matchGroup = selectedGroup === 'Todos' || e.grupo === selectedGroup
    const matchLevel = selectedLevel === 'Todos' || e.nivel === selectedLevel
    return matchSearch && matchGroup && matchLevel
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Exercícios</h1>
          <p className="page-subtitle">{mockExercicios.length} exercícios na biblioteca</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Exercício</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card-base p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar exercício ou equipamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>

        {/* Muscle groups */}
        <div className="flex gap-2 flex-wrap">
          {muscleGroups.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedGroup === g
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Levels */}
        <div className="flex gap-2">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setSelectedLevel(l)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedLevel === l
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} exercício{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(exercicio => (
          <div key={exercicio.id} className="card-hover overflow-hidden group">
            {/* GIF/Image area */}
            <div className="bg-gray-100 dark:bg-gray-700 h-36 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto" />
                <p className="text-xs text-gray-400 mt-1">Sem demonstração</p>
              </div>
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button className="bg-red-500/80 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {exercicio.nome}
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grupoColors[exercicio.grupo] ?? 'badge-gray'}`}>
                  {exercicio.grupo}
                </span>
                <span className={`${nivelConfig[exercicio.nivel]} text-xs`}>
                  {exercicio.nivel}
                </span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3" />
                {exercicio.equipamento}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-base p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum exercício encontrado</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Tente ajustar os filtros ou cadastre um novo exercício</p>
        </div>
      )}

      {/* Create Exercise Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo Exercício</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label-base">Nome do exercício *</label>
                <input type="text" className="input-base" placeholder="Ex: Supino Reto com Barra" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Grupo muscular *</label>
                  <select className="input-base">
                    {muscleGroups.filter(g => g !== 'Todos').map(g => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">Nível *</label>
                  <select className="input-base">
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-base">Equipamento</label>
                <input type="text" className="input-base" placeholder="Ex: Barra, Halteres, Máquina" />
              </div>

              <div>
                <label className="label-base">Descrição</label>
                <textarea className="input-base resize-none" rows={3} placeholder="Descrição do exercício..." />
              </div>

              <div>
                <label className="label-base">Instruções de execução</label>
                <textarea className="input-base resize-none" rows={4} placeholder="Passo a passo de como executar..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">GIF demonstrativo</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
                    <p className="text-xs text-gray-400">Clique para upload</p>
                    <p className="text-xs text-gray-300">GIF, até 10MB</p>
                  </div>
                </div>
                <div>
                  <label className="label-base">Vídeo demonstrativo</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
                    <p className="text-xs text-gray-400">Clique para upload</p>
                    <p className="text-xs text-gray-300">MP4, até 50MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button className="btn-primary flex-1">Salvar Exercício</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
