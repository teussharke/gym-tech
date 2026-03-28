'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { UserPlus, Search, Ban, CheckCircle, Trash2, Phone, Mail, Calendar, RefreshCw, AlertTriangle, Edit3, X, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Aluno {
  id: string
  usuario_id: string
  matricula: string
  data_vencimento: string | null
  status_pagamento: string
  nome: string
  email: string
  telefone: string | null
  status_usuario: string
  plano_nome: string | null
  objetivos: string | null
}

interface EditAdminForm {
  nome: string
  email: string
  telefone: string
  status_usuario: string
  status_pagamento: string
  data_vencimento: string
  objetivos: string
}

const pagamentoConfig: Record<string, { label: string; class: string }> = {
  pago:      { label: 'Em dia',    class: 'badge-success' },
  pendente:  { label: 'Pendente',  class: 'badge-warning' },
  vencido:   { label: 'Vencido',   class: 'badge-danger'  },
  cancelado: { label: 'Cancelado', class: 'badge-gray'    },
}

const statusConfig: Record<string, { label: string; class: string }> = {
  ativo:    { label: 'Ativo',    class: 'badge-success' },
  inativo:  { label: 'Inativo',  class: 'badge-gray'    },
  suspenso: { label: 'Suspenso', class: 'badge-danger'  },
}

