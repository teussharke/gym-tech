'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Video } from 'lucide-react'
import { mockExercicios, gruposMusculares, grupoColors, nivelColors } from '@/lib/mock/exercicios'

const levels = ['Todos', 'Iniciante', 'Intermediário', 'Avançado']

function ExercicioCard({ exercicio }: { exercicio: typeof mockExercicios[0] }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="card-hover overflow-hidden group">
      {/* Imagem */}
      <div className="bg-gray-100 dark:bg-gray-700 h-36 flex items-center justify-center relative overflow-hidden">
        {exercicio.gif_url && !imgError ? (
          <img
            src={exercicio.gif_url}
            alt={exercicio.nome}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-center">
            <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto" />
            <p className="text-xs text-gray-400 mt-1">Sem imagem</p>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
            <Edit className="w-3.5 h-3.5" /> Editar
          </button>
          <button className="bg-red-500/80 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
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
          <span className={`${nivelColors[exercicio.nivel]} text-xs`}>
            {exercicio.nivel}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Dumbbell className="w-3 h-3" />
          {exercicio.equipamento}
        </p>
      </div>
    </div>
  )
}

export default function ExerciciosPage() {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [selectedLevel, setSelectedLevel] = useState('Todos')
  const [showForm, setShowForm] = useState(false)

  const filtered = mockExercicios.filter(e => {
    const matchSearch =
      e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.equipamento.toLowerCase().includes(search.toLowerCase()) ||
      e.grupo.toLowerCase().includes(search.toLowerCase())
    const matchGroup = selectedGroup === 'Todos' || e.grupo === selectedGroup
    const matchLevel = selectedLevel === 'Todos' || e.nivel === selectedLevel
    return matchSearch && matchGroup && matchLevel
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exercícios</h1>
          <p className="page-subtitle">{mockExercicios.length} exercícios na biblioteca</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Exercício</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      <div className="card-base p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar exercício, grupo ou equipamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {gruposMusculares.map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedGroup === g ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {levels.map(l => (
            <button key={l} onClick={() => setSelectedLevel(l)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedLevel === l ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} exercício{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(e => <ExercicioCard key={e.id} exercicio={e} />)}
      </div>

      {filtered.length === 0 && (
        <div className="card-base p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum exercício encontrado</p>
        </div>
      )}

      {/* Modal novo exercício */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo Exercício</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label-base">Nome do exercício *</label>
                <input type="text" className="input-base" placeholder="Ex: Supino Reto com Barra" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Grupo muscular *</label>
                  <select className="input-base">
                    {gruposMusculares.filter(g => g !== 'Todos').map(g => <option key={g}>{g}</option>)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Imagem / GIF</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
                    <Video className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Upload GIF/JPG</p>
                  </div>
                </div>
                <div>
                  <label className="label-base">Ou URL da imagem</label>
                  <input type="url" className="input-base" placeholder="https://..." />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button className="btn-primary flex-1">Salvar Exercício</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
