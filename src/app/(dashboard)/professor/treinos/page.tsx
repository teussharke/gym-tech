'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Copy, Trash2, ChevronDown, ChevronUp, Dumbbell, Clock, Users } from 'lucide-react'
import Link from 'next/link'

const mockTreinos = [
  {
    id: '1', aluno: 'Carlos Silva', aluno_id: '1',
    treinos: [
      { id: 't1', nome: 'Treino A - Peito e Tríceps', dia: 'A', exercicios: 5, duracao: 60, ativo: true },
      { id: 't2', nome: 'Treino B - Costas e Bíceps', dia: 'B', exercicios: 4, duracao: 55, ativo: true },
      { id: 't3', nome: 'Treino C - Pernas', dia: 'C', exercicios: 6, duracao: 70, ativo: true },
    ],
  },
  {
    id: '2', aluno: 'Ana Oliveira', aluno_id: '2',
    treinos: [
      { id: 't4', nome: 'Treino Full Body A', dia: 'Segunda', exercicios: 7, duracao: 50, ativo: true },
      { id: 't5', nome: 'Treino Full Body B', dia: 'Quarta', exercicios: 7, duracao: 50, ativo: true },
    ],
  },
  {
    id: '3', aluno: 'Pedro Santos', aluno_id: '3',
    treinos: [
      { id: 't6', nome: 'Treino Força A', dia: 'A', exercicios: 4, duracao: 75, ativo: true },
      { id: 't7', nome: 'Treino Força B', dia: 'B', exercicios: 4, duracao: 75, ativo: false },
    ],
  },
]

const diaColors: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  B: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  C: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Segunda: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Quarta: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export default function ProfessorTreinosPage() {
  const [search, setSearch] = useState('')
  const [expandedAluno, setExpandedAluno] = useState<string | null>(mockTreinos[0]?.id ?? null)

  const filtered = mockTreinos.filter(a =>
    a.aluno.toLowerCase().includes(search.toLowerCase())
  )

  const totalTreinos = mockTreinos.reduce((s, a) => s + a.treinos.length, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fichas de Treino</h1>
          <p className="page-subtitle">{totalTreinos} treinos para {mockTreinos.length} alunos</p>
        </div>
        <Link href="/professor/treinos/novo" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Treino</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockTreinos.length}</p>
          <p className="text-xs text-gray-400">Alunos</p>
        </div>
        <div className="stat-card text-center">
          <Dumbbell className="w-5 h-5 text-primary-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTreinos}</p>
          <p className="text-xs text-gray-400">Treinos</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 text-purple-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(mockTreinos.flatMap(a => a.treinos).reduce((s, t) => s + t.duracao, 0) / totalTreinos)}
          </p>
          <p className="text-xs text-gray-400">Min. médio</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Lista agrupada por aluno */}
      <div className="space-y-3">
        {filtered.map(grupo => {
          const isExpanded = expandedAluno === grupo.id
          return (
            <div key={grupo.id} className="card-base overflow-hidden">
              {/* Header do aluno */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedAluno(isExpanded ? null : grupo.id)}
              >
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                    {grupo.aluno.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{grupo.aluno}</p>
                  <p className="text-xs text-gray-400">{grupo.treinos.length} ficha{grupo.treinos.length !== 1 ? 's' : ''} de treino</p>
                </div>
                <Link
                  href="/professor/treinos/novo"
                  onClick={e => e.stopPropagation()}
                  className="btn-ghost p-1.5 text-primary-500"
                  title="Novo treino para este aluno"
                >
                  <Plus className="w-4 h-4" />
                </Link>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {/* Treinos do aluno */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
                  {grupo.treinos.map(treino => (
                    <div key={treino.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${diaColors[treino.dia] ?? 'badge-gray'}`}>
                        {treino.dia}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${treino.ativo ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                          {treino.nome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {treino.exercicios} exercícios · ~{treino.duracao} min
                        </p>
                      </div>
                      {!treino.ativo && <span className="badge-gray text-xs">Inativo</span>}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button className="btn-ghost p-1.5" title="Editar">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn-ghost p-1.5" title="Duplicar">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn-ghost p-1.5 text-red-400" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
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
          <Link href="/professor/treinos/novo" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar primeiro treino
          </Link>
        </div>
      )}
    </div>
  )
}
