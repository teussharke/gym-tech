'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Loader2, Plus, Calendar, Camera, Trash2, ImageOff } from 'lucide-react'
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
  massa_magra_kg: number | null
  massa_gorda_kg: number | null
  metabolismo_basal: number | null
  agua_corporal: number | null
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

function getIMCLabel(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25)   return { label: 'Normal',         color: 'text-green-500' }
  if (imc < 30)   return { label: 'Sobrepeso',      color: 'text-yellow-500' }
  return              { label: 'Obesidade',          color: 'text-red-500' }
}

type Tab = 'resumo' | 'graficos' | 'historico' | 'fotos'

interface FotoProgresso {
  id: string
  url: string
  tipo: string | null
  data_foto: string
  observacoes: string | null
}

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
  const [objetivoAluno, setObjetivoAluno] = useState('')
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false)
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAvaliacao[]>([])
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false)
  const [ultimaAvaliacaoDias, setUltimaAvaliacaoDias] = useState<number | null>(null)
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [fotos, setFotos] = useState<FotoProgresso[]>([])
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoTipo, setFotoTipo] = useState<string>('frente')
  const [fotoViewer, setFotoViewer] = useState<FotoProgresso | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

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
    if (!alunoId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('avaliacoes_fisicas')
        .select(`
          id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura,
          massa_magra_kg, massa_gorda_kg, metabolismo_basal, agua_corporal,
          observacoes,
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

  const fetchFotos = useCallback(async () => {
    if (!alunoId) return
    const { data } = await supabase
      .from('fotos_progresso')
      .select('id, url, tipo, data_foto, observacoes')
      .eq('aluno_id', alunoId)
      .order('data_foto', { ascending: false })
    setFotos((data as FotoProgresso[]) ?? [])
  }, [alunoId])

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !alunoId) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Foto deve ter no máximo 10MB'); return }
    setUploadingFoto(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${alunoId}/${Date.now()}_${fotoTipo}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('fotos-progresso')
        .upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('fotos-progresso').getPublicUrl(path)
      const { error: dbErr } = await supabase.from('fotos_progresso').insert({
        aluno_id: alunoId,
        url: urlData.publicUrl,
        tipo: fotoTipo,
        data_foto: new Date().toISOString().split('T')[0],
      })
      if (dbErr) throw dbErr
      toast.success('Foto enviada!')
      fetchFotos()
    } catch (err) {
      toast.error('Erro ao enviar foto')
      console.error(err)
    } finally {
      setUploadingFoto(false)
      if (fotoInputRef.current) fotoInputRef.current.value = ''
    }
  }

  const excluirFoto = async (foto: FotoProgresso) => {
    try {
      // Extrair path do storage a partir da URL pública
      const url = new URL(foto.url)
      const parts = url.pathname.split('/fotos-progresso/')
      if (parts[1]) {
        await supabase.storage.from('fotos-progresso').remove([parts[1]])
      }
      await supabase.from('fotos_progresso').delete().eq('id', foto.id)
      setFotos(prev => prev.filter(f => f.id !== foto.id))
      if (fotoViewer?.id === foto.id) setFotoViewer(null)
      toast.success('Foto excluída')
    } catch { toast.error('Erro ao excluir foto') }
  }

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
      fetchFotos()
    }
  }, [alunoId, fetchAvaliacoes, fetchSolicitacoes, fetchFotos])
  useEffect(() => { if (showModalSolicitacao) fetchHorarios() }, [showModalSolicitacao, fetchHorarios])

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
    massaMagra: a.massa_magra_kg,
    massaGorda: a.massa_gorda_kg,
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
    { key: 'fotos',     label: '📸 Fotos'  },
  ]

  const TIPOS_FOTO = [
    { value: 'frente',           label: 'Frente'       },
    { value: 'costas',           label: 'Costas'       },
    { value: 'lateral_esquerda', label: 'Lateral E.'   },
    { value: 'lateral_direita',  label: 'Lateral D.'   },
    { value: 'outro',            label: 'Outro'        },
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
      <div>
        <h1 className="page-title">Minhas Avaliações</h1>
        <p className="page-subtitle">{avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''}</p>
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

            {/* Composição corporal */}
            {(ultima.massa_magra_kg || ultima.massa_gorda_kg || ultima.metabolismo_basal) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Composição Corporal</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Massa Magra', value: ultima.massa_magra_kg ? `${ultima.massa_magra_kg}kg` : null, color: 'text-green-500', delta: diff(ultima.massa_magra_kg, penultima?.massa_magra_kg), invertDelta: true },
                    { label: 'Massa Gorda', value: ultima.massa_gorda_kg ? `${ultima.massa_gorda_kg}kg` : null, color: 'text-red-400', delta: diff(ultima.massa_gorda_kg, penultima?.massa_gorda_kg), invertDelta: false },
                    { label: 'TMB', value: ultima.metabolismo_basal ? `${ultima.metabolismo_basal}kcal` : null, color: 'text-blue-400', delta: diff(ultima.metabolismo_basal, penultima?.metabolismo_basal), invertDelta: true },
                    { label: 'Água Corporal', value: ultima.agua_corporal ? `${ultima.agua_corporal}kg` : null, color: 'text-cyan-400', delta: diff(ultima.agua_corporal, penultima?.agua_corporal), invertDelta: true },
                  ].filter(x => x.value).map(item => (
                    <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                      {item.delta != null && item.delta !== 0 && (
                        <p className={`text-xs font-medium mt-1 flex items-center justify-center gap-0.5 ${
                          (item.invertDelta ? item.delta > 0 : item.delta < 0) ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.delta)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Barra visual de composição */}
                {ultima.massa_magra_kg && ultima.massa_gorda_kg && ultima.peso_kg && (
                  <div className="space-y-1.5">
                    <div className="flex rounded-full overflow-hidden h-4">
                      <div className="bg-green-500 flex items-center justify-center"
                        style={{ width: `${(ultima.massa_magra_kg / ultima.peso_kg) * 100}%` }}>
                        <span className="text-[9px] font-bold text-white">{((ultima.massa_magra_kg / ultima.peso_kg) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="bg-red-400 flex items-center justify-center"
                        style={{ width: `${(ultima.massa_gorda_kg / ultima.peso_kg) * 100}%` }}>
                        <span className="text-[9px] font-bold text-white">{((ultima.massa_gorda_kg / ultima.peso_kg) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Massa Magra</span>
                      <span>Massa Gorda</span>
                    </div>
                  </div>
                )}
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

              {graficoData.some(d => d.massaMagra || d.massaGorda) && (
                <div className="card-base p-5">
                  <h3 className="section-title">Composição Corporal</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graficoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="massaMagra" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Massa Magra (kg)" />
                      <Line type="monotone" dataKey="massaGorda" stroke="#f87171" strokeWidth={2.5} dot={{ r: 4 }} name="Massa Gorda (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

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
                        { label: 'M. Magra',  value: av.massa_magra_kg ? `${av.massa_magra_kg}kg` : null },
                        { label: 'M. Gorda',  value: av.massa_gorda_kg ? `${av.massa_gorda_kg}kg` : null },
                        { label: 'TMB',       value: av.metabolismo_basal ? `${av.metabolismo_basal}kcal` : null },
                        { label: 'Água',      value: av.agua_corporal ? `${av.agua_corporal}kg` : null },
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

      {/* ── FOTOS DE PROGRESSO ── */}
      {activeTab === 'fotos' && (
        <div className="space-y-4">
          {/* Viewer de foto em tela cheia */}
          {fotoViewer && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
              onClick={() => setFotoViewer(null)}>
              <img src={fotoViewer.url} alt={fotoViewer.tipo ?? 'Foto'}
                className="max-h-[80vh] max-w-full rounded-xl object-contain" />
              <div className="mt-3 flex items-center gap-3">
                <span className="text-white text-sm capitalize">{fotoViewer.tipo?.replace(/_/g,' ')} — {new Date(fotoViewer.data_foto).toLocaleDateString('pt-BR')}</span>
                <button onClick={e => { e.stopPropagation(); excluirFoto(fotoViewer) }}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm bg-red-900/30 px-3 py-1.5 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          )}

          {/* Upload */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-500" /> Adicionar Foto de Progresso
            </h3>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_FOTO.map(t => (
                <button key={t.value} onClick={() => setFotoTipo(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    fotoTipo === t.value
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            <input ref={fotoInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={uploadFoto} />
            <button
              onClick={() => fotoInputRef.current?.click()}
              disabled={uploadingFoto}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              {uploadingFoto
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><Camera className="w-4 h-4" /> Tirar / Escolher Foto ({TIPOS_FOTO.find(t => t.value === fotoTipo)?.label})</>
              }
            </button>
          </div>

          {/* Galeria */}
          {fotos.length === 0 ? (
            <div className="card-base p-12 text-center space-y-3">
              <ImageOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm">Nenhuma foto de progresso ainda.</p>
              <p className="text-gray-400 text-xs">Registre fotos para acompanhar sua evolução visual!</p>
            </div>
          ) : (
            <div className="card-base p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Galeria ({fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map(foto => (
                  <button key={foto.id} onClick={() => setFotoViewer(foto)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                    <img src={foto.url} alt={foto.tipo ?? 'Foto'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <span className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded capitalize">
                      {foto.tipo?.replace(/_/g,' ') ?? 'foto'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
