'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, ClipboardList, Activity, TrendingUp, Users, Dumbbell, RefreshCw, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, startOfMonth } from 'date-fns'
import clsx from 'clsx'

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

export default function ProfessorAlunosPage() {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState<AlunoProf[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detalhe, setDetalhe] = useState<AlunoProf | null>(null)
  const [filtroMeus, setFiltroMeus] = useState(false) // false = todos, true = somente meus

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id || !usuario?.id) return
    setLoading(true)
    try {
      // Busca o professor logado
      const { data: prof } = await supabase
        .from('professores').select('id').eq('usuario_id', usuario.id).single()

      const mesInicio = startOfMonth(new Date()).toISOString()

      // Busca TODOS os alunos da academia
      const [
        { data: alunosData },
        { data: presencas },
        { data: treinos },
        { data: historico },
      ] = await Promise.all([
        supabase.from('alunos')
          .select('id, usuario_id, status_pagamento, objetivos, data_vencimento, plano_id, professor_id')
          .eq('academia_id', usuario.academia_id),
        supabase.from('presencas')
          .select('aluno_id')
          .eq('academia_id', usuario.academia_id)
          .gte('data_checkin', mesInicio),
        supabase.from('treinos')
          .select('aluno_id')
          .eq('academia_id', usuario.academia_id)
          .eq('ativo', true),
        supabase.from('historico_treinos')
          .select('aluno_id, data_treino')
          .eq('academia_id', usuario.academia_id)
          .order('data_treino', { ascending: false }),
      ])

      if (!alunosData?.length) { setAlunos([]); setLoading(false); return }

      const usuarioIds = alunosData.map(a => a.usuario_id)
      const planoIds = alunosData.map(a => a.plano_id).filter(Boolean)

      const [{ data: usuarios }, { data: planos }] = await Promise.all([
        supabase.from('usuarios').select('id, nome, email, status').in('id', usuarioIds),
        planoIds.length > 0
          ? supabase.from('planos').select('id, nome').in('id', planoIds)
          : Promise.resolve({ data: [] }),
      ])

      const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))
      const planosMap   = Object.fromEntries((planos ?? []).map(p => [p.id, p]))
      const checkinsPorAluno: Record<string, number> = {}
      const treinosPorAluno: Record<string, number> = {}
      const ultimoTreinoPorAluno: Record<string, string> = {}

      ;(presencas ?? []).forEach(p => { checkinsPorAluno[p.aluno_id] = (checkinsPorAluno[p.aluno_id] ?? 0) + 1 })
      ;(treinos ?? []).forEach(t => { treinosPorAluno[t.aluno_id] = (treinosPorAluno[t.aluno_id] ?? 0) + 1 })
      ;(historico ?? []).forEach(h => { if (!ultimoTreinoPorAluno[h.aluno_id]) ultimoTreinoPorAluno[h.aluno_id] = h.data_treino })

      const alunosFull: AlunoProf[] = alunosData
        .filter(a => usuariosMap[a.usuario_id]) // apenas com usuário válido
        .map(a => ({
          id: a.id,
          usuario_id: a.usuario_id,
          status_pagamento: a.status_pagamento,
          objetivos: a.objetivos,
          data_vencimento: a.data_vencimento,
          nome: usuariosMap[a.usuario_id]?.nome ?? 'Sem nome',
          email: usuariosMap[a.usuario_id]?.email ?? '',
          plano_nome: planosMap[a.plano_id]?.nome ?? null,
          checkins: checkinsPorAluno[a.id] ?? 0,
          treinos: treinosPorAluno[a.id] ?? 0,
          ultimoTreino: ultimoTreinoPorAluno[a.id] ?? null,
          isMeu: prof ? a.professor_id === prof.id : false,
        }))
        .sort((a, b) => {
          // Meus alunos primeiro
          if (a.isMeu && !b.isMeu) return -1
          if (!a.isMeu && b.isMeu) return 1
          return a.nome.localeCompare(b.nome)
        })

      setAlunos(alunosFull)
    } catch (err) {
      console.error('Erro ao buscar alunos:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id, usuario?.id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

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

              <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setDetalhe(aluno)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Ver perfil
                </button>
                <a href="/professor/avaliacoes" className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />Avaliação
                </a>
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

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Perfil do Aluno</h2>
              <button onClick={() => setDetalhe(null)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0', detalhe.isMeu ? 'gradient-orange' : 'bg-gray-100 dark:bg-gray-700')}>
                  <span className={clsx('text-xl font-bold', detalhe.isMeu ? 'text-white' : 'text-gray-600')}>
                    {detalhe.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{detalhe.nome}</p>
                    {detalhe.isMeu && <span className="badge-info text-xs">Meu aluno</span>}
                  </div>
                  <p className="text-sm text-gray-400">{detalhe.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plano',         value: detalhe.plano_nome ?? '—' },
                  { label: 'Objetivo',      value: detalhe.objetivos ?? '—' },
                  { label: 'Check-ins/mês', value: `${detalhe.checkins} dias` },
                  { label: 'Fichas ativas', value: `${detalhe.treinos} treinos` },
                  { label: 'Vencimento',    value: detalhe.data_vencimento ? format(new Date(detalhe.data_vencimento), 'dd/MM/yyyy') : '—' },
                  { label: 'Pagamento',     value: pagamentoConfig[detalhe.status_pagamento]?.label ?? '—' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setDetalhe(null)} className="btn-secondary w-full">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
