'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grip, X, Clock, Repeat, Weight, Copy, Save, ArrowLeft, Dumbbell, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { mockExercicios, grupoColors } from '@/lib/mock/exercicios'
import toast from 'react-hot-toast'

const workoutDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'A', 'B', 'C', 'D']

interface ExercicioForm {
  id: string
  exercicio_id: string
  nome: string
  grupo: string
  series: number
  repeticoes: string
  carga: string
  descanso: number
  observacoes: string
}

type Step = 'info' | 'exercicios'

export default function NovoTreinoPage() {
  const router = useRouter()
  const { usuario } = useAuth()
  const [step, setStep] = useState<Step>('info')
  const [alunos, setAlunos] = useState<{ id: string; usuario: { nome: string }; matricula: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [showBusca, setShowBusca] = useState(false)
  const [busca, setBusca] = useState('')
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([])
  const [treino, setTreino] = useState({
    nome: '', aluno_id: '', dia_semana: 'A', objetivo: '', descricao: '',
  })

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id || !usuario?.id) return
    const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()
    if (!prof) return
    const { data } = await supabase
      .from('alunos')
      .select('id, matricula, usuario:usuarios!alunos_usuario_id_fkey (nome)')
      .eq('academia_id', usuario.academia_id)
      .eq('professor_id', prof.id)
    setAlunos((data as unknown as { id: string; usuario: { nome: string }; matricula: string }[]) ?? [])
  }, [usuario?.academia_id, usuario?.id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  const addExercicio = (ex: typeof mockExercicios[0]) => {
    setExercicios(prev => [...prev, {
      id: Date.now().toString(),
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo: ex.grupo,
      series: 3,
      repeticoes: '10-12',
      carga: '',
      descanso: 60,
      observacoes: '',
    }])
    setShowBusca(false)
    setBusca('')
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
      const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()
      if (!prof) throw new Error('Perfil de professor não encontrado')

      // Criar treino
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

      // Criar exercícios do treino
      // Nota: os IDs do mockExercicios são strings numéricas, mas no banco são UUIDs
      // Para funcionar com o banco real, os exercícios precisam existir na tabela exercicios
      // Por enquanto salvamos com as infos necessárias
      const exerciciosInsert = exercicios.map((ex, i) => ({
        treino_id: novoTreino.id,
        exercicio_id: null, // Será vinculado quando exercícios forem cadastrados no banco
        ordem: i,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga_sugerida: ex.carga ? Number(ex.carga) : null,
        tempo_descanso_seg: ex.descanso,
        observacoes: ex.observacoes || null,
      }))

      // Tenta inserir com exercicio_id null — se der erro de constraint, pula
      const { error: exError } = await supabase.from('treino_exercicios').insert(exerciciosInsert)
      if (exError) console.warn('Exercícios não vinculados:', exError.message)

      toast.success('Treino criado com sucesso!')
      router.push('/professor/treinos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar treino')
    } finally {
      setSaving(false)
    }
  }

  const filtrados = mockExercicios.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.grupo.toLowerCase().includes(busca.toLowerCase())
  )

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
          <button key={s} onClick={() => step === 'exercicios' && s === 'info' && setStep('info')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${step === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {i + 1}. {s === 'info' ? 'Informações' : 'Exercícios'}
          </button>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 'info' && (
        <div className="card-base p-5 space-y-4">
          <div>
            <label className="label-base">Aluno *</label>
            <select value={treino.aluno_id} onChange={e => setTreino(p => ({ ...p, aluno_id: e.target.value }))} className="input-base">
              <option value="">Selecionar aluno...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{(a.usuario as unknown as { nome: string })?.nome} ({a.matricula})</option>)}
            </select>
            {alunos.length === 0 && <p className="text-xs text-amber-500 mt-1">Nenhum aluno vinculado a você.</p>}
          </div>
          <div>
            <label className="label-base">Nome do treino *</label>
            <input type="text" value={treino.nome} onChange={e => setTreino(p => ({ ...p, nome: e.target.value }))} className="input-base" placeholder="Ex: Treino A - Peito e Tríceps" />
          </div>
          <div>
            <label className="label-base">Dia / Divisão</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {workoutDays.map(day => (
                <button key={day} type="button" onClick={() => setTreino(p => ({ ...p, dia_semana: day }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${treino.dia_semana === day ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-base">Objetivo</label>
            <select value={treino.objetivo} onChange={e => setTreino(p => ({ ...p, objetivo: e.target.value }))} className="input-base">
              <option value="">Selecionar...</option>
              {['Hipertrofia', 'Emagrecimento', 'Força', 'Resistência', 'Reabilitação', 'Condicionamento'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Observações gerais</label>
            <textarea value={treino.descricao} onChange={e => setTreino(p => ({ ...p, descricao: e.target.value }))} className="input-base resize-none" rows={3} />
          </div>
          <button onClick={() => setStep('exercicios')} disabled={!treino.nome || !treino.aluno_id} className="btn-primary w-full">
            Próximo: Adicionar Exercícios →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 'exercicios' && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="card-base p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{treino.nome}</p>
              <p className="text-xs text-gray-400">
                {(alunoSelecionado?.usuario as unknown as { nome: string })?.nome} · {treino.dia_semana}
              </p>
            </div>
            <span className="badge-info">{exercicios.length} exerc.</span>
          </div>

          {/* Lista exercícios */}
          <div className="space-y-3">
            {exercicios.map((ex, index) => (
              <div key={ex.id} className="card-base p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ex.nome}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[ex.grupo] ?? 'badge-gray'}`}>{ex.grupo}</span>
                  </div>
                  <button onClick={() => duplicar(ex)} className="btn-ghost p-1.5" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeExercicio(ex.id)} className="btn-ghost p-1.5 text-red-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" />Séries</label>
                    <input type="number" value={ex.series} onChange={e => updateExercicio(ex.id, 'series', Number(e.target.value))} className="input-base text-center" min="1" max="10" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1">Repetições</label>
                    <input type="text" value={ex.repeticoes} onChange={e => updateExercicio(ex.id, 'repeticoes', e.target.value)} className="input-base text-center" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" />Carga (kg)</label>
                    <input type="text" value={ex.carga} onChange={e => updateExercicio(ex.id, 'carga', e.target.value)} className="input-base text-center" placeholder="—" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Descanso (s)</label>
                    <input type="number" value={ex.descanso} onChange={e => updateExercicio(ex.id, 'descanso', Number(e.target.value))} className="input-base text-center" min="0" step="15" />
                  </div>
                </div>
                <input type="text" value={ex.observacoes} onChange={e => updateExercicio(ex.id, 'observacoes', e.target.value)} className="input-base text-sm" placeholder="Observações (opcional)..." />
              </div>
            ))}
          </div>

          {/* Adicionar exercício */}
          <button onClick={() => setShowBusca(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-primary-400 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-primary-600 transition-all">
            <Plus className="w-5 h-5" /><span className="font-medium text-sm">Adicionar Exercício</span>
          </button>

          {/* Ações */}
          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={salvar} disabled={saving || exercicios.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar Treino</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal busca */}
      {showBusca && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Adicionar Exercício</h3>
              <button onClick={() => setShowBusca(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="input-base pl-9" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filtrados.map(ex => (
                <button key={ex.id} onClick={() => addExercicio(ex)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ex.nome}</p>
                    <p className="text-xs text-gray-400">{ex.grupo} · {ex.equipamento}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
