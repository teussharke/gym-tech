'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, Save, Search, Grip,
  Clock, Repeat, Weight, Youtube, Loader2, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { mockExercicios, grupoColors, getYouTubeSearchUrl } from '@/lib/mock/exercicios'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const workoutDays = ['A', 'B', 'C', 'D', 'E', 'F', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

interface ExercicioForm {
  id: string            // UUID local para controle de UI
  db_id?: string        // ID real no banco (treino_exercicios.id)
  exercicio_id: string
  nome: string
  grupo: string
  gif_url?: string
  youtube_search: string
  series: number
  repeticoes: string
  carga: string
  descanso: number
  observacoes: string
}

export default function EditarTreinoPage() {
  const router = useRouter()
  const params = useParams()
  const treinoId = params.id as string
  const { usuario } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showBusca, setShowBusca] = useState(false)
  const [busca, setBusca] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('Todos')
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([])
  const [expandido, setExpandido] = useState<string | null>(null)
  const [nomeAluno, setNomeAluno] = useState('')

  const [treino, setTreino] = useState({
    nome: '',
    aluno_id: '',
    dia_semana: 'A',
    objetivo: '',
    descricao: '',
  })

  // ── Carregar treino ──────────────────────────────────────
  const carregarTreino = useCallback(async () => {
    if (!treinoId) { setLoading(false); return }
    setLoading(true)
    try {
      // Tudo em paralelo: treino+aluno+usuario JOIN + exercicios em paralelo
      const [tResult, exResult] = await Promise.all([
        supabase
          .from('treinos')
          .select(`
            id, nome, dia_semana, objetivo, descricao, aluno_id,
            aluno:alunos (usuario:usuarios (nome))
          `)
          .eq('id', treinoId)
          .single(),
        supabase
          .from('treino_exercicios')
          .select('id, exercicio_id, ordem, series, repeticoes, carga_sugerida, tempo_descanso_seg, observacoes')
          .eq('treino_id', treinoId)
          .order('ordem', { ascending: true }),
      ])

      const { data: t, error } = tResult
      if (error || !t) { toast.error('Treino não encontrado'); router.back(); return }

      type TreinoComAluno = typeof t & { aluno: { usuario: { nome: string } | null } | null }
      const tTyped = t as unknown as TreinoComAluno

      setTreino({
        nome: tTyped.nome ?? '',
        aluno_id: tTyped.aluno_id ?? '',
        dia_semana: tTyped.dia_semana ?? 'A',
        objetivo: tTyped.objetivo ?? '',
        descricao: tTyped.descricao ?? '',
      })
      if (tTyped.aluno?.usuario?.nome) setNomeAluno(tTyped.aluno.usuario.nome)

      const treinoExercicios = exResult.data ?? []

      if (treinoExercicios.length) {
        const exIds = treinoExercicios.map(te => te.exercicio_id).filter((id): id is string => !!id)
        const exData = exIds.length > 0
          ? (await supabase.from('exercicios').select('id, nome, grupo_muscular').in('id', exIds)).data
          : []

        const exMap = Object.fromEntries((exData ?? []).map(e => [e.id, e]))

        const forms: ExercicioForm[] = treinoExercicios.map((te, i) => {
          const dbEx = exMap[te.exercicio_id]

          // Tenta encontrar no mock por ID ou nome do banco
          const mock = mockExercicios.find(m =>
            m.id === te.exercicio_id ||
            (dbEx?.nome && m.nome.toLowerCase() === dbEx.nome.toLowerCase())
          )

          // Nome: banco → mock → parse do campo observacoes (formato "Nome | obs")
          let nomeExercicio = dbEx?.nome ?? mock?.nome
          let obsReal = te.observacoes ?? ''
          if (!nomeExercicio && obsReal.includes(' | ')) {
            const partes = obsReal.split(' | ')
            nomeExercicio = partes[0]
            obsReal = partes.slice(1).join(' | ')
          } else if (!nomeExercicio && obsReal) {
            // observacoes contém o nome sem separador (fallback antigo)
            nomeExercicio = obsReal
            obsReal = ''
          }
          nomeExercicio = nomeExercicio ?? 'Exercício'

          // Tenta encontrar no mock pelo nome para obter grupo/gif
          const mockByName = !mock
            ? mockExercicios.find(m => m.nome.toLowerCase() === nomeExercicio!.toLowerCase())
            : mock

          return {
            id: `ex-${i}-${Date.now()}`,
            db_id: te.id,
            exercicio_id: te.exercicio_id ?? '',
            nome: nomeExercicio,
            grupo: dbEx?.grupo_muscular ?? mockByName?.grupo ?? 'Outros',
            gif_url: mockByName?.gif_url,
            youtube_search: mockByName?.youtube_search ?? nomeExercicio,
            series: te.series ?? 3,
            repeticoes: String(te.repeticoes ?? '10-12'),
            carga: te.carga_sugerida ? String(te.carga_sugerida) : '',
            descanso: te.tempo_descanso_seg ?? 60,
            observacoes: obsReal,
          }
        })
        setExercicios(forms)
      }
    } catch {
      toast.error('Erro ao carregar treino')
    } finally {
      setLoading(false)
    }
  }, [treinoId, router])

  useEffect(() => { carregarTreino() }, [carregarTreino])

  // ── Adicionar exercício ──────────────────────────────────
  const adicionarExercicio = (ex: typeof mockExercicios[0]) => {
    const novo: ExercicioForm = {
      id: `new-${Date.now()}`,
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo: ex.grupo,
      gif_url: ex.gif_url,
      youtube_search: ex.youtube_search,
      series: 3,
      repeticoes: '10-12',
      carga: '',
      descanso: 60,
      observacoes: '',
    }
    setExercicios(prev => [...prev, novo])
    setExpandido(novo.id)
    setShowBusca(false)
    setBusca('')
  }

  const removerExercicio = (id: string) => setExercicios(prev => prev.filter(e => e.id !== id))

  const atualizarExercicio = (id: string, campo: keyof ExercicioForm, valor: string | number) =>
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, [campo]: valor } : e))

  // ── Salvar ───────────────────────────────────────────────
  const salvar = async () => {
    if (!treino.nome) { toast.error('Informe o nome do treino'); return }
    if (exercicios.length === 0) { toast.error('Adicione pelo menos 1 exercício'); return }
    setSaving(true)

    try {
      // 1. Atualizar dados básicos do treino
      const { error: treinoError } = await supabase
        .from('treinos')
        .update({
          nome: treino.nome,
          dia_semana: treino.dia_semana || null,
          objetivo: treino.objetivo || null,
          descricao: treino.descricao || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', treinoId)

      if (treinoError) throw treinoError

      // 2. Deletar todos os exercícios antigos e reinserir
      await supabase.from('treino_exercicios').delete().eq('treino_id', treinoId)

      // 3. Inserir exercícios atualizados
      // Nota: exercicio_id é omitido (nullable na tabela) — os IDs dos
      // exercícios mock não são UUIDs válidos, então armazenamos o nome
      // nas observacoes no formato "Nome | Observações"
      const inserts = exercicios.map((ex, i) => ({
        treino_id: treinoId,
        ordem: i + 1,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga_sugerida: ex.carga ? Number(ex.carga) : null,
        tempo_descanso_seg: ex.descanso,
        observacoes: ex.observacoes
          ? `${ex.nome} | ${ex.observacoes}`
          : ex.nome,
      }))

      const { error: exError } = await supabase.from('treino_exercicios').insert(inserts)
      if (exError) throw new Error(`Erro ao salvar exercícios: ${exError.message}`)

      toast.success('Treino atualizado com sucesso! ✅')
      router.push('/professor/treinos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // ── Filtro de busca ──────────────────────────────────────
  const grupos = ['Todos', ...new Set(mockExercicios.map(e => e.grupo))]
  const exerciciosFiltrados = mockExercicios.filter(e => {
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase()) || e.grupo.toLowerCase().includes(busca.toLowerCase())
    const matchGrupo = grupoFiltro === 'Todos' || e.grupo === grupoFiltro
    return matchBusca && matchGrupo
  })

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--neon)', boxShadow: '0 0 20px var(--neon-glow)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Carregando treino...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">Editar Treino</h1>
          {nomeAluno && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--neon)' }}>
              Aluno: {nomeAluno}
            </p>
          )}
        </div>
        <button onClick={salvar} disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
            : <><Save className="w-4 h-4" />Salvar</>
          }
        </button>
      </div>

      {/* ── Dados do treino ── */}
      <div className="card-base p-5 space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Informações do Treino</h2>

        <div>
          <label className="label-base">Nome do Treino *</label>
          <input value={treino.nome} onChange={e => setTreino(p => ({ ...p, nome: e.target.value }))}
            placeholder="Ex: Treino A — Peito e Tríceps"
            className="input-base" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">Divisão / Dia</label>
            <select value={treino.dia_semana}
              onChange={e => setTreino(p => ({ ...p, dia_semana: e.target.value }))}
              className="input-base"
              style={{ background: 'var(--bg-input)' }}>
              {workoutDays.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Objetivo</label>
            <input value={treino.objetivo}
              onChange={e => setTreino(p => ({ ...p, objetivo: e.target.value }))}
              placeholder="Ex: Hipertrofia"
              className="input-base" />
          </div>
        </div>

        <div>
          <label className="label-base">Observações</label>
          <textarea value={treino.descricao}
            onChange={e => setTreino(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Observações gerais sobre o treino..."
            rows={2}
            className="input-base resize-none" />
        </div>
      </div>

      {/* ── Lista de Exercícios ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
            Exercícios <span style={{ color: 'var(--neon)' }}>({exercicios.length})</span>
          </h2>
          <button onClick={() => setShowBusca(true)}
            className="btn-primary flex items-center gap-2 text-xs px-3 py-2">
            <Plus className="w-3.5 h-3.5" />Adicionar
          </button>
        </div>

        {exercicios.length === 0 && (
          <div className="card-base p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Nenhum exercício ainda.</p>
            <button onClick={() => setShowBusca(true)}
              className="btn-primary text-sm mt-3 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />Adicionar exercício
            </button>
          </div>
        )}

        {exercicios.map((ex, idx) => {
          const isOpen = expandido === ex.id
          return (
            <div key={ex.id} className="card-base overflow-hidden transition-all">
              {/* Linha principal */}
              <div className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandido(isOpen ? null : ex.id)}>
                <Grip className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'var(--bg-chip)', color: 'var(--neon)' }}>
                  {idx + 1}
                </div>
                {ex.gif_url && (
                  <img src={ex.gif_url} alt={ex.nome}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    style={{ border: '1px solid var(--border-c)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{ex.nome}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {ex.series}x{ex.repeticoes}
                    {ex.carga ? ` · ${ex.carga}kg` : ''}
                    {' · '}{ex.descanso}s
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--bg-chip)', color: 'var(--text-2)' }}>
                  {ex.grupo}
                </span>
                <button onClick={e => { e.stopPropagation(); removerExercicio(ex.id) }}
                  className="btn-ghost p-1.5 flex-shrink-0" style={{ color: '#f87171' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Detalhes expansíveis */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-3 gap-3 pt-3">
                    {/* Séries */}
                    <div>
                      <label className="label-base flex items-center gap-1">
                        <Repeat className="w-3 h-3" />Séries
                      </label>
                      <input type="number" min="1" max="20"
                        value={ex.series}
                        onChange={e => atualizarExercicio(ex.id, 'series', Number(e.target.value))}
                        className="input-base text-center" />
                    </div>
                    {/* Repetições */}
                    <div>
                      <label className="label-base">Reps</label>
                      <input type="text" placeholder="10-12"
                        value={ex.repeticoes}
                        onChange={e => atualizarExercicio(ex.id, 'repeticoes', e.target.value)}
                        className="input-base text-center" />
                    </div>
                    {/* Descanso */}
                    <div>
                      <label className="label-base flex items-center gap-1">
                        <Clock className="w-3 h-3" />Desc.(s)
                      </label>
                      <input type="number" min="0" step="5"
                        value={ex.descanso}
                        onChange={e => atualizarExercicio(ex.id, 'descanso', Number(e.target.value))}
                        className="input-base text-center" />
                    </div>
                  </div>

                  {/* Carga */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base flex items-center gap-1">
                        <Weight className="w-3 h-3" />Carga (kg)
                      </label>
                      <input type="text" placeholder="Opcional"
                        value={ex.carga}
                        onChange={e => atualizarExercicio(ex.id, 'carga', e.target.value)}
                        className="input-base" />
                    </div>
                    {/* YouTube */}
                    <div>
                      <label className="label-base">Vídeo</label>
                      <a href={getYouTubeSearchUrl(ex.youtube_search)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <Youtube className="w-4 h-4" />Ver no YouTube
                      </a>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="label-base">Observações</label>
                    <input type="text" placeholder="Ex: Foco na contração..."
                      value={ex.observacoes}
                      onChange={e => atualizarExercicio(ex.id, 'observacoes', e.target.value)}
                      className="input-base" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Botão salvar final ── */}
      {exercicios.length > 0 && (
        <button onClick={salvar} disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
          {saving
            ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando alterações...</>
            : <><Save className="w-5 h-5" />Salvar Alterações</>
          }
        </button>
      )}

      {/* ── Modal de Busca de Exercícios ── */}
      {showBusca && (
        <div className="fixed inset-0 z-50 flex flex-col modal-backdrop">
          <div className="flex-1 flex flex-col bg-transparent" onClick={() => setShowBusca(false)} />
          <div className="modal-card rounded-t-3xl rounded-b-none w-full max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-c)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
              <input autoFocus
                type="text" placeholder="Buscar exercício..."
                value={busca} onChange={e => setBusca(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--text-1)' }} />
              <button onClick={() => setShowBusca(false)} className="btn-ghost p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filtros de grupo */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--border)' }}>
              {grupos.map(g => (
                <button key={g} onClick={() => setGrupoFiltro(g)}
                  className={clsx('text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all',
                    grupoFiltro === g
                      ? 'text-black'
                      : ''
                  )}
                  style={grupoFiltro === g
                    ? { background: 'var(--neon)', boxShadow: '0 0 10px var(--neon-glow)' }
                    : { background: 'var(--bg-chip)', color: 'var(--text-2)' }
                  }>
                  {g}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y"
              style={{ borderColor: 'var(--border)' }}>
              {exerciciosFiltrados.map(ex => (
                <button key={ex.id} onClick={() => adicionarExercicio(ex)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-h)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {ex.gif_url && (
                    <img src={ex.gif_url} alt={ex.nome}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{ex.nome}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{ex.equipamento}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full flex-shrink-0', grupoColors[ex.grupo] ?? 'badge-gray')}>
                    {ex.grupo}
                  </span>
                  <Plus className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--neon)' }} />
                </button>
              ))}
              {exerciciosFiltrados.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>Nenhum exercício encontrado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
