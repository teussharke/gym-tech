'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Grip, X, Clock, Repeat, Weight, Copy, Save, ArrowLeft,
  Dumbbell, Search, Youtube, Sparkles, Loader2, Send, Bot, User, Wand2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { mockExercicios, grupoColors, getYouTubeSearchUrl } from '@/lib/mock/exercicios'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const workoutDays = ['A', 'B', 'C', 'D', 'E', 'F', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

// Mapeia label de exibição → valor do enum workout_day no Postgres
const DIA_TO_ENUM: Record<string, string> = {
  'Segunda': 'segunda', 'Terça': 'terca', 'Quarta': 'quarta',
  'Quinta': 'quinta', 'Sexta': 'sexta', 'Sábado': 'sabado', 'Domingo': 'domingo',
}
const toDbDia = (dia: string) => DIA_TO_ENUM[dia] ?? dia  // A-F passam direto

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
  objetivo: string | null
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }
type Step = 'info' | 'exercicios'
type AIMode = 'none' | 'chat' | 'sugestao'

export default function NovoTreinoPage() {
  const router = useRouter()
  const { usuario, session } = useAuth()
  const [step, setStep] = useState<Step>('info')
  const [alunos, setAlunos] = useState<AlunoSimples[]>([])
  const [saving, setSaving] = useState(false)
  const [showBusca, setShowBusca] = useState(false)
  const [busca, setBusca] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('Todos')
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [aiMode, setAiMode] = useState<AIMode>('none')
  const [aiLoading, setAiLoading] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sugestaoIA, setSugestaoIA] = useState<Record<string, unknown> | null>(null)
  const [treino, setTreino] = useState({ nome: '', aluno_id: '', dia_semana: 'A', objetivo: '', descricao: '' })
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoadingAlunos(true)
    try {
      const { data: alunosData } = await supabase
        .from('alunos').select('id, matricula, usuario_id, objetivos')
        .eq('academia_id', usuario.academia_id)

      if (!alunosData?.length) { setAlunos([]); return }

      const usuarioIds = alunosData.map(a => a.usuario_id)
      const { data: usuarios } = await supabase
        .from('usuarios').select('id, nome, status').in('id', usuarioIds).eq('status', 'ativo')

      const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))

      setAlunos(alunosData
        .filter(a => usuariosMap[a.usuario_id])
        .map(a => ({
          id: a.id,
          nome: usuariosMap[a.usuario_id]?.nome ?? 'Sem nome',
          matricula: a.matricula ?? '—',
          objetivo: a.objetivos ?? null,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))
      )
    } finally { setLoadingAlunos(false) }
  }, [usuario?.academia_id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  // ── IA: Gerar treino ──────────────────────────────────
  const gerarTreinoIA = async () => {
    const aluno = alunos.find(a => a.id === treino.aluno_id)
    if (!aluno) { toast.error('Selecione um aluno primeiro'); return }
    setAiLoading(true)
    setSugestaoIA(null)
    try {
      const res = await fetch('/api/ia', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          tipo: 'sugerir_treino',
          dados: {
            aluno: {
              nome: aluno.nome,
              objetivo: treino.objetivo || aluno.objetivo || 'Hipertrofia',
              nivel: 'Intermediário',
              observacoes: treino.descricao || '',
              divisao: treino.dia_semana,
            },
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSugestaoIA(data.data)
      setAiMode('sugestao')
      toast.success('Sugestão gerada! 🤖')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro na IA')
    } finally { setAiLoading(false) }
  }

  const aplicarSugestao = (treinoIA: Record<string, unknown>) => {
    const exerciciosIA = treinoIA.exercicios as Array<Record<string, unknown>> | undefined
    if (!exerciciosIA) return
    const novos: ExercicioForm[] = exerciciosIA.map((ex, i) => {
      const found = mockExercicios.find(m =>
        m.nome.toLowerCase().includes(String(ex.nome ?? '').toLowerCase().split(' ').slice(0, 2).join(' '))
      )
      return {
        id: `ia-${Date.now()}-${i}`,
        exercicio_id: found?.id ?? `ia-${i}`,
        nome: String(ex.nome ?? `Exercício ${i + 1}`),
        grupo: found?.grupo ?? 'Outros',
        gif_url: found?.gif_url,
        youtube_search: found?.youtube_search ?? String(ex.nome ?? ''),
        series: Number(ex.series ?? 3),
        repeticoes: String(ex.repeticoes ?? '10-12'),
        carga: ex.carga_sugerida ? String(ex.carga_sugerida) : '',
        descanso: Number(ex.descanso ?? 60),
        observacoes: String(ex.observacoes ?? ''),
      }
    })
    setExercicios(prev => [...prev, ...novos])
    if (!treino.nome && treinoIA.nome) setTreino(p => ({ ...p, nome: String(treinoIA.nome) }))
    setAiMode('none'); setSugestaoIA(null)
    setStep('exercicios')
    toast.success(`${novos.length} exercícios adicionados!`)
  }

  // ── IA: Chat ──────────────────────────────────────────
  const enviarChat = async () => {
    if (!chatInput.trim() || aiLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: msg }])
    setAiLoading(true)
    try {
      const aluno = alunos.find(a => a.id === treino.aluno_id)
      const res = await fetch('/api/ia', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          tipo: 'assistente_treino',
          dados: {
            mensagem: msg,
            contexto: `Treino: ${treino.nome || 'Sem nome'} | Aluno: ${aluno?.nome ?? 'Não selecionado'} | Objetivo: ${treino.objetivo || aluno?.objetivo || 'Não definido'} | Exercícios: ${exercicios.map(e => e.nome).join(', ') || 'Nenhum'}`,
          },
        }),
      })
      const data = await res.json()
      setChatMsgs(prev => [...prev, { role: 'assistant', content: res.ok ? data.data : '❌ Erro ao consultar IA.' }])
    } catch {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: '❌ Erro ao consultar IA.' }])
    } finally { setAiLoading(false) }
  }

  // ── Salvar treino ─────────────────────────────────────
  const salvar = async () => {
    if (!treino.nome || !treino.aluno_id) { toast.error('Preencha nome e aluno'); return }
    if (exercicios.length === 0) { toast.error('Adicione pelo menos 1 exercício'); return }
    if (!usuario?.academia_id || !usuario?.id) return
    setSaving(true)

    try {
      const { data: prof } = await supabase
        .from('professores').select('id').eq('usuario_id', usuario.id).single()
      if (!prof) throw new Error('Perfil de professor não encontrado')

      // Inserir treino
      const { data: novoTreino, error: treinoError } = await supabase
        .from('treinos')
        .insert({
          aluno_id: treino.aluno_id,
          professor_id: prof.id,
          academia_id: usuario.academia_id,
          nome: treino.nome,
          descricao: treino.descricao || null,
          objetivo: treino.objetivo || null,
          dia_semana: treino.dia_semana ? toDbDia(treino.dia_semana) : null,
          ativo: true,
        })
        .select('id')
        .single()

      if (treinoError) throw new Error(`Erro ao criar treino: ${treinoError.message}`)

      // Inserir exercícios
      // exercicio_id é omitido — os IDs do mock não são UUIDs válidos.
      // O nome é armazenado nas observacoes no formato "Nome | Observações"
      // para poder ser recuperado ao editar o treino depois.
      const exerciciosInsert = exercicios.map((ex, i) => ({
        treino_id: novoTreino.id,
        ordem: i + 1,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga_sugerida: ex.carga ? Number(ex.carga) : null,
        tempo_descanso_seg: ex.descanso,
        observacoes: ex.observacoes
          ? `${ex.nome} | ${ex.observacoes}`
          : ex.nome,
      }))

      const { error: exError } = await supabase.from('treino_exercicios').insert(exerciciosInsert)
      if (exError) throw new Error(`Erro ao salvar exercícios: ${exError.message}`)

      toast.success('Treino criado com sucesso!')
      router.push('/professor/treinos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar treino')
    } finally { setSaving(false) }
  }

  const grupos = ['Todos', ...Array.from(new Set(mockExercicios.map(e => e.grupo)))]
  const filtrados = mockExercicios.filter(e => {
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase()) || e.grupo.toLowerCase().includes(busca.toLowerCase())
    return (grupoFiltro === 'Todos' || e.grupo === grupoFiltro) && matchBusca
  })
  const alunoSelecionado = alunos.find(a => a.id === treino.aluno_id)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="page-title">Criar Treino</h1><p className="page-subtitle">Manual ou com IA</p></div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {(['info', 'exercicios'] as Step[]).map((s, i) => (
          <button key={s} onClick={() => step === 'exercicios' && s === 'info' && setStep('info')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${step === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
            {i + 1}. {s === 'info' ? 'Informações' : `Exercícios${exercicios.length > 0 ? ` (${exercicios.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {step === 'info' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <div>
              <label className="label-base">Aluno *</label>
              {loadingAlunos ? (
                <div className="input-base flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Carregando...</div>
              ) : (
                <select value={treino.aluno_id} onChange={e => setTreino(p => ({ ...p, aluno_id: e.target.value }))} className="input-base">
                  <option value="">Selecionar aluno... ({alunos.length} disponíveis)</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} — {a.matricula}</option>)}
                </select>
              )}
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${treino.dia_semana === day ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
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
              <label className="label-base">Observações</label>
              <textarea value={treino.descricao} onChange={e => setTreino(p => ({ ...p, descricao: e.target.value }))} className="input-base resize-none" rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setStep('exercicios')} disabled={!treino.nome || !treino.aluno_id} className="btn-secondary py-3 flex items-center justify-center gap-2">
              <Dumbbell className="w-5 h-5" />Montar Manualmente
            </button>
            <button onClick={gerarTreinoIA} disabled={!treino.aluno_id || aiLoading}
              className="btn-primary py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600">
              {aiLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Gerando...</> : <><Sparkles className="w-5 h-5" />Gerar com IA</>}
            </button>
          </div>

          {/* Sugestão IA */}
          {aiMode === 'sugestao' && sugestaoIA && (
            <div className="card-base p-5 space-y-4 border-2 border-purple-300 dark:border-purple-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Sugestão da IA</h3>
                <span className="badge-info ml-auto">Claude AI</span>
              </div>
              {typeof sugestaoIA.observacoes_gerais === 'string' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                  <p className="text-xs text-purple-700 dark:text-purple-300">{sugestaoIA.observacoes_gerais}</p>
                </div>
              )}
              {Array.isArray(sugestaoIA.treinos) && (sugestaoIA.treinos as Array<Record<string, unknown>>).map((t, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{String(t.nome ?? '')}</p>
                      <p className="text-xs text-gray-400">{String(t.objetivo ?? '')}</p>
                    </div>
                    <button onClick={() => { setTreino(p => ({ ...p, nome: String(t.nome ?? p.nome) })); aplicarSugestao(t) }}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />Usar este
                    </button>
                  </div>
                  {Array.isArray(t.exercicios) && (t.exercicios as Array<Record<string, unknown>>).map((ex, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-5 h-5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">{j + 1}</span>
                      <span className="flex-1">{String(ex.nome ?? '')}</span>
                      <span>{Number(ex.series ?? 3)}×{String(ex.repeticoes ?? '')}</span>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={() => { setAiMode('none'); setSugestaoIA(null) }} className="btn-secondary w-full text-sm">Fechar</button>
            </div>
          )}

          {/* Chat IA */}
          <div className="card-base overflow-hidden">
            <button onClick={() => setAiMode(aiMode === 'chat' ? 'none' : 'chat')}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Assistente IA</p>
                <p className="text-xs text-gray-400">Tire dúvidas sobre exercícios e treinos</p>
              </div>
              <span className="text-xs text-gray-400">{aiMode === 'chat' ? '▲' : '▼'}</span>
            </button>
            {aiMode === 'chat' && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="h-60 overflow-y-auto p-4 space-y-3">
                  {chatMsgs.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400 mb-3">Pergunte sobre exercícios, séries, progressão...</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['Sugira exercícios para glúteos', 'Quantas séries para hipertrofia?', 'Substituto para supino'].map(s => (
                          <button key={s} onClick={() => setChatInput(s)}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMsgs.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2.5">
                        <div className="flex gap-1">
                          {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarChat()}
                    placeholder="Pergunte..." className="input-base text-sm" disabled={aiLoading} />
                  <button onClick={enviarChat} disabled={aiLoading || !chatInput.trim()} className="btn-primary p-2.5 rounded-xl flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Exercícios ── */}
      {step === 'exercicios' && (
        <div className="space-y-4">
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

          <div className="space-y-3">
            {exercicios.map((ex, index) => (
              <div key={ex.id} className="card-base p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Grip className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ex.nome}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grupoColors[ex.grupo] ?? 'badge-gray'}`}>{ex.grupo}</span>
                  </div>
                  <a href={getYouTubeSearchUrl(ex.youtube_search)} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-red-500" title="Ver no YouTube">
                    <Youtube className="w-4 h-4" />
                  </a>
                  <button onClick={() => setExercicios(prev => [...prev, { ...ex, id: Date.now().toString() }])} className="btn-ghost p-1.5"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setExercicios(prev => prev.filter(e => e.id !== ex.id))} className="btn-ghost p-1.5 text-red-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" />Séries</label><input type="number" value={ex.series} onChange={e => setExercicios(prev => prev.map(e2 => e2.id === ex.id ? { ...e2, series: Number(e.target.value) } : e2))} className="input-base text-center" min="1" max="10" /></div>
                  <div><label className="text-xs text-gray-500 mb-1">Repetições</label><input type="text" value={ex.repeticoes} onChange={e => setExercicios(prev => prev.map(e2 => e2.id === ex.id ? { ...e2, repeticoes: e.target.value } : e2))} className="input-base text-center" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" />Carga (kg)</label><input type="text" value={ex.carga} onChange={e => setExercicios(prev => prev.map(e2 => e2.id === ex.id ? { ...e2, carga: e.target.value } : e2))} className="input-base text-center" placeholder="—" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Descanso (s)</label><input type="number" value={ex.descanso} onChange={e => setExercicios(prev => prev.map(e2 => e2.id === ex.id ? { ...e2, descanso: Number(e.target.value) } : e2))} className="input-base text-center" min="0" step="15" /></div>
                </div>
                <input type="text" value={ex.observacoes} onChange={e => setExercicios(prev => prev.map(e2 => e2.id === ex.id ? { ...e2, observacoes: e.target.value } : e2))} className="input-base text-sm" placeholder="Observações de execução..." />
              </div>
            ))}
          </div>

          <button onClick={() => setShowBusca(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-400 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-orange-500 transition-all">
            <Plus className="w-5 h-5" /><span className="font-medium text-sm">Adicionar Exercício</span>
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={salvar} disabled={saving || exercicios.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar Treino</>}
            </button>
          </div>
        </div>
      )}

      {/* Modal busca */}
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
                <input type="text" placeholder="Buscar exercício..." value={busca} onChange={e => setBusca(e.target.value)} className="input-base pl-9" autoFocus />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {grupos.map(g => (
                  <button key={g} onClick={() => setGrupoFiltro(g)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${grupoFiltro === g ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filtrados.map(ex => (
                <div key={ex.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {ex.gif_url
                      ? <img src={ex.gif_url} alt={ex.nome} className="w-full h-full object-cover" loading="eager" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-5 h-5 text-gray-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                    setExercicios(prev => [...prev, {
                      id: Date.now().toString(), exercicio_id: ex.id,
                      nome: ex.nome, grupo: ex.grupo, gif_url: ex.gif_url,
                      youtube_search: ex.youtube_search, series: 3, repeticoes: '10-12',
                      carga: '', descanso: 60, observacoes: '',
                    }])
                    setShowBusca(false); setBusca(''); setGrupoFiltro('Todos')
                  }}>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ex.nome}</p>
                    <p className="text-xs text-gray-400">{ex.grupo} · {ex.equipamento}</p>
                  </div>
                  <a href={getYouTubeSearchUrl(ex.youtube_search)} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5 text-red-500 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <Youtube className="w-4 h-4" />
                  </a>
                  <button onClick={() => {
                    setExercicios(prev => [...prev, {
                      id: Date.now().toString(), exercicio_id: ex.id,
                      nome: ex.nome, grupo: ex.grupo, gif_url: ex.gif_url,
                      youtube_search: ex.youtube_search, series: 3, repeticoes: '10-12',
                      carga: '', descanso: 60, observacoes: '',
                    }])
                    setShowBusca(false); setBusca(''); setGrupoFiltro('Todos')
                  }} className="btn-ghost p-1.5 text-orange-500 flex-shrink-0">
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
