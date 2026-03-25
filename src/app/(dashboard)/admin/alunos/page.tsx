‘use client’

import { useState, useEffect, useCallback } from ‘react’
import Link from ‘next/link’
import { UserPlus, Search, Ban, CheckCircle, Phone, Mail, Calendar, RefreshCw } from ‘lucide-react’
import { supabase } from ‘@/lib/supabase/client’
import { useAuth } from ‘@/lib/hooks/useAuth’
import { format } from ‘date-fns’
import toast from ‘react-hot-toast’

interface Aluno {
id: string
usuario_id: string
matricula: string
data_vencimento: string | null
status_pagamento: string
objetivos: string | null
nome: string
email: string
telefone: string | null
foto_url: string | null
status_usuario: string
plano_nome: string | null
plano_valor: number | null
}

const pagamentoConfig: Record<string, { label: string; class: string }> = {
pago:      { label: ‘Em dia’,    class: ‘badge-success’ },
pendente:  { label: ‘Pendente’,  class: ‘badge-warning’ },
vencido:   { label: ‘Vencido’,   class: ‘badge-danger’  },
cancelado: { label: ‘Cancelado’, class: ‘badge-gray’    },
}

const statusConfig: Record<string, { label: string; class: string }> = {
ativo:    { label: ‘Ativo’,    class: ‘badge-success’ },
inativo:  { label: ‘Inativo’,  class: ‘badge-gray’    },
suspenso: { label: ‘Suspenso’, class: ‘badge-danger’  },
}

