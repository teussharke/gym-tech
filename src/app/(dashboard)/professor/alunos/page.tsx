'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, ClipboardList, Activity, TrendingUp, Users, Dumbbell } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'

interface AlunoProf {
  id: string
  status_pagamento: string
  objetivos: string | null
  data_vencimento: string | null
  usuario: { nome: string; email: string; foto_url: string | null; status: string }
  plano: { nome: string } | null
  _checkins?: number
  _treinos?: number
  _ultimoTreino?: string | null
}

const pagamentoConfig: Record<string, { label: string; class: string }> = {
  pago: { label: 'Em dia', class: 'badge-success' },
  pendente: { label: 'Pendente', class: 'badge-warning' },
  vencido: { label: 'Vencido', class: 'badge-danger' },
  cancelado: { label: 'Cancelado', class: 'badge-gray' },
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
      const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()
      if (!prof) { setLoading(false); return }

      const { data } = await supabase
        .from('alunos')
        .select(`
          id, status_pagamento, objetivos, data_vencimento,
          usuario:usuarios!alunos_usuario_id_fkey (nome, email, foto_url, status),
          plano:planos (nome)
        `)
        .eq('academia_id', usuario.academia_id)
        .eq('professor_id', prof.id)
        .order('created_at', { ascending: false })

      if (!data) { setLoading(false); return }

      // Buscar dados extras
      const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const alunosComDados = await Promise.all(data.map(async (a) => {
        const [{ count: checkins }, { count: treinos }, { data: ultimoTreino }] = await Promise.all([
          supabase.from('presencas').select('*', { count: 'exact', head: true }).eq('aluno_id', a.id).gte('data_checkin', mesInicio),
          supabase.from('treinos').select('*', { count: 'exact', head: true }).eq('aluno_id', a.id).eq('ativo', true),
          supabase.from('historico_treinos').select('data_treino').eq('aluno_id', a.id).order('data_treino', { ascending: false }).limit(1),
        ])
        return {
          ...a,
          _checkins: checkins ?? 0,
          _treinos: treinos ?? 0,
          _ultimoTreino: ultimoTreino?.[0]?.data_treino ?? null,
        }
      }))

      setAlunos(alunosComDados as unknown as AlunoProf[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id, usuario?.id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const filtered = alunos.filter(a =>
    a.usuario?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    a.usuario?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const mediaCheckins = alunos.length > 0
    ? Math.round((alunos.reduce((s, a) => s + (a._checkins ?? 0), 0)) / alunos.length)
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus Alunos</h1>
          <p className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} vinculado{alunos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{alunos.length}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mediaCheckins}</p>
          <p className="text-xs text-gray-400">Média check-ins</p>
        </div>
        <div className="stat-card text-center">
          <Activity className="w-5 h-5 text-red-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {alunos.filter(a => a.status_pagamento === 'vencido').length}
          </p>
          <p className="text-xs text-gray-400">Inadimplentes</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(aluno => (
            <div key={aluno.id} className="card-base p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                      {aluno.usuario?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('') ?? '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{aluno.usuario?.nome}</p>
                    <p className="text-xs text-gray-400">{aluno.objetivos ?? aluno.plano?.nome ?? 'Sem objetivo definido'}</p>
                  </div>
                </div>
                <span className={pagamentoConfig[aluno.status_pagamento]?.class ?? 'badge-gray'}>
                  {pagamentoConfig[aluno.status_pagamento]?.label}
                </span>
              </div>

              {/* Barra frequência */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Frequência mensal</span>
                  <span className="font-semibold">{aluno._checkins}/20 dias</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(((aluno._checkins ?? 0) / 20) * 100, 100)}%`,
                    background: (aluno._checkins ?? 0) >= 16 ? '#22c55e' : (aluno._checkins ?? 0) >= 10 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />{aluno._treinos} ficha{(aluno._treinos ?? 0) !== 1 ? 's' : ''} ativa{(aluno._treinos ?? 0) !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {aluno._ultimoTreino
                    ? `Último: ${format(new Date(aluno._ultimoTreino), 'dd/MM')}`
                    : 'Sem treinos'}
                </span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setDetalhe(aluno)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Ver perfil
                </button>
                <a href={`/professor/avaliacoes`} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />Avaliação
                </a>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card-base p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {alunos.length === 0 ? 'Nenhum aluno vinculado a você.' : 'Nenhum resultado.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal detalhe */}
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
                    {detalhe.usuario?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{detalhe.usuario?.nome}</p>
                  <p className="text-sm text-gray-400">{detalhe.usuario?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plano', value: detalhe.plano?.nome ?? '—' },
                  { label: 'Objetivo', value: detalhe.objetivos ?? '—' },
                  { label: 'Check-ins/mês', value: `${detalhe._checkins} dias` },
                  { label: 'Fichas ativas', value: `${detalhe._treinos} treinos` },
                  { label: 'Vencimento', value: detalhe.data_vencimento ? format(new Date(detalhe.data_vencimento), 'dd/MM/yyyy') : '—' },
                  { label: 'Pagamento', value: pagamentoConfig[detalhe.status_pagamento]?.label ?? detalhe.status_pagamento },
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
