'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Activity, Calendar, Loader2, Plus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface Avaliacao {
  id: string
  data_avaliacao: string
  peso_kg: number | null
  altura_cm: number | null
  imc: number | null
  percentual_gordura: number | null
  observacoes: string | null
  medidas: {
    cintura: number | null
    braco_direito: number | null
    coxa_direita: number | null
    quadril: number | null
    abdomen: number | null
  } | null
}

interface AlunoSimples {
  id: string
  nome: string
  objetivo: string | null
}

interface SeletorAlunoProps {
  loadingAlunos: boolean
  alunos: AlunoSimples[]
  alunoSelecionado: string
  onChange: (id: string) => void
}

const SeletorAluno = memo(function SeletorAluno({ loadingAlunos, alunos, alunoSelecionado, onChange }: SeletorAlunoProps) {
  return (
    <div className="card-base p-4">
      <label className="label-base">Selecionar aluno *</label>
      {loadingAlunos ? (
        <div className="input-base flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Carregando alunos...
        </div>
      ) : alunos.length === 0 ? (
        <p className="text-sm text-amber-500 p-2">Nenhum aluno ativo encontrado.</p>
      ) : (
        <select
          value={alunoSelecionado}
          onChange={e => onChange(e.target.value)}
          className="input-base"
        >
          <option value="">Selecionar... ({alunos.length} alunos)</option>
          {alunos.map(a => (
            <option key={a.id} value={a.id}>
              {a.nome}{a.objetivo ? ` — ${a.objetivo}` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
})

export default function AvaliacoesPage() {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState<AlunoSimples[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingAlunos, setLoadingAlunos] = useState(true)

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) { setLoadingAlunos(false); return }
    setLoadingAlunos(true)
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('id, objetivos, usuario:usuarios!inner (id, nome, status)')
        .eq('academia_id', usuario.academia_id)
        .eq('usuarios.status', 'ativo')

      if (error) throw error

      type Row = { id: string; objetivos: string | null; usuario: { id: string; nome: string; status: string } }

      const alunosFull: AlunoSimples[] = ((data ?? []) as unknown as Row[])
        .filter(a => a.usuario?.status === 'ativo')
        .map(a => ({ id: a.id, nome: a.usuario?.nome ?? 'Sem nome', objetivo: a.objetivos ?? null }))
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setAlunos(alunosFull)
    } catch {
      setAlunos([])
    } finally {
      setLoadingAlunos(false)
    }
  }, [usuario?.academia_id])

  const fetchAvaliacoes = useCallback(async () => {
    if (!alunoSelecionado) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('avaliacoes_fisicas')
        .select(`
          id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura, observacoes,
          medidas:medidas_corporais (cintura, braco_direito, coxa_direita, quadril, abdomen)
        `)
        .eq('aluno_id', alunoSelecionado)
        .order('data_avaliacao', { ascending: false })
      setAvaliacoes((data as unknown as Avaliacao[]) ?? [])
    } catch {
      setAvaliacoes([])
    } finally {
      setLoading(false)
    }
  }, [alunoSelecionado])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])
  useEffect(() => { fetchAvaliacoes() }, [fetchAvaliacoes])

  const graficoPeso = avaliacoes.slice().reverse().map(a => ({
    data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    peso: a.peso_kg,
    gordura: a.percentual_gordura,
  }))

  const alunoNome = alunos.find(a => a.id === alunoSelecionado)?.nome

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Avaliações Físicas</h1>
          <p className="page-subtitle">Histórico e evolução dos alunos</p>
        </div>
        <Link
          href={alunoSelecionado ? `/professor/avaliacoes/nova?aluno=${alunoSelecionado}` : '/professor/avaliacoes/nova'}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Avaliação</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      <SeletorAluno
        loadingAlunos={loadingAlunos}
        alunos={alunos}
        alunoSelecionado={alunoSelecionado}
        onChange={setAlunoSelecionado}
      />

      {loading && (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && alunoSelecionado && graficoPeso.length > 1 && (
        <div className="card-base p-5">
          <h3 className="section-title">Evolução de Peso e % Gordura</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={graficoPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="peso" tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
              <YAxis yAxisId="gordura" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Legend />
              <Line yAxisId="peso" type="monotone" dataKey="peso" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} name="Peso (kg)" />
              <Line yAxisId="gordura" type="monotone" dataKey="gordura" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Gordura (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && alunoSelecionado && (
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Histórico{alunoNome ? ` — ${alunoNome}` : ''}
            </h3>
            <Link
              href={`/professor/avaliacoes/nova?aluno=${alunoSelecionado}`}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />Nova
            </Link>
          </div>

          {avaliacoes.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Nenhuma avaliação registrada para este aluno.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {avaliacoes.map((av, i) => (
                <div key={av.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        {i === 0 && <span className="badge-success text-xs">Mais recente</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {av.peso_kg && `Peso: ${av.peso_kg}kg`}
                        {av.imc && ` · IMC: ${av.imc}`}
                        {av.percentual_gordura && ` · Gordura: ${av.percentual_gordura}%`}
                      </p>
                      {av.medidas && (
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {av.medidas.cintura && <span className="text-xs text-gray-400">Cintura: {av.medidas.cintura}cm</span>}
                          {av.medidas.abdomen && <span className="text-xs text-gray-400">Abdômen: {av.medidas.abdomen}cm</span>}
                          {av.medidas.braco_direito && <span className="text-xs text-gray-400">Braço: {av.medidas.braco_direito}cm</span>}
                        </div>
                      )}
                      {av.observacoes && (
                        <p className="text-xs text-gray-500 italic mt-1">"{av.observacoes}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!alunoSelecionado && !loading && (
        <div className="card-base p-12 text-center">
          <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Selecione um aluno para ver o histórico</p>
          <Link href="/professor/avaliacoes/nova" className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />Nova Avaliação
          </Link>
        </div>
      )}
    </div>
  )
}