export default function AlunosPage() {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [confirmDelete, setConfirmDelete] = useState<Aluno | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editAluno, setEditAluno] = useState<Aluno | null>(null)
  const [editForm, setEditForm] = useState<EditAdminForm>({ nome: '', email: '', telefone: '', status_usuario: 'ativo', status_pagamento: 'pendente', data_vencimento: '', objetivos: '' })
  const [editSaving, setEditSaving] = useState(false)

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, usuario_id, matricula, data_vencimento, status_pagamento, plano_id, objetivos')
        .eq('academia_id', usuario.academia_id)
        .order('created_at', { ascending: false })

      if (!alunosData || alunosData.length === 0) { setAlunos([]); setLoading(false); return }

      const usuarioIds = alunosData.map(a => a.usuario_id).filter(Boolean)
      const planoIds = alunosData.map(a => a.plano_id).filter(Boolean)

      const [{ data: usuarios }, { data: planos }] = await Promise.all([
        supabase.from('usuarios').select('id, nome, email, telefone, status').in('id', usuarioIds),
        planoIds.length > 0
          ? supabase.from('planos').select('id, nome').in('id', planoIds)
          : Promise.resolve({ data: [] }),
      ])

      const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))
      const planosMap = Object.fromEntries((planos ?? []).map(p => [p.id, p]))

      setAlunos(alunosData.map(a => ({
        id: a.id,
        usuario_id: a.usuario_id,
        matricula: a.matricula,
        data_vencimento: a.data_vencimento,
        status_pagamento: a.status_pagamento,
        nome: usuariosMap[a.usuario_id]?.nome ?? 'Sem nome',
        email: usuariosMap[a.usuario_id]?.email ?? '',
        telefone: usuariosMap[a.usuario_id]?.telefone ?? null,
        status_usuario: usuariosMap[a.usuario_id]?.status ?? 'ativo',
        plano_nome: planosMap[a.plano_id]?.nome ?? null,
        objetivos: (a as any).objetivos ?? null,
      })))
    } catch (err) {
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const toggleStatus = async (usuarioId: string, statusAtual: string) => {
    const novo = statusAtual === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase.from('usuarios').update({ status: novo }).eq('id', usuarioId)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success(`Aluno ${novo === 'ativo' ? 'ativado' : 'desativado'}`)
    fetchAlunos()
  }

  const excluirAluno = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      // Exclui o usuário do Auth (cascade exclui tudo mais via RLS)
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: confirmDelete.usuario_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Aluno excluído com sucesso')
      setConfirmDelete(null)
      fetchAlunos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  const abrirEdicao = (aluno: Aluno) => {
    setEditAluno(aluno)
    setEditForm({
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone ?? '',
      status_usuario: aluno.status_usuario,
      status_pagamento: aluno.status_pagamento,
      data_vencimento: aluno.data_vencimento ? aluno.data_vencimento.split('T')[0] : '',
      objetivos: aluno.objetivos ?? '',
    })
  }

  const salvarEdicao = async () => {
    if (!editAluno) return
    setEditSaving(true)
    try {
      const [resUsuario, resAluno] = await Promise.all([
        supabase.from('usuarios').update({
          nome: editForm.nome,
          email: editForm.email,
          telefone: editForm.telefone || null,
          status: editForm.status_usuario,
        }).eq('id', editAluno.usuario_id),
        supabase.from('alunos').update({
          status_pagamento: editForm.status_pagamento,
          data_vencimento: editForm.data_vencimento || null,
          objetivos: editForm.objetivos || null,
        }).eq('id', editAluno.id),
      ])
      if (resUsuario.error) throw resUsuario.error
      if (resAluno.error) throw resAluno.error
      toast.success('Dados atualizados!')
      setEditAluno(null)
      fetchAlunos()
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setEditSaving(false)
    }
  }

  const filtered = alunos.filter(a => {
    const matchSearch =
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.matricula?.includes(search)
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'inadimplente' ? a.status_pagamento === 'vencido' :
      a.status_usuario === filtro
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAlunos} disabled={loading} className="btn-ghost p-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <Link href="/admin/alunos/novo" className="btn-primary flex items-center gap-2 text-sm">
            <UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Novo Aluno</span><span className="sm:hidden">+</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alunos.length}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="card-base p-4 text-center"><p className="text-2xl font-bold text-green-600">{alunos.filter(a => a.status_usuario === 'ativo').length}</p><p className="text-xs text-gray-500">Ativos</p></div>
        <div className="card-base p-4 text-center"><p className="text-2xl font-bold text-red-500">{alunos.filter(a => a.status_pagamento === 'vencido').length}</p><p className="text-xs text-gray-500">Inadimplentes</p></div>
      </div>

      {/* Filtros */}
      <div className="card-base p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, email ou matrícula..."
            value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'todos', label: 'Todos' }, { key: 'ativo', label: 'Ativos' }, { key: 'inativo', label: 'Inativos' }, { key: 'inadimplente', label: 'Inadimplentes' }].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filtro === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-base p-8 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-400 text-sm">Carregando...</p></div>
      ) : (
        <>
          {/* Desktop */}
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
                          <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
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
                      <td className="table-td">{aluno.plano_nome ? <span className="badge-info">{aluno.plano_nome}</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                      <td className="table-td text-xs">{aluno.data_vencimento ? format(new Date(aluno.data_vencimento), 'dd/MM/yyyy') : '—'}</td>
                      <td className="table-td"><span className={statusConfig[aluno.status_usuario]?.class ?? 'badge-gray'}>{statusConfig[aluno.status_usuario]?.label}</span></td>
                      <td className="table-td"><span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>{pagamentoConfig[aluno.status_pagamento]?.label}</span></td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirEdicao(aluno)} className="btn-ghost p-1.5" title="Editar" style={{ color: 'var(--neon)' }}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleStatus(aluno.usuario_id, aluno.status_usuario)}
                            className={`btn-ghost p-1.5 ${aluno.status_usuario === 'ativo' ? 'text-amber-500' : 'text-green-500'}`}
                            title={aluno.status_usuario === 'ativo' ? 'Desativar' : 'Ativar'}>
                            {aluno.status_usuario === 'ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setConfirmDelete(aluno)} className="btn-ghost p-1.5 text-red-500" title="Excluir">
                            <Trash2 className="w-4 h-4" />
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
                <p className="text-gray-400">{alunos.length === 0 ? 'Nenhum aluno cadastrado.' : 'Nenhum resultado.'}</p>
                {alunos.length === 0 && <Link href="/admin/alunos/novo" className="btn-primary text-sm mt-4 inline-flex items-center gap-2"><UserPlus className="w-4 h-4" />Cadastrar aluno</Link>}
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map(aluno => (
              <div key={aluno.id} className="card-base p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                        {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{aluno.nome}</p>
                      <p className="text-xs text-gray-400">{aluno.matricula ?? '—'}</p>
                    </div>
                  </div>
                  <span className={statusConfig[aluno.status_usuario]?.class ?? 'badge-gray'}>{statusConfig[aluno.status_usuario]?.label}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>{pagamentoConfig[aluno.status_pagamento]?.label}</span>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEdicao(aluno)} className="btn-ghost p-1.5" title="Editar" style={{ color: 'var(--neon)' }}>
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleStatus(aluno.usuario_id, aluno.status_usuario)}
                      className={`btn-ghost p-1.5 ${aluno.status_usuario === 'ativo' ? 'text-amber-500' : 'text-green-500'}`}>
                      {aluno.status_usuario === 'ativo' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setConfirmDelete(aluno)} className="btn-ghost p-1.5 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Editar Aluno */}
      {editAluno && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-c)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Editar Aluno</h2>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{editAluno.matricula ?? 'Sem matrícula'}</p>
              </div>
              <button onClick={() => setEditAluno(null)} className="btn-ghost p-2 rounded-xl">
                <X className="w-5 h-5" style={{ color: 'var(--text-2)' }} />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Dados pessoais */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Dados Pessoais</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>Nome completo</label>
                    <input className="input-base" value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>E-mail</label>
                    <input type="email" className="input-base" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>Telefone</label>
                    <input className="input-base" value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                </div>
              </div>

              {/* Status e Pagamento */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Status</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>Status do usuário</label>
                    <select className="input-base" value={editForm.status_usuario} onChange={e => setEditForm(f => ({ ...f, status_usuario: e.target.value }))}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="suspenso">Suspenso</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>Status do pagamento</label>
                    <select className="input-base" value={editForm.status_pagamento} onChange={e => setEditForm(f => ({ ...f, status_pagamento: e.target.value }))}>
                      <option value="pago">Em dia</option>
                      <option value="pendente">Pendente</option>
                      <option value="vencido">Vencido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-2)' }}>Vencimento do plano</label>
                    <input type="date" className="input-base" value={editForm.data_vencimento} onChange={e => setEditForm(f => ({ ...f, data_vencimento: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-3)' }}>Objetivos</label>
                <textarea className="input-base resize-none" rows={3} value={editForm.objetivos}
                  onChange={e => setEditForm(f => ({ ...f, objetivos: e.target.value }))}
                  placeholder="Ex: Perda de peso, hipertrofia..." />
              </div>

              {/* Link para treinos */}
              <Link href="/admin/alunos"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-input)', color: 'var(--neon)', border: '1px solid var(--border-neon)' }}>
                Ver treinos deste aluno
              </Link>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setEditAluno(null)} className="btn-secondary flex-1" disabled={editSaving}>Cancelar</button>
              <button onClick={salvarEdicao} disabled={editSaving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Excluir Aluno</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                Você está prestes a excluir permanentemente o aluno <strong>{confirmDelete.nome}</strong>.
                Todos os treinos, avaliações e histórico serão removidos.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1" disabled={deleting}>Cancelar</button>
              <button onClick={excluirAluno} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
