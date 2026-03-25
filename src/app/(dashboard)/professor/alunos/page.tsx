'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, ClipboardList, Activity, TrendingUp, Users, Dumbbell, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, startOfMonth } from 'date-fns'

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
}

const pagamentoConfig: Record<string, { label: string; class: string }> = {
  pago:      { label: 'Em dia',   class: 'badge-success' },
  pendente:  { label: 'Pendente', class: 'badge-warning' },
  vencido:   { label: 'Vencido',  class: 'badge-danger'  },
  cancelado: { label: 'Cancelado',class: 'badge-gray'    },
}

export default function ProfessorAlunosPage() {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState<AlunoProf[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detalhe, setDetalhe] = useState<AlunoProf | null>(null)

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id || !usuario?.id) return
    setLoading(true)

    try {
      // Buscar professor
      const { data: prof } = await supabase
        .from('professores').select('id').eq('usuario_id', usuario.id).single()
      if (!prof) { setLoading(false); return }

      const mesInicio = startOfMonth(new Date()).toISOString()

      // Queries em paralelo
      const [
        { data: alunosData },
        { data: presencas },
        { data: treinos },
        { data: historico },
      ] = await Promise.all([
        // Alunos vinculados ao professor
        supabase.from('alunos')
          .select('id, usuario_id, status_pagamento, objetivos, data_vencimento, plano_id')
          .eq('academia_id', usuario.academia_id)
          .eq('professor_id', prof.id),

        // Check-ins do mês
        supabase.from('presencas')
          .select('aluno_id')
          .eq('academia_id', usuario.academia_id)
          .gte('data_checkin', mesInicio),

        // Treinos ativos
        supabase.from('treinos')
          .select('aluno_id')
          .eq('academia_id', usuario.academia_id)
          .eq('professor_id', prof.id)
          .eq('ativo', true),

        // Último treino por aluno
        supabase.from('historico_treinos')
          .select('aluno_id, data_treino')
          .eq('academia_id', usuario.academia_id)
          .order('data_treino', { ascending: false }),
      ])

      if (!alunosData || alunosData.length === 0) { setAlunos([]); setLoading(false); return }

      // Buscar usuários e planos em paralelo
      const usuarioIds = alunosData.map(a => a.usuario_id)
      const planoIds = alunosData.map(a => a.plano_id).filter(Boolean)

      const [{ data: usuarios }, { data: planos }] = await Promise.all([
        supabase.from('usuarios').select('id, nome, email').in('id', usuarioIds),
        planoIds.length > 0
          ? supabase.from('planos').select('id, nome').in('id', planoIds)
          : Promise.resolve({ data: [] }),
      ])

      // Montar mapa de dados
      const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))
      const planosMap = Object.fromEntries((planos ?? []).map(p => [p.id, p]))

      // Contar check-ins por aluno
      const checkinsPorAluno: Record<string, number> = {}
      ;(presencas ?? []).forEach(p => { checkinsPorAluno[p.aluno_id] = (checkinsPorAluno[p.aluno_id] ?? 0) + 1 })

      // Contar treinos ativos por aluno
      const treinosPorAluno: Record<string, number> = {}
      ;(treinos ?? []).forEach(t => { treinosPorAluno[t.aluno_id] = (treinosPorAluno[t.aluno_id] ?? 0) + 1 })

      // Último treino por aluno
      const ultimoTreinoPorAluno: Record<string, string> = {}
      ;(historico ?? []).forEach(h => {
        if (!ultimoTreinoPorAluno[h.aluno_id]) ultimoTreinoPorAluno[h.aluno_id] = h.data_treino
      })

      const alunosFull: AlunoProf[] = alunosData.map(a => {
        const u = usuariosMap[a.usuario_id] ?? {}
        const p = planosMap[a.plano_id] ?? {}
        return {
          id: a.id,
          usuario_id: a.usuario_id,
          status_pagamento: a.status_pagamento,
          objetivos: a.objetivos,
          data_vencimento: a.data_vencimento,
          nome: u.nome ?? 'Sem nome',
          email: u.email ?? '',
          plano_nome: p.nome ?? null,
          checkins: checkinsPorAluno[a.id] ?? 0,
          treinos: treinosPorAluno[a.id] ?? 0,
          ultimoTreino: ultimoTreinoPorAluno[a.id] ?? null,
        }
      })

      setAlunos(alunosFull)
    } catch (err) {
      console.error('Erro alunos professor:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id, usuario?.id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const filtered = alunos.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  const mediaCheckins = alunos.length > 0
    ? Math.round(alunos.reduce((s, a) => s + a.checkins, 0) / alunos.length)
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus Alunos</h1>
          <p className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} vinculado{alunos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchAlunos} disabled={loading} className="btn-ghost p-2" title="Atualizar">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center"><Users className="w-5 h-5 text-blue-500 mx-auto" /><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alunos.length}</p><p className="text-xs text-gray-400">Total</p></div>
        <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-green-500 mx-auto" /><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mediaCheckins}</p><p className="text-xs text-gray-400">Média check-ins</p></div>
        <div className="stat-card text-center"><Activity className="w-5 h-5 text-red-500 mx-auto" /><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alunos.filter(a => a.status_pagamento === 'vencido').length}</p><p className="text-xs text-gray-400">Inadimplentes</p></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando alunos...</p>
        </div>
      ) : (
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
                    <p className="text-xs text-gray-400">{aluno.objetivos ?? aluno.plano_nome ?? 'Sem objetivo'}</p>
                  </div>
                </div>
                <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>
                  {pagamentoConfig[aluno.status_pagamento]?.label}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Frequência mensal</span>
                  <span className="font-semibold">{aluno.checkins}/20 dias</span>
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
                  {aluno.ultimoTreino ? `Último: ${format(new Date(aluno.ultimoTreino), 'dd/MM')}` : 'Sem treinos'}
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
              <p className="text-gray-500">{alunos.length === 0 ? 'Nenhum aluno vinculado.' : 'Nenhum resultado.'}</p>
            </div>
          )}
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Perfil do Aluno</h2>
              <button onClick={() => setDetalhe(null)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
                    {detalhe.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{detalhe.nome}</p>
                  <p className="text-sm text-gray-400">{detalhe.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plano', value: detalhe.plano_nome ?? '—' },
                  { label: 'Objetivo', value: detalhe.objetivos ?? '—' },
                  { label: 'Check-ins/mês', value: `${detalhe.checkins} dias` },
                  { label: 'Fichas ativas', value: `${detalhe.treinos} treinos` },
                  { label: 'Vencimento', value: detalhe.data_vencimento ? format(new Date(detalhe.data_vencimento), 'dd/MM/yyyy') : '—' },
                  { label: 'Pagamento', value: pagamentoConfig[detalhe.status_pagamento]?.label },
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
