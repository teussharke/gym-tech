'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Copy, Trash2, ChevronDown, ChevronUp, Dumbbell, Clock, Users, RefreshCw, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface Treino {
  id: string
  nome: string
  dia_semana: string | null
  duracao_estimada_min: number | null
  ativo: boolean
  aluno_id: string
  nomeAluno: string
}

const diaColors: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  B: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  C: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  E: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  F: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export default function ProfessorTreinosPage() {
  const { usuario } = useAuth()
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedAluno, setExpandedAluno] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos')

  const fetchTreinos = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      // Busca TODOS os treinos da academia (não só do professor logado)
      const { data: treinosData, error } = await supabase
        .from('treinos')
        .select('id, nome, dia_semana, duracao_estimada_min, ativo, aluno_id')
        .eq('academia_id', usuario.academia_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!treinosData?.length) { setTreinos([]); setLoading(false); return }

      // Buscar nomes dos alunos
      const alunoIds = [...new Set(treinosData.map(t => t.aluno_id))]
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id, usuario_id')
        .in('id', alunoIds)

      const usuarioIds = (alunos ?? []).map(a => a.usuario_id)
      const { data: usuarios } = await supabase
        .from('usuarios').select('id, nome').in('id', usuarioIds)

      const alunoIdToNome: Record<string, string> = {}
      ;(alunos ?? []).forEach(a => {
        const u = (usuarios ?? []).find(u => u.id === a.usuario_id)
        if (u) alunoIdToNome[a.id] = u.nome
      })

      setTreinos(treinosData.map(t => ({
        ...t,
        nomeAluno: alunoIdToNome[t.aluno_id] ?? 'Aluno desconhecido',
      })))
    } catch (err) {
      toast.error('Erro ao carregar treinos')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchTreinos() }, [fetchTreinos])

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('treinos').update({ ativo: !ativo }).eq('id', id)
    toast.success(ativo ? 'Treino desativado' : 'Treino ativado')
    fetchTreinos()
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este treino?')) return
    await supabase.from('treinos').delete().eq('id', id)
    toast.success('Treino excluído')
    fetchTreinos()
  }

  const duplicar = async (treino: Treino) => {
    if (!usuario?.academia_id) return
    const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()

    const { error } = await supabase.from('treinos').insert({
      nome: `${treino.nome} (cópia)`,
      aluno_id: treino.aluno_id,
      academia_id: usuario.academia_id,
      professor_id: prof?.id ?? null,
      dia_semana: treino.dia_semana,
      duracao_estimada_min: treino.duracao_estimada_min,
      ativo: true,
    })
    if (error) { toast.error('Erro ao duplicar'); return }
    toast.success('Treino duplicado!')
    fetchTreinos()
  }

  const treinosFiltrados = treinos.filter(t => {
    const matchSearch =
      t.nomeAluno.toLowerCase().includes(search.toLowerCase()) ||
      t.nome.toLowerCase().includes(search.toLowerCase())
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'ativos' ? t.ativo :
      !t.ativo
    return matchSearch && matchFiltro
  })

  // Agrupar por aluno
  const porAluno = treinosFiltrados.reduce((acc: Record<string, { nome: string; treinos: Treino[] }>, t) => {
    if (!acc[t.aluno_id]) acc[t.aluno_id] = { nome: t.nomeAluno, treinos: [] }
    acc[t.aluno_id].treinos.push(t)
    return acc
  }, {})

  const totalAlunos = Object.keys(porAluno).length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fichas de Treino</h1>
          <p className="page-subtitle">{treinos.length} treinos · {totalAlunos} aluno{totalAlunos !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTreinos} disabled={loading} className="btn-ghost p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/professor/treinos/novo" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Treino</span>
            <span className="sm:hidden">+</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalAlunos}</p>
          <p className="text-xs text-gray-400">Alunos</p>
        </div>
        <div className="stat-card text-center">
          <Dumbbell className="w-5 h-5 text-orange-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{treinos.length}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{treinos.filter(t => t.ativo).length}</p>
          <p className="text-xs text-gray-400">Ativos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por aluno ou treino..."
            value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
        </div>
        <div className="flex gap-2">
          {[{ key: 'todos', label: 'Todos' }, { key: 'ativos', label: 'Ativos' }, { key: 'inativos', label: 'Inativos' }].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key as typeof filtro)}
              className={`text-xs font-medium px-3 py-2 rounded-xl transition-colors ${filtro === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(porAluno).map(([alunoId, { nome, treinos: treinosAluno }]) => {
            const isExpanded = expandedAluno === alunoId
            return (
              <div key={alunoId} className="card-base overflow-hidden">
                {/* Header do aluno */}
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  onClick={() => setExpandedAluno(isExpanded ? null : alunoId)}>
                  <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                      {nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{nome}</p>
                    <p className="text-xs text-gray-400">
                      {treinosAluno.length} ficha{treinosAluno.length !== 1 ? 's' : ''}
                      {' · '}{treinosAluno.filter(t => t.ativo).length} ativa{treinosAluno.filter(t => t.ativo).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link
                    href="/professor/treinos/novo"
                    onClick={e => e.stopPropagation()}
                    className="btn-ghost p-1.5 text-orange-500"
                    title="Novo treino para este aluno"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Treinos do aluno */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
                    {treinosAluno.map(treino => (
                      <div key={treino.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        {treino.dia_semana && (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${diaColors[treino.dia_semana] ?? 'badge-gray'}`}>
                            {treino.dia_semana}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${treino.ativo ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                            {treino.nome}
                          </p>
                          {treino.duracao_estimada_min && (
                            <p className="text-xs text-gray-400">~{treino.duracao_estimada_min} min</p>
                          )}
                        </div>
                        {!treino.ativo && <span className="badge-gray text-xs flex-shrink-0">Inativo</span>}

                        {/* Ações */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => duplicar(treino)} className="btn-ghost p-1.5" title="Duplicar">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleAtivo(treino.id, treino.ativo)}
                            className={`btn-ghost p-1.5 ${treino.ativo ? 'text-amber-500' : 'text-green-500'}`}
                            title={treino.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {treino.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => excluir(treino.id)} className="btn-ghost p-1.5 text-red-400" title="Excluir">
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

          {Object.keys(porAluno).length === 0 && (
            <div className="card-base p-12 text-center">
              <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {treinos.length === 0 ? 'Nenhum treino criado ainda.' : 'Nenhum resultado encontrado.'}
              </p>
              <Link href="/professor/treinos/novo" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />Criar primeiro treino
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
