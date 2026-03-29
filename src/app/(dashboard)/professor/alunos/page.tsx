'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, ClipboardList, Activity, TrendingUp, Users, Dumbbell, RefreshCw, Filter, Edit3, X, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, startOfMonth } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface AlunoProf {
  id: string
  usuario_id: string
  status_pagamento: string
  objetivos: string | null
  data_vencimento: string | null
  nome: string
  email: string
  plano_nome: string | null
  checkins: number
  treinos: number
  ultimoTreino: string | null
  isMeu: boolean // se está vinculado a este professor
}

const pagamentoConfig: Record<string, { label: string; class: string }> = {
  pago:      { label: 'Em dia',    class: 'badge-success' },
  pendente:  { label: 'Pendente',  class: 'badge-warning' },
  vencido:   { label: 'Vencido',   class: 'badge-danger'  },
  cancelado: { label: 'Cancelado', class: 'badge-gray'    },
}

interface EditForm {
  objetivos: string
  status_pagamento: string
  data_vencimento: string
  observacoes: string
}

export default function ProfessorAlunosPage() {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState<AlunoProf[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detalhe, setDetalhe] = useState<AlunoProf | null>(null)
  const [filtroMeus, setFiltroMeus] = useState(false)
  const [editAluno, setEditAluno] = useState<AlunoProf | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ objetivos: '', status_pagamento: 'pago', data_vencimento: '', observacoes: '' })
  const [editSaving, setEditSaving] = useState(false)

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id || !usuario?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const mesInicio = startOfMonth(new Date()).toISOString()

      // Tudo em paralelo: professor + alunos com joins + stats
      const [
        { data: prof },
        { data: alunosData, error: alunosErr },
        { data: presencas },
        { data: treinos },
        { data: historico },
      ] = await Promise.all([
        supabase.from('professores').select('id').eq('usuario_id', usuario.id).maybeSingle(),
        // JOIN direto: elimina 2 round-trips sequenciais
        supabase.from('alunos')
          .select(`
            id, usuario_id, status_pagamento, objetivos, data_vencimento, professor_id,
            usuario:usuarios (id, nome, email, status),
            plano:planos (id, nome)
          `)
          .eq('academia_id', usuario.academia_id),
        supabase.from('presencas').select('aluno_id').eq('academia_id', usuario.academia_id).gte('data_checkin', mesInicio),
        supabase.from('treinos').select('aluno_id').eq('academia_id', usuario.academia_id).eq('ativo', true),
        supabase.from('historico_treinos').select('aluno_id, data_treino').eq('academia_id', usuario.academia_id).order('data_treino', { ascending: false }),
      ])

      if (alunosErr) throw alunosErr

      const checkinsPorAluno: Record<string, number> = {}
      const treinosPorAluno: Record<string, number> = {}
      const ultimoTreinoPorAluno: Record<string, string> = {}
      ;(presencas ?? []).forEach(p => { checkinsPorAluno[p.aluno_id] = (checkinsPorAluno[p.aluno_id] ?? 0) + 1 })
      ;(treinos ?? []).forEach(t => { treinosPorAluno[t.aluno_id] = (treinosPorAluno[t.aluno_id] ?? 0) + 1 })
      ;(historico ?? []).forEach(h => { if (!ultimoTreinoPorAluno[h.aluno_id]) ultimoTreinoPorAluno[h.aluno_id] = h.data_treino })

      type AlunoRow = { id: string; usuario_id: string; status_pagamento: string; objetivos: string | null; data_vencimento: string | null; professor_id: string | null; usuario: { id: string; nome: string; email: string; status: string } | null; plano: { id: string; nome: string } | null }

      const alunosFull: AlunoProf[] = ((alunosData ?? []) as unknown as AlunoRow[])
        .filter(a => a.usuario !== null)
        .map(a => ({
          id: a.id,
          usuario_id: a.usuario_id,
          status_pagamento: a.status_pagamento,
          objetivos: a.objetivos,
          data_vencimento: a.data_vencimento,
          nome: a.usuario?.nome ?? 'Sem nome',
          email: a.usuario?.email ?? '',
          plano_nome: a.plano?.nome ?? null,
          checkins: checkinsPorAluno[a.id] ?? 0,
          treinos: treinosPorAluno[a.id] ?? 0,
          ultimoTreino: ultimoTreinoPorAluno[a.id] ?? null,
          isMeu: prof ? a.professor_id === prof.id : false,
        }))
        .sort((a, b) => {
          if (a.isMeu && !b.isMeu) return -1
          if (!a.isMeu && b.isMeu) return 1
          return a.nome.localeCompare(b.nome)
        })

      setAlunos(alunosFull)
    } catch {
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id, usuario?.id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const abrirEdicao = (aluno: AlunoProf) => {
    setEditAluno(aluno)
    setEditForm({
      objetivos: aluno.objetivos ?? '',
      status_pagamento: aluno.status_pagamento ?? 'pago',
      data_vencimento: aluno.data_vencimento ? aluno.data_vencimento.split('T')[0] : '',
      observacoes: '',
    })
  }

  const salvarEdicao = async () => {
    if (!editAluno) return
    setEditSaving(true)
    try {
      const { error } = await supabase.from('alunos').update({
        objetivos: editForm.objetivos || null,
        status_pagamento: editForm.status_pagamento,
        data_vencimento: editForm.data_vencimento || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editAluno.id)

      if (error) throw error
      toast.success('Dados do aluno atualizados!')
      setEditAluno(null)
      fetchAlunos()
    } catch {
      toast.error('Erro ao salvar alterações')
    } finally {
      setEditSaving(false)
    }
  }

  const filtered = alunos.filter(a => {
    const matchSearch =
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtroMeus ? a.isMeu : true
    return matchSearch && matchFiltro
  })

  const meusTotalCount = alunos.filter(a => a.isMeu).length
  const mediaCheckins = filtered.length > 0
    ? Math.round(filtered.reduce((s, a) => s + a.checkins, 0) / filtered.length)
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">
            {filtered.length} de {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
            {filtroMeus ? ' (somente meus)' : ''}
          </p>
        </div>
        <button onClick={fetchAlunos} disabled={loading} className="btn-ghost p-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alunos.length}</p>
          <p className="text-xs text-gray-400">Total academia</p>
        </div>
        <div className="stat-card text-center">
          <Dumbbell className="w-5 h-5 text-orange-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{meusTotalCount}</p>
          <p className="text-xs text-gray-400">Meus alunos</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mediaCheckins}</p>
          <p className="text-xs text-gray-400">Média check-ins</p>
        </div>
      </div>

      {/* Busca + toggle filtro */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
        </div>

        {/* Toggle todos / somente meus */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroMeus(false)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all', !filtroMeus ? 'gradient-orange text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}>
            <Users className="w-4 h-4" />
            Todos ({alunos.length})
          </button>
          <button
            onClick={() => setFiltroMeus(true)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all', filtroMeus ? 'gradient-orange text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}>
            <Filter className="w-4 h-4" />
            Somente meus ({meusTotalCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando alunos...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(aluno => (
            <div key={aluno.id} className="card-base p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    aluno.isMeu ? 'gradient-orange' : 'bg-gray-100 dark:bg-gray-700')}>
                    <span className={clsx('text-sm font-bold', aluno.isMeu ? 'text-white' : 'text-gray-600 dark:text-gray-400')}>
                      {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{aluno.nome}</p>
                      {aluno.isMeu && <span className="badge-info text-xs">Meu</span>}
                    </div>
                    <p className="text-xs text-gray-400">{aluno.objetivos ?? aluno.plano_nome ?? '—'}</p>
                  </div>
                </div>
                <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>
                  {pagamentoConfig[aluno.status_pagamento]?.label}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Frequência mensal</span>
                  <span className="font-semibold">{aluno.checkins}/20</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min((aluno.checkins / 20) * 100, 100)}%`,
                    background: aluno.checkins >= 16 ? '#22c55e' : aluno.checkins >= 10 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />{aluno.treinos} ficha{aluno.treinos !== 1 ? 's' : ''} ativa{aluno.treinos !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {aluno.ultimoTreino ? `Último: ${format(new Date(aluno.ultimoTreino), 'dd/MM')}` : 'Sem histórico'}
                </span>
              </div>

              <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setDetalhe(aluno)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Perfil
                </button>
                <button onClick={() => abrirEdicao(aluno)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
                  style={{ color: 'var(--neon)', borderColor: 'var(--border-neon)' }}>
                  <Edit3 className="w-3.5 h-3.5" />Editar
                </button>
                <Link href="/professor/avaliacoes" className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />Avaliação
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card-base p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {filtroMeus ? 'Você não tem alunos vinculados.' : 'Nenhum resultado.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Perfil do Aluno ── */}
      {detalhe && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="modal-card w-full max-w-md shadow-2xl animate-scale-in">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Perfil do Aluno</h2>
              <button onClick={() => setDetalhe(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: detalhe.isMeu ? 'var(--neon)' : 'var(--bg-chip)', boxShadow: detalhe.isMeu ? '0 0 16px var(--neon-glow)' : 'none' }}>
                  <span className="text-xl font-bold" style={{ color: detalhe.isMeu ? '#000' : 'var(--text-2)' }}>
                    {detalhe.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold" style={{ color: 'var(--text-1)' }}>{detalhe.nome}</p>
                    {detalhe.isMeu && <span className="badge-info text-xs">Meu aluno</span>}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>{detalhe.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Objetivo',      value: detalhe.objetivos ?? '—' },
                  { label: 'Check-ins/mês', value: `${detalhe.checkins} dias` },
                  { label: 'Fichas ativas', value: `${detalhe.treinos} treino(s)` },
                  { label: 'Vencimento',    value: detalhe.data_vencimento ? format(new Date(detalhe.data_vencimento), 'dd/MM/yyyy') : '—' },
                  { label: 'Pagamento',     value: pagamentoConfig[detalhe.status_pagamento]?.label ?? '—' },
                  { label: 'Último treino', value: detalhe.ultimoTreino ? format(new Date(detalhe.ultimoTreino), 'dd/MM') : 'Sem histórico' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--bg-chip)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-1)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setDetalhe(null); abrirEdicao(detalhe) }}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
                <Edit3 className="w-4 h-4" />Editar Dados
              </button>
              <button onClick={() => setDetalhe(null)} className="btn-secondary px-4">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Aluno ── */}
      {editAluno && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="modal-card w-full max-w-md shadow-2xl animate-scale-in">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Editar Aluno</h2>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>{editAluno.nome}</p>
              </div>
              <button onClick={() => setEditAluno(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label-base">Objetivo / Modalidade</label>
                <input value={editForm.objetivos}
                  onChange={e => setEditForm(p => ({ ...p, objetivos: e.target.value }))}
                  placeholder="Ex: Hipertrofia, Emagrecimento..."
                  className="input-base" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Status Pagamento</label>
                  <select value={editForm.status_pagamento}
                    onChange={e => setEditForm(p => ({ ...p, status_pagamento: e.target.value }))}
                    className="input-base" style={{ background: 'var(--bg-input)' }}>
                    <option value="pago">Em dia</option>
                    <option value="pendente">Pendente</option>
                    <option value="vencido">Vencido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="label-base">Vencimento</label>
                  <input type="date" value={editForm.data_vencimento}
                    onChange={e => setEditForm(p => ({ ...p, data_vencimento: e.target.value }))}
                    className="input-base"
                    style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Link rápido para treinos */}
              <div className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: 'var(--bg-chip)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Fichas de Treino</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {editAluno.treinos} ficha(s) ativa(s) · {editAluno.checkins} check-ins/mês
                  </p>
                </div>
                <Link href="/professor/treinos"
                  onClick={() => setEditAluno(null)}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />Ver Treinos
                </Link>
              </div>
            </div>

            <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={salvarEdicao} disabled={editSaving}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5">
                {editSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                  : <><Save className="w-4 h-4" />Salvar</>
                }
              </button>
              <button onClick={() => setEditAluno(null)} className="btn-secondary px-4" disabled={editSaving}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
