'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import {
  Calendar, Plus, Trash2, Check, X, Clock, AlertCircle,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HorarioDisponivel {
  id: string
  data_hora: string
  duracao_min: number
  disponivel: boolean
}

interface SolicitacaoAvaliacao {
  id: string
  aluno_id: string
  status: string
  observacoes_aluno: string | null
  horario_id: string | null
  created_at: string
  alunos?: { usuarios?: { nome: string } }[]
}

type Tab = 'horarios' | 'solicitacoes'

export default function AgendaPage() {
  const { usuario } = useAuth()
  const [professorId, setProfessorId] = useState<string | null>(null)
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('horarios')
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAvaliacao[]>([])
  const [showModalHorario, setShowModalHorario] = useState(false)
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    duracao: 60,
  })
  const [expandedSolicitacao, setExpandedSolicitacao] = useState<string | null>(null)

  // Fetch professor_id
  const fetchProfessorId = useCallback(async () => {
    if (!usuario?.id) return
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('id, academia_id')
        .eq('usuario_id', usuario.id)
        .single()

      if (error) throw error
      if (data) {
        setProfessorId(data.id)
        setAcademiaId(data.academia_id)
      }
    } catch (err) {
      console.error('Erro ao buscar professor:', err)
      toast.error('Erro ao carregar dados do professor')
    } finally {
      setLoading(false)
    }
  }, [usuario?.id])

  // Fetch horários
  const fetchHorarios = useCallback(async () => {
    if (!professorId) return
    try {
      const { data, error } = await supabase
        .from('horarios_disponiveis')
        .select('*')
        .eq('professor_id', professorId)
        .order('data_hora', { ascending: true })

      if (error) throw error
      setHorarios((data as HorarioDisponivel[]) ?? [])
    } catch (err) {
      console.error('Erro ao buscar horários:', err)
    }
  }, [professorId])

  // Fetch solicitações
  const fetchSolicitacoes = useCallback(async () => {
    if (!professorId) return
    try {
      const { data, error } = await supabase
        .from('solicitacoes_avaliacao')
        .select(`
          id, aluno_id, status, observacoes_aluno, horario_id, created_at,
          alunos (
            usuarios (nome)
          )
        `)
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSolicitacoes((data as unknown as SolicitacaoAvaliacao[]) ?? [])
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err)
    }
  }, [professorId])

  useEffect(() => {
    fetchProfessorId()
  }, [fetchProfessorId])

  useEffect(() => {
    if (professorId) {
      fetchHorarios()
      fetchSolicitacoes()
    }
  }, [professorId, fetchHorarios, fetchSolicitacoes])

  // Adicionar horário
  const handleAdicionarHorario = async () => {
    if (!formData.data || !formData.hora || !professorId || !academiaId) {
      toast.error('Preencha data e hora')
      return
    }

    const dataHora = new Date(`${formData.data}T${formData.hora}`)
    if (isNaN(dataHora.getTime())) {
      toast.error('Data e hora inválidas')
      return
    }

    try {
      const { error } = await supabase.from('horarios_disponiveis').insert({
        professor_id: professorId,
        academia_id: academiaId,
        data_hora: dataHora.toISOString(),
        duracao_min: formData.duracao,
        disponivel: true,
      })

      if (error) throw error
      toast.success('Horário adicionado!')
      setFormData({ data: '', hora: '', duracao: 60 })
      setShowModalHorario(false)
      fetchHorarios()
    } catch (err) {
      console.error('Erro ao adicionar horário:', err)
      toast.error('Erro ao adicionar horário')
    }
  }

  // Deletar horário
  const handleDeletarHorario = async (id: string) => {
    if (!confirm('Deseja realmente excluir este horário?')) return

    try {
      const { error } = await supabase
        .from('horarios_disponiveis')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Horário deletado!')
      fetchHorarios()
    } catch (err) {
      console.error('Erro ao deletar horário:', err)
      toast.error('Erro ao deletar horário')
    }
  }

  // Aprovar solicitação
  const handleAprovarSolicitacao = async (solicitacaoId: string, horarioId: string | null) => {
    try {
      // Update status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes_avaliacao')
        .update({ status: 'aprovado', updated_at: new Date().toISOString() })
        .eq('id', solicitacaoId)

      if (updateError) throw updateError

      // Marcar horário como não disponível
      if (horarioId) {
        const { error: horarioError } = await supabase
          .from('horarios_disponiveis')
          .update({ disponivel: false })
          .eq('id', horarioId)

        if (horarioError) throw horarioError
      }

      toast.success('Solicitação aprovada!')
      fetchSolicitacoes()
      fetchHorarios()
    } catch (err) {
      console.error('Erro ao aprovar:', err)
      toast.error('Erro ao aprovar solicitação')
    }
  }

  // Recusar solicitação
  const handleRecusarSolicitacao = async (
    solicitacaoId: string,
    observacoes: string,
  ) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_avaliacao')
        .update({
          status: 'recusado',
          observacoes_professor: observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', solicitacaoId)

      if (error) throw error
      toast.success('Solicitação recusada!')
      fetchSolicitacoes()
    } catch (err) {
      console.error('Erro ao recusar:', err)
      toast.error('Erro ao recusar solicitação')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--neon)' }} />
      </div>
    )
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Gerencie seus horários de avaliação</p>
        </div>
        <button
          onClick={() => setShowModalHorario(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Horário
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['horarios', 'solicitacoes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            {tab === 'horarios' ? '📅 Horários' : '📋 Solicitações'}
          </button>
        ))}
      </div>

      {/* ────── HORÁRIOS ────── */}
      {activeTab === 'horarios' && (
        <div className="space-y-3">
          {horarios.length === 0 ? (
            <div className="card-base p-8 text-center" style={{ background: 'var(--bg-card)' }}>
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
              <p style={{ color: 'var(--text-2)' }}>Nenhum horário cadastrado</p>
            </div>
          ) : (
            horarios.map((h) => (
              <div
                key={h.id}
                className="card-base p-4 flex items-center justify-between"
                style={{ background: 'var(--bg-card)' }}
              >
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                    {format(new Date(h.data_hora), "EEEE, d 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Duração: {h.duracao_min}min · Status:{' '}
                    <span
                      className="font-medium"
                      style={{
                        color: h.disponivel ? 'var(--neon)' : '#ef4444',
                      }}
                    >
                      {h.disponivel ? 'Disponível' : 'Ocupado'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeletarHorario(h.id)}
                  className="btn-ghost p-2 ml-2"
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ────── SOLICITAÇÕES ────── */}
      {activeTab === 'solicitacoes' && (
        <div className="space-y-3">
          {solicitacoes.length === 0 ? (
            <div className="card-base p-8 text-center" style={{ background: 'var(--bg-card)' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
              <p style={{ color: 'var(--text-2)' }}>Nenhuma solicitação</p>
            </div>
          ) : (
            solicitacoes.map((s) => {
              const isExpanded = expandedSolicitacao === s.id
              const nomeAluno = s.alunos?.[0]?.usuarios?.nome ?? 'Aluno'
              const badgeColor =
                s.status === 'pendente'
                  ? 'var(--neon)'
                  : s.status === 'aprovado'
                    ? '#22c55e'
                    : s.status === 'recusado'
                      ? '#ef4444'
                      : 'var(--text-3)'

              return (
                <div
                  key={s.id}
                  className="card-base overflow-hidden"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <div
                    className="p-4 cursor-pointer flex items-center gap-3"
                    onClick={() => setExpandedSolicitacao(isExpanded ? null : s.id)}
                    style={{
                      borderBottom: isExpanded ? '1px solid var(--border-c)' : 'none',
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                        {nomeAluno}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                        {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: `${badgeColor}20`,
                        color: badgeColor,
                      }}
                    >
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {s.observacoes_aluno && (
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-3)' }}>
                            Observações do Aluno
                          </p>
                          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                            {s.observacoes_aluno}
                          </p>
                        </div>
                      )}

                      {s.status === 'pendente' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleAprovarSolicitacao(s.id, s.horario_id)}
                            className="btn-primary flex items-center gap-2 flex-1 text-sm"
                          >
                            <Check className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => {
                              const obs = prompt('Motivo da recusa (opcional):')
                              if (obs !== null) {
                                handleRecusarSolicitacao(s.id, obs)
                              }
                            }}
                            className="btn-secondary flex items-center gap-2 flex-1 text-sm"
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            <X className="w-4 h-4" />
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ────── MODAL NOVO HORÁRIO ────── */}
      {showModalHorario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowModalHorario(false)}
        >
          <div
            className="card-base p-6 w-full max-w-md rounded-2xl"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
              Novo Horário
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label-base">Data</label>
                <input
                  type="date"
                  min={minDate}
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="input-base w-full"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-c)',
                    color: 'var(--text-1)',
                  }}
                />
              </div>

              <div>
                <label className="label-base">Hora</label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="input-base w-full"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-c)',
                    color: 'var(--text-1)',
                  }}
                />
              </div>

              <div>
                <label className="label-base">Duração (minutos)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFormData({ ...formData, duracao: d })}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        formData.duracao === d
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModalHorario(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarHorario}
                className="btn-primary flex-1"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
