'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, Plus, Eye, Clock, CheckCircle2, Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface Anamnese {
  id: string
  status: 'pendente' | 'respondida'
  created_at: string
  respondida_em: string | null
  objetivo: string | null
  nivel_atividade: string | null
  tem_lesoes: boolean | null
  descricao_lesoes: string | null
  doencas_preexistentes: string | null
  medicamentos: string | null
  cirurgias: string | null
  horas_sono: number | null
  nivel_stress: number | null
  consome_alcool: boolean | null
  fumante: boolean | null
  restricoes_alimentares: string | null
  observacoes: string | null
  aluno: {
    id: string
    usuario: { nome: string } | null
  } | null
}

interface AlunoSimples { id: string; nome: string; alunoId: string }

const NIVEL_ATIVIDADE_LABELS: Record<string, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve (1-2x/semana)',
  moderado: 'Moderado (3-4x/semana)',
  intenso: 'Intenso (5+x/semana)',
}

const OBJETIVO_OPTIONS = [
  'Perda de peso', 'Ganho de massa muscular', 'Condicionamento físico',
  'Saúde e bem-estar', 'Reabilitação', 'Esporte de performance', 'Outro'
]

function AnamneseDetalhe({ a, onClose }: { a: Anamnese; onClose: () => void }) {
  const Row = ({ label, value }: { label: string; value: string | null | boolean | number }) => {
    const display = value === null || value === '' ? '—'
      : typeof value === 'boolean' ? (value ? 'Sim' : 'Não')
        : String(value)
    if (display === '—') return null
    return (
      <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs text-gray-900 dark:text-gray-100 font-semibold">{display}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 lg:items-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 rounded-t-3xl">
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100">
              {(a.aluno?.usuario as unknown as { nome: string } | null)?.nome ?? 'Aluno'}
            </h3>
            <p className="text-xs text-gray-400">Anamnese respondida em {a.respondida_em
              ? new Date(a.respondida_em).toLocaleDateString('pt-BR')
              : '—'
            }</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-1">
          <Row label="Objetivo" value={a.objetivo} />
          <Row label="Nível de atividade" value={a.nivel_atividade ? NIVEL_ATIVIDADE_LABELS[a.nivel_atividade] ?? a.nivel_atividade : null} />
          <Row label="Possui lesões" value={a.tem_lesoes} />
          <Row label="Descrição das lesões" value={a.descricao_lesoes} />
          <Row label="Doenças preexistentes" value={a.doencas_preexistentes} />
          <Row label="Medicamentos" value={a.medicamentos} />
          <Row label="Cirurgias" value={a.cirurgias} />
          <Row label="Horas de sono/noite" value={a.horas_sono !== null ? `${a.horas_sono}h` : null} />
          <Row label="Nível de estresse (1-5)" value={a.nivel_stress} />
          <Row label="Consome álcool" value={a.consome_alcool} />
          <Row label="Fumante" value={a.fumante} />
          <Row label="Restrições alimentares" value={a.restricoes_alimentares} />
          <Row label="Observações do aluno" value={a.observacoes} />
        </div>
      </div>
    </div>
  )
}

export default function AnamnesesPage() {
  const { usuario } = useAuth()
  const [anamneses, setAnamneses] = useState<Anamnese[]>([])
  const [alunos, setAlunos] = useState<AlunoSimples[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [viewAnamnese, setViewAnamnese] = useState<Anamnese | null>(null)
  const [tab, setTab] = useState<'respondidas' | 'pendentes'>('respondidas')

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const [{ data: aData }, { data: uData }] = await Promise.all([
        supabase
          .from('anamneses')
          .select(`
            id, status, created_at, respondida_em,
            objetivo, nivel_atividade, tem_lesoes, descricao_lesoes,
            doencas_preexistentes, medicamentos, cirurgias,
            horas_sono, nivel_stress, consome_alcool, fumante,
            restricoes_alimentares, observacoes,
            aluno:alunos (id, usuario:usuarios (nome))
          `)
          .eq('academia_id', usuario.academia_id)
          .order('created_at', { ascending: false }),

        supabase
          .from('alunos')
          .select('id, usuario:usuarios (id, nome)')
          .eq('academia_id', usuario.academia_id)
          .eq('usuarios.status', 'ativo'),
      ])

      setAnamneses((aData ?? []) as unknown as Anamnese[])

      const alunosList: AlunoSimples[] = (uData ?? []).map((a: unknown) => {
        const row = a as { id: string; usuario: { id: string; nome: string } | null }
        return { alunoId: row.id, id: row.usuario?.id ?? '', nome: row.usuario?.nome ?? 'Aluno' }
      }).filter(a => a.nome)
      setAlunos(alunosList)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const enviarSolicitacao = async () => {
    if (!selectedAluno || !usuario?.academia_id) return
    setSending(true)
    try {
      // Verificar se já existe anamnese pendente para este aluno
      const { data: existe } = await supabase
        .from('anamneses')
        .select('id')
        .eq('aluno_id', selectedAluno)
        .eq('status', 'pendente')
        .maybeSingle()

      if (existe) { toast.error('Este aluno já tem uma anamnese pendente'); return }

      const { error } = await supabase.from('anamneses').insert({
        academia_id: usuario.academia_id,
        aluno_id: selectedAluno,
        status: 'pendente',
      })
      if (error) throw error
      toast.success('Solicitação enviada! O aluno verá ao abrir o app.')
      setShowForm(false)
      setSelectedAluno('')
      fetchDados()
    } catch { toast.error('Erro ao enviar solicitação') }
    finally { setSending(false) }
  }

  const statusFiltro: 'pendente' | 'respondida' = tab === 'pendentes' ? 'pendente' : 'respondida'
  const filtradas = anamneses
    .filter(a => a.status === statusFiltro)
    .filter(a => {
      const nome = (a.aluno?.usuario as unknown as { nome: string } | null)?.nome ?? ''
      return nome.toLowerCase().includes(search.toLowerCase())
    })

  const pendentes = anamneses.filter(a => a.status === 'pendente').length
  const respondidas = anamneses.filter(a => a.status === 'respondida').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center animate-float">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-400 text-sm">Carregando anamneses...</p>
      </div>
    </div>
  )

  return (
    <>
      {viewAnamnese && <AnamneseDetalhe a={viewAnamnese} onClose={() => setViewAnamnese(null)} />}

      <div className="max-w-2xl mx-auto space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Anamnese Digital</h1>
            <p className="text-gray-500 text-sm mt-1">Histórico de saúde e objetivos dos alunos</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2.5 flex items-center gap-2 text-sm font-bold flex-shrink-0">
            <Plus className="w-4 h-4" />
            Solicitar
          </button>
        </div>

        {/* Formulário de solicitação */}
        {showForm && (
          <div className="card-base p-5 space-y-4 border-2 border-orange-200 dark:border-orange-900">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Solicitar anamnese</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Selecionar aluno</label>
              <select value={selectedAluno} onChange={e => setSelectedAluno(e.target.value)}
                className="input-base w-full">
                <option value="">— Escolha um aluno —</option>
                {alunos.map(a => (
                  <option key={a.alunoId} value={a.alunoId}>{a.nome}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400">
              O aluno receberá um questionário de saúde para preencher. Você verá as respostas aqui.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">Cancelar</button>
              <button onClick={enviarSolicitacao} disabled={!selectedAluno || sending}
                className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold">
                {sending ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(['respondidas', 'pendentes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                tab === t
                  ? 'gradient-orange text-white shadow-sm shadow-orange-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}>
              {t === 'respondidas' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {t === 'respondidas' ? `Respondidas (${respondidas})` : `Pendentes (${pendentes})`}
            </button>
          ))}
        </div>

        {/* Search */}
        {filtradas.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="input-base w-full pl-9 text-sm" />
          </div>
        )}

        {/* Lista */}
        {filtradas.length === 0 ? (
          <div className="card-base p-12 text-center">
            <div className="text-5xl mb-4 animate-float">
              {tab === 'pendentes' ? '✅' : '📋'}
            </div>
            <p className="text-gray-500 text-sm">
              {tab === 'pendentes'
                ? 'Nenhuma anamnese pendente.'
                : 'Nenhuma anamnese respondida ainda. Solicite para os alunos!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(a => {
              const nome = (a.aluno?.usuario as unknown as { nome: string } | null)?.nome ?? 'Aluno'
              const dataStr = tab === 'respondidas' && a.respondida_em
                ? new Date(a.respondida_em).toLocaleDateString('pt-BR')
                : new Date(a.created_at).toLocaleDateString('pt-BR')

              return (
                <div key={a.id} className="card-base p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{nome}</p>
                    <p className="text-xs text-gray-400">
                      {tab === 'respondidas' ? `Respondida em ${dataStr}` : `Solicitada em ${dataStr}`}
                    </p>
                    {a.objetivo && (
                      <p className="text-xs text-orange-500 font-medium mt-0.5">🎯 {a.objetivo}</p>
                    )}
                  </div>
                  {tab === 'respondidas' && (
                    <button onClick={() => setViewAnamnese(a)}
                      className="btn-ghost p-2 rounded-xl flex-shrink-0 text-orange-500">
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  {tab === 'pendentes' && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />Aguardando
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
