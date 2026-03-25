'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grip, X, Clock, Repeat, Weight, Copy, Save, ArrowLeft, Dumbbell, Search, Youtube } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { mockExercicios, grupoColors, getYouTubeSearchUrl } from '@/lib/mock/exercicios'
import toast from 'react-hot-toast'

const workoutDays = ['A', 'B', 'C', 'D', 'E', 'F', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

interface ExercicioForm {
  id: string
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

interface AlunoSimples {
  id: string
  nome: string
  matricula: string
  status: string
}

type Step = 'info' | 'exercicios'

export default function NovoTreinoPage() {
  const router = useRouter()
  const { usuario } = useAuth()
  const [step, setStep] = useState<Step>('info')
  const [alunos, setAlunos] = useState<AlunoSimples[]>([])
  const [saving, setSaving] = useState(false)
  const [showBusca, setShowBusca] = useState(false)
  const [busca, setBusca] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('Todos')
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [treino, setTreino] = useState({
    nome: '', aluno_id: '', dia_semana: 'A', objetivo: '', descricao: '',
  })

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoadingAlunos(true)
    try {
      // Busca TODOS os alunos ativos da academia (não só os do professor)
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, matricula, usuario_id')
        .eq('academia_id', usuario.academia_id)

      if (!alunosData || alunosData.length === 0) {
        setAlunos([])
        setLoadingAlunos(false)
        return
      }

      const usuarioIds = alunosData.map(a => a.usuario_id)
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, status')
        .in('id', usuarioIds)
        .eq('status', 'ativo') // Apenas ativos

      const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))

      const alunosFull: AlunoSimples[] = alunosData
        .filter(a => usuariosMap[a.usuario_id]) // só os ativos
        .map(a => ({
          id: a.id,
          nome: usuariosMap[a.usuario_id]?.nome ?? 'Sem nome',
          matricula: a.matricula ?? '—',
          status: usuariosMap[a.usuario_id]?.status ?? 'ativo',
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setAlunos(alunosFull)
    } catch (err) {
      console.error('Erro ao buscar alunos:', err)
    } finally {
      setLoadingAlunos(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const addExercicio = (ex: typeof mockExercicios[0]) => {
    setExercicios(prev => [...prev, {
      id: Date.now().toString(),
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
    }])
    setShowBusca(false)
    setBusca('')
    setGrupoFiltro('Todos')
  }

  const removeExercicio = (id: string) => setExercicios(prev => prev.filter(e => e.id !== id))

  const updateExercicio = (id: string, field: keyof ExercicioForm, value: string | number) => {
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const duplicar = (ex: ExercicioForm) => {
    setExercicios(prev => [...prev, { ...ex, id: Date.now().toString() }])
  }

  const salvar = async () => {
    if (!treino.nome || !treino.aluno_id) { toast.error('Preencha nome e aluno'); return }
    if (exercicios.length === 0) { toast.error('Adicione pelo menos 1 exercício'); return }
    if (!usuario?.academia_id || !usuario?.id) return
    setSaving(true)

    try {
      const { data: prof } = await supabase
        .from('professores').select('id').eq('usuario_id', usuario.id).single()

      if (!prof) throw new Error('Perfil de professor não encontrado')

      const { data: novoTreino, error: treinoError } = await supabase
        .from('treinos')
        .insert({
          aluno_id: treino.aluno_id,
          professor_id: prof.id,
          academia_id: usuario.academia_id,
          nome: treino.nome,
          descricao: treino.descricao || null,
          objetivo: treino.objetivo || null,
          dia_semana: treino.dia_semana || null,
          ativo: true,
        })
        .select()
        .single()

      if (treinoError) throw treinoError

      // Inserir exercícios sem vincular ao banco (mock IDs)
      // Salva as infos como JSON nas observações por enquanto
      const exerciciosInsert = exercicios.map((ex, i) => ({
        treino_id: novoTreino.id,
        exercicio_id: null,
        ordem: i,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga_sugerida: ex.carga ? Number(ex.carga) : null,
        tempo_descanso_seg: ex.descanso,
        observacoes: ex.observacoes
          ? `${ex.nome} | ${ex.observacoes}`
          : ex.nome,
      }))

      await supabase.from('treino_exercicios').insert(exerciciosInsert)

      toast.success('Treino criado com sucesso!')
      router.push('/professor/treinos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const grupos = ['Todos', ...Array.from(new Set(mockExercicios.map(e => e.grupo)))]

  const filtrados = mockExercicios.filter(e => {
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      e.grupo.toLowerCase().includes(busca.toLowerCase()) ||
      e.equipamento.toLowerCase().includes(busca.toLowerCase())
    const matchGrupo = grupoFiltro === 'Todos' || e.grupo === grupoFiltro
    return matchBusca && matchGrupo
  })

  const alunoSelecionado = alunos.find(a => a.id === treino.aluno_id)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="page-title">Criar Treino</h1><p className="page-subtitle">Monte a ficha de treino</p></div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(['info', 'exercicios'] as Step[]).map((s, i) => (
          <button key={s}
            onClick={() => step === 'exercicios' && s === 'info' && setStep('info')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              step === s
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
            {i + 1}. {s === 'info' ? 'Informações' : `Exercícios ${exercicios.length > 0 ? `(${exercicios.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Informações ── */}
      {step === 'info' && (
        <div className="card-base p-5 space-y-4">
          {/* Aluno */}
          <div>
            <label className="label-base">Aluno *</label>
            {loadingAlunos ? (
              <div className="input-base flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Carregando alunos...
              </div>
            ) : alunos.length === 0 ? (
              <div className="input-base text-amber-500 text-sm">
                Nenhum aluno ativo encontrado na academia.
              </div>
            ) : (
              <select
                value={treino.aluno_id}
                onChange={e => setTreino(p => ({ ...p, aluno_id: e.target.value }))}
                className="input-base"
              >
                <option value="">Selecionar aluno... ({alunos.length} disponíveis)</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {a.matricula}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label-base">Nome do treino *</label>
            <input
              type="text"
              value={treino.nome}
              onChange={e => setTreino(p => ({ ...p, nome: e.target.value }))}
              className="input-base"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div>
            <label className="label-base">Dia / Divisão</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {workoutDays.map(day => (
                <button key={day} type="button"
                  onClick={() => setTreino(p => ({ ...p, dia_semana: day }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    treino.dia_semana === day
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-base">Objetivo</label>
            <select
              value={treino.objetivo}
              onChange={e => setTreino(p => ({ ...p, objetivo: e.target.value }))}
              className="input-base"
            >
              <option value="">Selecionar...</option>
              {['Hipertrofia', 'Emagrecimento', 'Força', 'Resistência', 'Reabilitação', 'Condicionamento'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Observações gerais</label>
            <textarea
              value={treino.descricao}
              onChange={e => setTreino(p => ({ ...p, descricao: e.target.value }))}
              className="input-base resize-none" rows={3}
              placeholder="Observações para o aluno..."
            />
          </div>

          <button
            onClick={() => setStep('exercicios')}
            disabled={!treino.nome || !treino.aluno_id}
            className="btn-primary w-full"
          >
            Próximo: Adicionar Exercícios →
          </button>
        </div>
      )}

      {/* ── STEP 2: Exercícios ── */}
      {step === 'exercicios' && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="card-base p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{treino.nome}</p>
              <p className="text-xs text-gray-400">{alunoSelecionado?.nome} · Treino {treino.dia_semana}</p>
            </div>
            <span className="badge-info">{exercicios.length} exerc.</span>
          </div>

          {/* Lista */}
          <div className="space-y-3">
            {exercicios.map((ex, index) => (
              <div key={ex.id} className="card-base p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ex.nome}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[ex.grupo] ?? 'badge-gray'}`}>
                      {ex.grupo}
                    </span>
                  </div>
                  {/* Botão YouTube */}
                  <a
                    href={getYouTubeSearchUrl(ex.youtube_search)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost p-1.5 text-red-500 hover:text-red-600"
                    title="Ver vídeo no YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                  <button onClick={() => duplicar(ex)} className="btn-ghost p-1.5" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeExercicio(ex.id)} className="btn-ghost p-1.5 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" />Séries</label>
                    <input type="number" value={ex.series}
                      onChange={e => updateExercicio(ex.id, 'series', Number(e.target.value))}
                      className="input-base text-center" min="1" max="10" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1">Repetições</label>
                    <input type="text" value={ex.repeticoes}
                      onChange={e => updateExercicio(ex.id, 'repeticoes', e.target.value)}
                      className="input-base text-center" placeholder="10-12" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" />Carga (kg)</label>
                    <input type="text" value={ex.carga}
                      onChange={e => updateExercicio(ex.id, 'carga', e.target.value)}
                      className="input-base text-center" placeholder="—" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Descanso (s)</label>
                    <input type="number" value={ex.descanso}
                      onChange={e => updateExercicio(ex.id, 'descanso', Number(e.target.value))}
                      className="input-base text-center" min="0" step="15" />
                  </div>
                </div>

                <input type="text" value={ex.observacoes}
                  onChange={e => updateExercicio(ex.id, 'observacoes', e.target.value)}
                  className="input-base text-sm" placeholder="Observações (ex: pegada pronada, contrair no topo)..." />
              </div>
            ))}
          </div>

          {/* Adicionar */}
          <button
            onClick={() => setShowBusca(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-400 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-orange-500 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">Adicionar Exercício</span>
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={salvar} disabled={saving || exercicios.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                : <><Save className="w-4 h-4" />Salvar Treino</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Modal busca de exercícios ── */}
      {showBusca && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Adicionar Exercício</h3>
              <button onClick={() => setShowBusca(false)} className="btn-ghost p-1.5">✕</button>
            </div>

            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar exercício..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="input-base pl-9"
                  autoFocus
                />
              </div>
              {/* Filtro de grupo */}
              <div className="flex gap-1.5 flex-wrap">
                {grupos.map(g => (
                  <button key={g} onClick={() => setGrupoFiltro(g)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      grupoFiltro === g
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{filtrados.length} exercícios</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filtrados.map(ex => (
                <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* Miniatura */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {ex.gif_url ? (
                      <img src={ex.gif_url} alt={ex.nome} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => addExercicio(ex)} style={{ cursor: 'pointer' }}>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ex.nome}</p>
                    <p className="text-xs text-gray-400">{ex.grupo} · {ex.equipamento}</p>
                  </div>

                  {/* YouTube link */}
                  <a
                    href={getYouTubeSearchUrl(ex.youtube_search)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost p-1.5 text-red-500 flex-shrink-0"
                    title="Ver no YouTube"
                    onClick={e => e.stopPropagation()}
                  >
                    <Youtube className="w-4 h-4" />
                  </a>

                  <button onClick={() => addExercicio(ex)} className="btn-ghost p-1.5 text-orange-500 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