export default function AlunosPage() {
const { usuario } = useAuth()
const [alunos, setAlunos] = useState<Aluno[]>([])
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState(’’)
const [filtro, setFiltro] = useState(‘todos’)

const fetchAlunos = useCallback(async () => {
if (!usuario?.academia_id) return
setLoading(true)
try {
// Query em dois passos para evitar problemas de RLS com joins
const { data: alunosData, error: alunosError } = await supabase
.from(‘alunos’)
.select(‘id, usuario_id, matricula, data_vencimento, status_pagamento, objetivos, plano_id’)
.eq(‘academia_id’, usuario.academia_id)
.order(‘created_at’, { ascending: false })

```
  if (alunosError) {
    console.error('Erro alunos:', alunosError)
    toast.error('Erro ao carregar alunos')
    setLoading(false)
    return
  }

  if (!alunosData || alunosData.length === 0) {
    setAlunos([])
    setLoading(false)
    return
  }

  // Buscar usuários
  const usuarioIds = alunosData.map(a => a.usuario_id).filter(Boolean)
  const planoIds = alunosData.map(a => a.plano_id).filter(Boolean)

  const [{ data: usuarios }, { data: planos }] = await Promise.all([
    supabase.from('usuarios').select('id, nome, email, telefone, foto_url, status').in('id', usuarioIds),
    planoIds.length > 0
      ? supabase.from('planos').select('id, nome, valor').in('id', planoIds)
      : Promise.resolve({ data: [] }),
  ])

  const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))
  const planosMap = Object.fromEntries((planos ?? []).map(p => [p.id, p]))

  const alunosFull: Aluno[] = alunosData.map(a => {
    const u = usuariosMap[a.usuario_id] ?? {}
    const p = planosMap[a.plano_id] ?? {}
    return {
      id: a.id,
      usuario_id: a.usuario_id,
      matricula: a.matricula,
      data_vencimento: a.data_vencimento,
      status_pagamento: a.status_pagamento,
      objetivos: a.objetivos,
      nome: u.nome ?? 'Sem nome',
      email: u.email ?? '',
      telefone: u.telefone ?? null,
      foto_url: u.foto_url ?? null,
      status_usuario: u.status ?? 'ativo',
      plano_nome: p.nome ?? null,
      plano_valor: p.valor ?? null,
    }
  })

  setAlunos(alunosFull)
} catch (err) {
  console.error('Erro inesperado:', err)
  toast.error('Erro ao carregar alunos')
} finally {
  setLoading(false)
}
```

}, [usuario?.academia_id])

useEffect(() => { fetchAlunos() }, [fetchAlunos])

const toggleStatus = async (usuarioId: string, statusAtual: string) => {
const novoStatus = statusAtual === ‘ativo’ ? ‘inativo’ : ‘ativo’
const { error } = await supabase.from(‘usuarios’).update({ status: novoStatus }).eq(‘id’, usuarioId)
if (error) { toast.error(‘Erro ao atualizar’); return }
toast.success(`Aluno ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}`)
fetchAlunos()
}

const filtered = alunos.filter(a => {
const matchSearch =
a.nome.toLowerCase().includes(search.toLowerCase()) ||
a.email.toLowerCase().includes(search.toLowerCase()) ||
a.matricula?.includes(search)
const matchFiltro =
filtro === ‘todos’ ? true :
filtro === ‘inadimplente’ ? a.status_pagamento === ‘vencido’ :
a.status_usuario === filtro
return matchSearch && matchFiltro
})

const stats = {
total: alunos.length,
ativos: alunos.filter(a => a.status_usuario === ‘ativo’).length,
inadimplentes: alunos.filter(a => a.status_pagamento === ‘vencido’).length,
}

return (
<div className="space-y-6 animate-fade-in">
<div className="page-header">
<div>
<h1 className="page-title">Alunos</h1>
<p className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? ‘s’ : ‘’} cadastrado{alunos.length !== 1 ? ‘s’ : ‘’}</p>
</div>
<div className="flex items-center gap-2">
<button onClick={fetchAlunos} disabled={loading} className="btn-ghost p-2" title="Atualizar">
<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
</button>
<Link href="/admin/alunos/novo" className="btn-primary flex items-center gap-2 text-sm">
<UserPlus className="w-4 h-4" />
<span className="hidden sm:inline">Novo Aluno</span>
<span className="sm:hidden">+</span>
</Link>
</div>
</div>

```
  {/* Stats */}
  <div className="grid grid-cols-3 gap-4">
    <div className="card-base p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
      <p className="text-xs text-gray-500 mt-0.5">Total</p>
    </div>
    <div className="card-base p-4 text-center">
      <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
      <p className="text-xs text-gray-500 mt-0.5">Ativos</p>
    </div>
    <div className="card-base p-4 text-center">
      <p className="text-2xl font-bold text-red-500">{stats.inadimplentes}</p>
      <p className="text-xs text-gray-500 mt-0.5">Inadimplentes</p>
    </div>
  </div>

  {/* Filtros */}
  <div className="card-base p-4 space-y-3">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input type="text" placeholder="Buscar por nome, email ou matrícula..."
        value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
    </div>
    <div className="flex gap-2 flex-wrap">
      {[
        { key: 'todos', label: 'Todos' },
        { key: 'ativo', label: 'Ativos' },
        { key: 'inativo', label: 'Inativos' },
        { key: 'inadimplente', label: 'Inadimplentes' },
      ].map(f => (
        <button key={f.key} onClick={() => setFiltro(f.key)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            filtro === f.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
          {f.label}
        </button>
      ))}
    </div>
  </div>

  {/* Loading */}
  {loading && (
    <div className="card-base p-8 text-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-400 text-sm">Carregando alunos...</p>
    </div>
  )}

  {/* Tabela desktop */}
  {!loading && (
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
            {filtered.map(aluno => (
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
                <td className="table-td font-mono text-xs">{aluno.matricula ?? '—'}</td>
                <td className="table-td">
                  {aluno.plano_nome
                    ? <span className="badge-info">{aluno.plano_nome}</span>
                    : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="table-td text-xs">
                  {aluno.data_vencimento
                    ? format(new Date(aluno.data_vencimento), 'dd/MM/yyyy')
                    : '—'}
                </td>
                <td className="table-td">
                  <span className={statusConfig[aluno.status_usuario]?.class ?? 'badge-gray'}>
                    {statusConfig[aluno.status_usuario]?.label ?? aluno.status_usuario}
                  </span>
                </td>
                <td className="table-td">
                  <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>
                    {pagamentoConfig[aluno.status_pagamento]?.label ?? aluno.status_pagamento}
                  </span>
                </td>
                <td className="table-td">
                  <button
                    onClick={() => toggleStatus(aluno.usuario_id, aluno.status_usuario)}
                    className={`btn-ghost p-1.5 ${aluno.status_usuario === 'ativo' ? 'text-red-500' : 'text-green-500'}`}
                    title={aluno.status_usuario === 'ativo' ? 'Desativar' : 'Ativar'}
                  >
                    {aluno.status_usuario === 'ativo'
                      ? <Ban className="w-4 h-4" />
                      : <CheckCircle className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {alunos.length === 0 ? 'Nenhum aluno cadastrado ainda.' : 'Nenhum aluno encontrado.'}
          </p>
          {alunos.length === 0 && (
            <Link href="/admin/alunos/novo" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" />Cadastrar primeiro aluno
            </Link>
          )}
        </div>
      )}
    </div>
  )}

  {/* Cards mobile */}
  {!loading && (
    <div className="md:hidden space-y-3">
      {filtered.map(aluno => (
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
                <p className="text-xs text-gray-400">{aluno.matricula ?? '—'}</p>
              </div>
            </div>
            <span className={statusConfig[aluno.status_usuario]?.class ?? 'badge-gray'}>
              {statusConfig[aluno.status_usuario]?.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{aluno.email}</span>
            </div>
            {aluno.telefone && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Phone className="w-3.5 h-3.5" /><span>{aluno.telefone}</span>
              </div>
            )}
            {aluno.data_vencimento && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Vence: {format(new Date(aluno.data_vencimento), 'dd/MM/yy')}</span>
              </div>
            )}
            {aluno.plano_nome && <span className="badge-info">{aluno.plano_nome}</span>}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>
              {pagamentoConfig[aluno.status_pagamento]?.label}
            </span>
            <button
              onClick={() => toggleStatus(aluno.usuario_id, aluno.status_usuario)}
              className={`btn-ghost p-1.5 text-xs ${aluno.status_usuario === 'ativo' ? 'text-red-500' : 'text-green-500'}`}
            >
              {aluno.status_usuario === 'ativo' ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="card-base p-8 text-center">
          <p className="text-gray-400">
            {alunos.length === 0 ? 'Nenhum aluno cadastrado.' : 'Nenhum resultado.'}
          </p>
        </div>
      )}
    </div>
  )}
</div>
```

)
}