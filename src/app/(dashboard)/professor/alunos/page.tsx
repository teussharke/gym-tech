'use client'

import { useState } from 'react'
import { Search, Eye, ClipboardList, Activity, TrendingUp, Users, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'

const mockMeusAlunos = [
  { id: '1', nome: 'Carlos Silva', email: 'carlos@email.com', matricula: 'GF2024001', plano: 'Premium', ultimo_treino: '2024-01-22', checkins_mes: 15, status_pagamento: 'pago', objetivo: 'Hipertrofia', treinos: 3 },
  { id: '2', nome: 'Ana Oliveira', email: 'ana@email.com', matricula: 'GF2024002', plano: 'Básico', ultimo_treino: '2024-01-21', checkins_mes: 12, status_pagamento: 'pago', objetivo: 'Emagrecimento', treinos: 2 },
  { id: '3', nome: 'Pedro Santos', email: 'pedro@email.com', matricula: 'GF2024003', plano: 'Premium', ultimo_treino: '2024-01-15', checkins_mes: 8, status_pagamento: 'vencido', objetivo: 'Força', treinos: 4 },
  { id: '4', nome: 'Maria Costa', email: 'maria@email.com', matricula: 'GF2024004', plano: 'Família', ultimo_treino: '2024-01-22', checkins_mes: 20, status_pagamento: 'pago', objetivo: 'Condicionamento', treinos: 3 },
  { id: '5', nome: 'João Ferreira', email: 'joao@email.com', matricula: 'GF2024005', plano: 'Básico', ultimo_treino: '2024-01-20', checkins_mes: 10, status_pagamento: 'pago', objetivo: 'Hipertrofia', treinos: 2 },
]

const pagamentoConfig: Record<string, { label: string; class: string }> = {
  pago: { label: 'Em dia', class: 'badge-success' },
  pendente: { label: 'Pendente', class: 'badge-warning' },
  vencido: { label: 'Vencido', class: 'badge-danger' },
}

export default function ProfessorAlunosPage() {
  const [search, setSearch] = useState('')
  const [alunoDetalhes, setAlunoDetalhes] = useState<typeof mockMeusAlunos[0] | null>(null)

  const filtered = mockMeusAlunos.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.matricula.includes(search)
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus Alunos</h1>
          <p className="page-subtitle">{mockMeusAlunos.length} alunos vinculados a você</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockMeusAlunos.length}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(mockMeusAlunos.reduce((s, a) => s + a.checkins_mes, 0) / mockMeusAlunos.length)}
          </p>
          <p className="text-xs text-gray-400">Média check-ins</p>
        </div>
        <div className="stat-card text-center">
          <Activity className="w-5 h-5 text-red-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mockMeusAlunos.filter(a => a.status_pagamento === 'vencido').length}
          </p>
          <p className="text-xs text-gray-400">Inadimplentes</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(aluno => (
          <div key={aluno.id} className="card-base p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                    {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{aluno.nome}</p>
                  <p className="text-xs text-gray-400">{aluno.matricula} · {aluno.objetivo}</p>
                </div>
              </div>
              <span className={pagamentoConfig[aluno.status_pagamento].class}>
                {pagamentoConfig[aluno.status_pagamento].label}
              </span>
            </div>

            {/* Frequência barra */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Frequência mensal</span>
                <span className="font-semibold">{aluno.checkins_mes}/20 dias</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((aluno.checkins_mes / 20) * 100, 100)}%`,
                    background: aluno.checkins_mes >= 16 ? '#22c55e' : aluno.checkins_mes >= 10 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                {aluno.treinos} fichas de treino
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Último treino: {format(new Date(aluno.ultimo_treino), 'dd/MM')}
              </span>
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setAlunoDetalhes(aluno)}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Ver perfil
              </button>
              <a
                href={`/professor/treinos?aluno=${aluno.id}`}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Treinos
              </a>
              <a
                href={`/professor/avaliacoes?aluno=${aluno.id}`}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" /> Avaliação
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal detalhes */}
      {alunoDetalhes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Perfil do Aluno</h2>
              <button onClick={() => setAlunoDetalhes(null)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
                    {alunoDetalhes.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{alunoDetalhes.nome}</p>
                  <p className="text-sm text-gray-400">{alunoDetalhes.email}</p>
                  <p className="text-xs text-gray-400">{alunoDetalhes.matricula}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plano', value: alunoDetalhes.plano },
                  { label: 'Objetivo', value: alunoDetalhes.objetivo },
                  { label: 'Check-ins/mês', value: `${alunoDetalhes.checkins_mes} dias` },
                  { label: 'Fichas de treino', value: `${alunoDetalhes.treinos} treinos` },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Frequência mensal</p>
                <div className="progress-bar h-3">
                  <div
                    className="progress-fill h-3"
                    style={{ width: `${Math.min((alunoDetalhes.checkins_mes / 20) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{alunoDetalhes.checkins_mes}/20 dias</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setAlunoDetalhes(null)} className="btn-secondary w-full">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
