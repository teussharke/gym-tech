'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Sparkles, Loader2, Star, Plus, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MedidasCorporais {
  cintura: number | null
  abdomen: number | null
  quadril: number | null
  coxa_direita: number | null
  braco_direito: number | null
  braco_esquerdo: number | null
  coxa_esquerda: number | null
  panturrilha_direita: number | null
  ombro: number | null
  peito: number | null
}

interface Avaliacao {
  id: string
  data_avaliacao: string
  peso_kg: number | null
  altura_cm: number | null
  imc: number | null
  percentual_gordura: number | null
  observacoes: string | null
  // medidas vem como array do join
  medidas_corporais: MedidasCorporais[] | null
}

// Medidas extraídas de forma segura (o join retorna array)
function getMedidas(av: Avaliacao): MedidasCorporais | null {
  if (!av.medidas_corporais) return null
  if (Array.isArray(av.medidas_corporais) && av.medidas_corporais.length > 0) {
    return av.medidas_corporais[0]
  }
  return null
}

interface AnaliseIA {
  resumo: string
  pontos_positivos: string[]
  pontos_atencao: string[]
  recomendacoes: string[]
  ajustes_treino: string
  meta_proximos_30_dias: string
  nota_evolucao: number
}

function getIMCLabel(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25)   return { label: 'Normal',         color: 'text-green-500' }
  if (imc < 30)   return { label: 'Sobrepeso',      color: 'text-yellow-500' }
  return              { label: 'Obesidade',          color: 'text-red-500' }
}

type Tab = 'resumo' | 'graficos' | 'historico' | 'ia'

interface HorarioDisponivel {
  id: string
  data_hora: string
  duracao_min: number
}

interface SolicitacaoAvaliacao {
  id: string
  status: string
  horario_id: string | null
  observacoes_aluno: string | null
  created_at: string
  horarios_disponiveis?: { data_hora: string; duracao_min: number }
}

