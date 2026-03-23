'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UserPlus, Search, Filter, MoreVertical, Edit, Trash2, 
  Eye, Ban, CheckCircle, Phone, Mail, Calendar, Download
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mock data
const mockAlunos = [
  { id: '1', nome: 'Carlos Eduardo Silva', email: 'carlos@email.com', telefone: '(32) 99999-1111', matricula: 'GF2024001', plano: 'Premium', vencimento: '2024-02-15', status: 'ativo', status_pagamento: 'pago', foto: null, data_matricula: '2023-01-15' },
  { id: '2', nome: 'Ana Paula Oliveira', email: 'ana@email.com', telefone: '(32) 99999-2222', matricula: 'GF2024002', plano: 'Básico', vencimento: '2024-01-20', status: 'ativo', status_pagamento: 'pendente', foto: null, data_matricula: '2023-03-20' },
  { id: '3', nome: 'Pedro Henrique Santos', email: 'pedro@email.com', telefone: '(32) 99999-3333', matricula: 'GF2024003', plano: 'Premium', vencimento: '2024-01-10', status: 'suspenso', status_pagamento: 'vencido', foto: null, data_matricula: '2022-11-05' },
  { id: '4', nome: 'Maria Clara Costa', email: 'maria@email.com', telefone: '(32) 99999-4444', matricula: 'GF2024004', plano: 'Família', vencimento: '2024-02-28', status: 'ativo', status_pagamento: 'pago', foto: null, data_matricula: '2023-08-10' },
  { id: '5', nome: 'João Victor Ferreira', email: 'joao@email.com', telefone: '(32) 99999-5555', matricula: 'GF2024005', plano: 'Básico', vencimento: '2024-02-05', status: 'ativo', status_pagamento: 'pago', foto: null, data_matricula: '2024-01-02' },
  { id: '6', nome: 'Fernanda Lima', email: 'fernanda@email.com', telefone: '(32) 99999-6666', matricula: 'GF2024006', plano: 'Premium', vencimento: '2024-01-25', status: 'inativo', status_pagamento: 'cancelado', foto: null, data_matricula: '2021-05-15' },
]

type FilterStatus = 'todos' | 'ativo' | 'inativo' | 'suspenso' | 'inadimplente'

const statusConfig = {
  ativo: { label: 'Ativo', class: 'badge-success' },
  inativo: { label: 'Inativo', class: 'badge-gray' },
  suspenso: { label: 'Suspenso', class: 'badge-danger' },
}

const pagamentoConfig = {
  pago: { label: 'Pago', class: 'badge-success' },
  pendente: { label: 'Pendente', class: 'badge-warning' },
  vencido: { label: 'Vencido', class: 'badge-danger' },
  cancelado: { label: 'Cancelado', class: 'badge-gray' },
}

export default function AlunosPage() {
  const [alunos] = useState(mockAlunos)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('todos')
  const [selectedAluno, setSelectedAluno] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const filtered = alunos.filter(a => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.matricula.includes(search)
    
    const matchFilter = filter === 'todos' ? true :
      filter === 'inadimplente' ? a.status_pagamento === 'vencido' :
      a.status === filter
    
    return matchSearch && matchFilter
  })

  const stats = {
    total: alunos.length,
    ativos: alunos.filter(a => a.status === 'ativo').length,
    inadimplentes: alunos.filter(a => a.status_pagamento === 'vencido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">{stats.total} alunos cadastrados</p>
        </div>
        <Link href="/admin/alunos/novo" className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Aluno</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ativos</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.inadimplentes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Inadimplentes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          {/* Export */}
          <button className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'ativo', 'inativo', 'suspenso', 'inadimplente'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'inadimplente' ? 'Inadimplentes' : f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1 text-xs opacity-70">
                ({f === 'todos' ? alunos.length : f === 'inadimplente' ? stats.inadimplentes : alunos.filter(a => a.status === f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      {/* Desktop table */}
      <div className="card-base hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Aluno</th>
                <th className="table-th">Matrícula</th>
                <th className="table-th">Plano</th>
                <th className="table-th">Vencimento</th>
                <th className="table-th">Status</th>
                <th className="table-th">Pagamento</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((aluno) => (
                <tr key={aluno.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                          {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{aluno.nome}</p>
                        <p className="text-xs text-gray-400">{aluno.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-xs">{aluno.matricula}</td>
                  <td className="table-td">
                    <span className="badge-info">{aluno.plano}</span>
                  </td>
                  <td className="table-td text-xs">
                    {format(new Date(aluno.vencimento), 'dd/MM/yyyy')}
                  </td>
                  <td className="table-td">
                    <span className={statusConfig[aluno.status as keyof typeof statusConfig].class}>
                      {statusConfig[aluno.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={pagamentoConfig[aluno.status_pagamento as keyof typeof pagamentoConfig].class}>
                      {pagamentoConfig[aluno.status_pagamento as keyof typeof pagamentoConfig].label}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/alunos/${aluno.id}`} className="btn-ghost p-1.5" title="Ver detalhes">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/alunos/${aluno.id}/editar`} className="btn-ghost p-1.5" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="btn-ghost p-1.5 text-red-500 hover:text-red-600" title="Desativar">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500">Nenhum aluno encontrado</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((aluno) => (
          <div key={aluno.id} className="card-base p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                    {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{aluno.nome}</p>
                  <p className="text-xs text-gray-400">{aluno.matricula}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <span className={statusConfig[aluno.status as keyof typeof statusConfig].class}>
                  {statusConfig[aluno.status as keyof typeof statusConfig].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{aluno.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Phone className="w-3.5 h-3.5" />
                <span>{aluno.telefone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Vence: {format(new Date(aluno.vencimento), 'dd/MM/yy')}</span>
              </div>
              <div>
                <span className={pagamentoConfig[aluno.status_pagamento as keyof typeof pagamentoConfig].class}>
                  {pagamentoConfig[aluno.status_pagamento as keyof typeof pagamentoConfig].label}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
              <Link href={`/admin/alunos/${aluno.id}`} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Ver
              </Link>
              <Link href={`/admin/alunos/${aluno.id}/editar`} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                <Edit className="w-3.5 h-3.5" />
                Editar
              </Link>
              <button className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center text-red-500">
                <Ban className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>Mostrando {filtered.length} de {alunos.length} alunos</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40" disabled>Anterior</button>
            <button className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40" disabled>Próximo</button>
          </div>
        </div>
      )}
    </div>
  )
}