export default function AvaliacoesAlunoPage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('resumo')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [analiseIA, setAnaliseIA] = useState<AnaliseIA | null>(null)
  const [loadingIA, setLoadingIA] = useState(false)
  const [objetivoAluno, setObjetivoAluno] = useState('')
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false)
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAvaliacao[]>([])
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false)
  const [ultimaAvaliacaoDias, setUltimaAvaliacaoDias] = useState<number | null>(null)
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase
      .from('alunos').select('id, objetivos, academia_id').eq('usuario_id', usuario.id).single()
    if (data) {
      setAlunoId(data.id)
      setAcademiaId(data.academia_id)
      setObjetivoAluno(data.objetivos ?? '')
    }
  }, [usuario?.id])

  const fetchAvaliacoes = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('avaliacoes_fisicas')
        .select(`
          id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura, observacoes,
          medidas_corporais (
            cintura, abdomen, quadril, coxa_direita, coxa_esquerda,
            braco_direito, braco_esquerdo, panturrilha_direita, ombro, peito
          )
        `)
        .eq('aluno_id', alunoId)
        .order('data_avaliacao', { ascending: false })

      if (error) throw error
      const avs = (data as unknown as Avaliacao[]) ?? []
      setAvaliacoes(avs)

      // Verificar dias desde última avaliação
      if (avs.length > 0) {
        const ultimaData = new Date(avs[0].data_avaliacao)
        const agora = new Date()
        const dias = Math.floor((agora.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24))
        setUltimaAvaliacaoDias(dias)
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }, [alunoId])

  const fetchHorarios = useCallback(async () => {
    if (!academiaId) return
    try {
      const { data, error } = await supabase
        .from('horarios_disponiveis')
        .select('id, data_hora, duracao_min')
        .eq('academia_id', academiaId)
        .eq('disponivel', true)
        .gt('data_hora', new Date().toISOString())
        .order('data_hora', { ascending: true })

      if (error) throw error
      setHorarios((data as HorarioDisponivel[]) ?? [])
    } catch (err) {
      console.error('Erro ao buscar horários:', err)
    }
  }, [academiaId])

  const fetchSolicitacoes = useCallback(async () => {
    if (!alunoId) return
    try {
      const { data, error } = await supabase
        .from('solicitacoes_avaliacao')
        .select(`
          id, status, horario_id, observacoes_aluno, created_at,
          horarios_disponiveis (data_hora, duracao_min)
        `)
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSolicitacoes((data as unknown as SolicitacaoAvaliacao[]) ?? [])
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err)
    }
  }, [alunoId])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => {
    if (alunoId) {
      fetchAvaliacoes()
      fetchSolicitacoes()
    }
  }, [alunoId, fetchAvaliacoes, fetchSolicitacoes])
  useEffect(() => { if (showModalSolicitacao) fetchHorarios() }, [showModalSolicitacao, fetchHorarios])

  const analisarComIA = async () => {
    if (avaliacoes.length === 0) return
    setLoadingIA(true)
    setActiveTab('ia')
    try {
      const { data: historico } = await supabase
        .from('historico_treinos')
        .select('data_treino, status, duracao_min')
        .eq('aluno_id', alunoId!)
        .order('data_treino', { ascending: false })
        .limit(20)

      const avalDados = avaliacoes.slice(0, 5).map(a => {
        const m = getMedidas(a)
        return {
          data: a.data_avaliacao,
          peso: a.peso_kg,
          imc: a.imc,
          gordura: a.percentual_gordura,
          cintura: m?.cintura ?? null,
        }
      })

      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'analisar_evolucao',
          dados: {
            aluno: { nome: usuario?.nome, objetivo: objetivoAluno },
            avaliacoes: avalDados,
            historico: (historico ?? []).slice(0, 10),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnaliseIA(data.data)
    } catch (err) {
      console.error('Erro IA:', err)
    } finally {
      setLoadingIA(false)
    }
  }

  const handleSolicitarAvaliacao = async () => {
    if (!selectedHorario || !alunoId || !academiaId) {
      toast.error('Selecione um horário')
      return
    }

    // Buscar professor_id de um professor da academia
    try {
      const { data: prof, error: profError } = await supabase
        .from('professores')
        .select('id')
        .eq('academia_id', academiaId)
        .limit(1)
        .single()

      if (profError || !prof) {
        toast.error('Nenhum professor disponível')
        return
      }

      const { error } = await supabase.from('solicitacoes_avaliacao').insert({
        aluno_id: alunoId,
        professor_id: prof.id,
        academia_id: academiaId,
        horario_id: selectedHorario,
        status: 'pendente',
        observacoes_aluno: observacoes || null,
      })

      if (error) throw error
      toast.success('Solicitação enviada!')
      setShowModalSolicitacao(false)
      setSelectedHorario(null)
      setObservacoes('')
      fetchSolicitacoes()
    } catch (err) {
      console.error('Erro ao solicitar avaliação:', err)
      toast.error('Erro ao solicitar avaliação')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Se não tiver avaliações, mostrar section de solicitar
  if (avaliacoes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Card de solicitar avaliação */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Sua Primeira Avaliação</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Solicite uma avaliação física ao seu professor
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
          <button
            onClick={() => setShowModalSolicitacao(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Solicitar Avaliação
          </button>
        </div>

        {/* Solicitações em andamento */}
        {solicitacoes.length > 0 && (
          <div className="card-base p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Solicitações em Andamento</h3>
            <div className="space-y-3">
              {solicitacoes.map((s) => {
                const statusColor =
                  s.status === 'pendente'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : s.status === 'aprovado'
                      ? 'text-green-600 dark:text-green-400'
                      : s.status === 'recusado'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'

                return (
                  <div key={s.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Status: <span className={`font-bold ${statusColor}`}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </span>
                        </p>
                        {s.horarios_disponiveis && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(s.horarios_disponiveis.data_hora), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal de solicitação */}
        {showModalSolicitacao && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowModalSolicitacao(false)}
          >
            <div
              className="card-base p-6 w-full max-w-md rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Solicitar Avaliação</h2>

              <div className="space-y-4">
                <div>
                  <label className="label-base">Selecione um horário</label>
                  {horarios.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum horário disponível</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {horarios.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setSelectedHorario(h.id)}
                          className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                            selectedHorario === h.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <p className="font-medium">
                            {format(new Date(h.data_hora), "EEEE, d 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          <p className="text-xs opacity-75">Duração: {h.duracao_min}min</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label-base">Observações (opcional)</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Deixe alguma informação relevante..."
                    className="input-base w-full min-h-20 resize-none"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-c)',
                      color: 'var(--text-1)',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowModalSolicitacao(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSolicitarAvaliacao}
                  className="btn-primary flex-1"
                >
                  Solicitar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const ultima = avaliacoes[0]
  const penultima = avaliacoes[1]
  const ultimaMedidas = getMedidas(ultima)
  const penultimaMedidas = getMedidas(penultima ?? null as unknown as Avaliacao)
  const imcInfo = ultima.imc ? getIMCLabel(ultima.imc) : null

  const diff = (a: number | null | undefined, b: number | null | undefined) =>
    a != null && b != null ? Number((a - b).toFixed(1)) : null

  const graficoData = avaliacoes.slice().reverse().map(a => ({
    data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    peso: a.peso_kg,
    gordura: a.percentual_gordura,
    imc: a.imc,
  }))

  const medidasGrafico = avaliacoes.slice().reverse().map(a => {
    const m = getMedidas(a)
    return {
      data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      cintura: m?.cintura ?? null,
      braco: m?.braco_direito ?? null,
      coxa: m?.coxa_direita ?? null,
    }
  })

  const tabs = [
    { key: 'resumo',    label: 'Resumo'    },
    { key: 'graficos',  label: 'Evolução'  },
    { key: 'historico', label: 'Histórico' },
    { key: 'ia',        label: '🤖 IA'     },
  ]

  const medidasLabels: { key: keyof MedidasCorporais; label: string }[] = [
    { key: 'cintura',            label: 'Cintura'       },
    { key: 'abdomen',            label: 'Abdômen'       },
    { key: 'quadril',            label: 'Quadril'       },
    { key: 'peito',              label: 'Peito'         },
    { key: 'braco_direito',      label: 'Braço D.'      },
    { key: 'braco_esquerdo',     label: 'Braço E.'      },
    { key: 'coxa_direita',       label: 'Coxa D.'       },
    { key: 'coxa_esquerda',      label: 'Coxa E.'       },
    { key: 'panturrilha_direita',label: 'Panturrilha'   },
    { key: 'ombro',              label: 'Ombro'         },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Minhas Avaliações</h1>
          <p className="page-subtitle">{avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''}</p>
        </div>
        <button onClick={analisarComIA} disabled={loadingIA}
          className="btn-primary flex items-center gap-2 text-sm bg-gradient-to-r from-orange-500 to-purple-600">
          {loadingIA ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando...</> : <><Sparkles className="w-4 h-4" />Analisar com IA</>}
        </button>
      </div>

      {/* Card de solicitar nova avaliação */}
      {ultimaAvaliacaoDias !== null && ultimaAvaliacaoDias < 30 ? (
        <div className="card-base p-4 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Próxima avaliação disponível em {30 - ultimaAvaliacaoDias} dias
            {ultimaAvaliacaoDias === 0 && ' (hoje você pode solicitar!)'}
          </p>
        </div>
      ) : (
        <div className="card-base p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Solicitar Nova Avaliação</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {ultimaAvaliacaoDias ? `Última avaliação há ${ultimaAvaliacaoDias} dias atrás` : 'Nenhuma avaliação anterior'}
            </p>
          </div>
          <button
            onClick={() => setShowModalSolicitacao(true)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Solicitar
          </button>
        </div>
      )}

      {/* Modal de solicitação */}
      {showModalSolicitacao && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowModalSolicitacao(false)}
        >
          <div
            className="card-base p-6 w-full max-w-md rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Solicitar Avaliação</h2>

            <div className="space-y-4">
              <div>
                <label className="label-base">Selecione um horário</label>
                {horarios.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum horário disponível</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {horarios.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHorario(h.id)}
                        className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                          selectedHorario === h.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <p className="font-medium">
                          {format(new Date(h.data_hora), "EEEE, d 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-xs opacity-75">Duração: {h.duracao_min}min</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label-base">Observações (opcional)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Deixe alguma informação relevante..."
                  className="input-base w-full min-h-20 resize-none"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-c)',
                    color: 'var(--text-1)',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModalSolicitacao(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarAvaliacao}
                className="btn-primary flex-1"
              >
                Solicitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESUMO ── */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Última Avaliação</h3>
              <span className="text-xs text-gray-400">
                {new Date(ultima.data_avaliacao).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Dados biométricos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Peso',      value: ultima.peso_kg ? `${ultima.peso_kg}kg` : '—', delta: diff(ultima.peso_kg, penultima?.peso_kg) },
                { label: 'Altura',    value: ultima.altura_cm ? `${ultima.altura_cm}cm` : '—', delta: null },
                { label: 'IMC',       value: ultima.imc ?? '—', delta: diff(ultima.imc, penultima?.imc) },
                { label: '% Gordura', value: ultima.percentual_gordura ? `${ultima.percentual_gordura}%` : '—', delta: diff(ultima.percentual_gordura, penultima?.percentual_gordura) },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{String(item.value)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                  {item.delta != null && item.delta !== 0 && (
                    <p className={`text-xs font-medium mt-1 flex items-center justify-center gap-0.5 ${item.delta < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(item.delta)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {imcInfo && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classificação IMC</span>
                <span className={`text-sm font-bold ${imcInfo.color}`}>{imcInfo.label}</span>
              </div>
            )}

            {ultima.observacoes && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Observações do Professor</p>
                <p className="text-sm text-orange-800 dark:text-orange-300">{ultima.observacoes}</p>
              </div>
            )}
          </div>

          {/* Medidas corporais */}
          {ultimaMedidas && (
            <div className="card-base p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais (cm)</h3>
              {medidasLabels.map(({ key, label }) => {
                const atual = ultimaMedidas[key]
                const anterior = penultimaMedidas?.[key]
                if (atual == null) return null
                const delta = diff(atual, anterior)
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((atual / 120) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-12 text-right">{atual}cm</span>
                    {delta != null && delta !== 0 && (
                      <span className={`text-xs w-10 flex items-center gap-0.5 flex-shrink-0 ${delta < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GRÁFICOS ── */}
      {activeTab === 'graficos' && (
        <div className="space-y-4">
          {graficoData.length > 1 ? (
            <>
              <div className="card-base p-5">
                <h3 className="section-title">Peso e % Gordura</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={graficoData}>
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

              {medidasGrafico.some(m => m.cintura || m.braco || m.coxa) && (
                <div className="card-base p-5">
                  <h3 className="section-title">Medidas (cm)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={medidasGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="cintura" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cintura" />
                      <Line type="monotone" dataKey="braco" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Braço" />
                      <Line type="monotone" dataKey="coxa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Coxa" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="card-base p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Você precisa de pelo menos 2 avaliações para ver os gráficos.</p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {activeTab === 'historico' && (
        <div className="space-y-3">
          {avaliacoes.map((av, i) => {
            const isExpanded = expandedId === av.id
            const medidas = getMedidas(av)
            return (
              <div key={av.id} className="card-base overflow-hidden">
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : av.id)}
                >
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      {i === 0 && <span className="badge-success text-xs">Mais recente</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[
                        av.peso_kg && `${av.peso_kg}kg`,
                        av.imc && `IMC ${av.imc}`,
                        av.percentual_gordura && `${av.percentual_gordura}% gordura`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4 animate-fade-in">
                    {/* Dados biométricos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Peso',      value: av.peso_kg ? `${av.peso_kg}kg` : null },
                        { label: 'Altura',    value: av.altura_cm ? `${av.altura_cm}cm` : null },
                        { label: 'IMC',       value: av.imc ? String(av.imc) : null },
                        { label: '% Gordura', value: av.percentual_gordura ? `${av.percentual_gordura}%` : null },
                      ].filter(x => x.value).map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</p>
                          <p className="text-xs text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Medidas corporais — renderizado com segurança, sem passar objeto como filho */}
                    {medidas && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Medidas corporais</p>
                        <div className="grid grid-cols-3 gap-2">
                          {medidasLabels.map(({ key, label }) => {
                            const val = medidas[key]
                            if (val == null) return null
                            return (
                              <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 text-center">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val}cm</p>
                                <p className="text-xs text-gray-400">{label}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {av.observacoes && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Observações</p>
                        <p className="text-sm text-orange-800 dark:text-orange-300">{av.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── IA ── */}
      {activeTab === 'ia' && (
        <div className="space-y-4">
          {loadingIA ? (
            <div className="card-base p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Analisando sua evolução...</p>
                <p className="text-sm text-gray-400 mt-1">A IA está processando seus dados</p>
              </div>
            </div>
          ) : analiseIA ? (
            <div className="space-y-4 animate-fade-in">
              <div className="card-base p-5 bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />Análise da IA
                  </h3>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < analiseIA.nota_evolucao ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{analiseIA.nota_evolucao}/10</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analiseIA.resumo}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-base p-4 space-y-2">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm">✅ Pontos positivos</h4>
                  <ul className="space-y-1.5">
                    {analiseIA.pontos_positivos?.map((p, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-base p-4 space-y-2">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">⚠️ Pontos de atenção</h4>
                  <ul className="space-y-1.5">
                    {analiseIA.pontos_atencao?.map((p, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {analiseIA.ajustes_treino && (
                <div className="card-base p-4 bg-orange-50 dark:bg-orange-900/20">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400 text-sm mb-2">🏋️ Ajustes no Treino</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-300">{analiseIA.ajustes_treino}</p>
                </div>
              )}

              {analiseIA.meta_proximos_30_dias && (
                <div className="card-base p-4 bg-purple-50 dark:bg-purple-900/20">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400 text-sm mb-2">🎯 Meta dos próximos 30 dias</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-300">{analiseIA.meta_proximos_30_dias}</p>
                </div>
              )}

              <button onClick={analisarComIA} disabled={loadingIA} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />Reanalisar
              </button>
            </div>
          ) : (
            <div className="card-base p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">Análise com Inteligência Artificial</p>
              <p className="text-sm text-gray-400">Clique em "Analisar com IA" para ver sua análise personalizada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
