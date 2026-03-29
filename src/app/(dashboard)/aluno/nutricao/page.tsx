'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Bot, User, Leaf, Zap, RotateCcw, ChevronDown, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface AlunoContexto {
  nome?: string
  objetivo?: string
  nivel?: string
  peso?: number
  altura?: number
  tem_lesoes?: boolean
  lesoes_descricao?: string
  doencas_preexistentes?: string
  medicamentos?: string
  horas_sono?: number
  nivel_estresse?: string
  consome_alcool?: boolean
  intolerancia_alimentar?: string
  historico_dieta?: string
  refeicoes_por_dia?: number
}

// ── Sugestões rápidas ─────────────────────────────────────────
const SUGESTOES = [
  '🥗 Sugira um cardápio semanal para o meu objetivo',
  '💪 O que comer antes e depois do treino?',
  '🥩 Melhores fontes de proteína acessíveis no Brasil',
  '⚖️ Quantas calorias preciso por dia?',
  '🌙 Qual a melhor refeição antes de dormir?',
  '💊 Devo usar Whey Protein? Vale a pena?',
  '🔥 Como acelerar o metabolismo com alimentação?',
  '🥤 Importância da hidratação no treino',
]

// ── Renderizador de Markdown simples ─────────────────────────
function RenderMsg({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="font-bold text-sm mt-3 mb-1 text-gray-900 dark:text-gray-100">{line.slice(4)}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="font-bold text-base mt-3 mb-1 text-gray-900 dark:text-gray-100">{line.slice(3)}</h3>)
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1">{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-3 list-disc leading-relaxed">
          {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
        </li>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />)
    } else {
      // Inline bold
      const parts = line.split(/\*\*(.*?)\*\*/g)
      elements.push(
        <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="font-semibold text-gray-900 dark:text-gray-100">{p}</strong> : p)}
        </p>
      )
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}

// ── Bubble de mensagem ────────────────────────────────────────
function MsgBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const isUser = msg.role === 'user'

  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <RenderMsg text={msg.content} />
        )}
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
        <Leaf className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function NutricaoPage() {
  const { usuario } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contexto, setContexto] = useState<AlunoContexto>({})
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Busca contexto do aluno (objetivo, anamnese)
  const fetchContexto = useCallback(async () => {
    if (!usuario?.id) return
    try {
      // Busca dados do aluno
      const { data: alunoData } = await supabase
        .from('alunos')
        .select('id, objetivos, usuario:usuarios (nome)')
        .eq('usuario_id', usuario.id)
        .maybeSingle()

      const aluno = alunoData as { id: string; objetivos: string | null; usuario: { nome: string } | null } | null

      // Busca anamnese mais recente pelo aluno_id (não usuario_id)
      // Colunas corretas conforme a migration: descricao_lesoes, nivel_stress, restricoes_alimentares
      const { data: anam } = aluno?.id
        ? await supabase
            .from('anamneses')
            .select(`
              objetivo, nivel_atividade, tem_lesoes, descricao_lesoes,
              doencas_preexistentes, medicamentos, horas_sono, nivel_stress,
              consome_alcool, restricoes_alimentares
            `)
            .eq('aluno_id', aluno.id)
            .eq('status', 'respondida')
            .order('respondida_em', { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null }

      setContexto({
        nome: (aluno?.usuario as unknown as { nome: string } | null)?.nome ?? usuario.nome,
        objetivo: aluno?.objetivos ?? (anam as { objetivo?: string } | null)?.objetivo ?? undefined,
        nivel: (anam as { nivel_atividade?: string } | null)?.nivel_atividade ?? undefined,
        tem_lesoes: (anam as { tem_lesoes?: boolean } | null)?.tem_lesoes ?? undefined,
        lesoes_descricao: (anam as { descricao_lesoes?: string } | null)?.descricao_lesoes ?? undefined,
        doencas_preexistentes: (anam as { doencas_preexistentes?: string } | null)?.doencas_preexistentes ?? undefined,
        medicamentos: (anam as { medicamentos?: string } | null)?.medicamentos ?? undefined,
        horas_sono: (anam as { horas_sono?: number } | null)?.horas_sono ?? undefined,
        nivel_estresse: String((anam as { nivel_stress?: number } | null)?.nivel_stress ?? '') || undefined,
        consome_alcool: (anam as { consome_alcool?: boolean } | null)?.consome_alcool ?? undefined,
        intolerancia_alimentar: (anam as { restricoes_alimentares?: string } | null)?.restricoes_alimentares ?? undefined,
      })
    } catch { /* silencioso — contexto é opcional */ }
  }, [usuario?.id, usuario?.nome])

  useEffect(() => { fetchContexto() }, [fetchContexto])

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Mensagem de boas-vindas
  useEffect(() => {
    if (!contexto.nome) return
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      ts: Date.now(),
      content: `Olá, ${contexto.nome}! 🌿 Sou a **NutriIA**, sua assistente de nutrição esportiva.\n\nEstou aqui para te ajudar com dicas de alimentação personalizadas${contexto.objetivo ? `, focadas no seu objetivo de **${contexto.objetivo}**` : ''}.\n\nPosso sugerir cardápios, calcular suas necessidades calóricas, indicar os melhores alimentos para seu treino e muito mais. **O que você gostaria de saber?**`,
    }
    setMessages([welcomeMsg])
  }, [contexto.nome]) // eslint-disable-line

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setApiError(null)
    setShowSuggestions(false)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Histórico sem a welcome (não manda para API)
      const history = [...messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/nutricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, contexto }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setApiError(data.error ?? 'Erro ao conectar com a IA')
        setMessages(prev => prev.filter(m => m.id !== userMsg.id))
        setInput(text)
        return
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        ts: Date.now(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setApiError('Erro de conexão. Tente novamente.')
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      setInput(text)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [loading, messages, contexto])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowSuggestions(true)
    setApiError(null)
    setTimeout(() => {
      if (contexto.nome) {
        const welcomeMsg: Message = {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          ts: Date.now(),
          content: `Conversa reiniciada! 🌿 Em que posso te ajudar${contexto.objetivo ? ` com seu objetivo de **${contexto.objetivo}**` : ''}?`,
        }
        setMessages([welcomeMsg])
      }
    }, 100)
  }

  const temContexto = !!contexto.objetivo || !!contexto.nivel

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900 dark:text-gray-100">NutriIA</h1>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nutricionista Virtual</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {temContexto && (
              <div className="hidden sm:flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full px-3 py-1 text-xs font-medium">
                <Zap className="w-3 h-3" />
                {contexto.objetivo ?? 'Perfil carregado'}
              </div>
            )}
            <button onClick={clearChat} className="btn-ghost p-2 text-gray-400 hover:text-gray-600" title="Nova conversa">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner de configuração (sem API key) */}
        {apiError?.includes('ANTHROPIC_API_KEY') && (
          <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Para ativar a NutriIA, adicione <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">ANTHROPIC_API_KEY=sua_chave</code> no arquivo <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> e reinicie o servidor.</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-950">

        {messages.map((msg, i) => (
          <MsgBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
        ))}

        {loading && <TypingIndicator />}

        {/* Sugestões rápidas */}
        {showSuggestions && messages.length <= 1 && !loading && (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowSuggestions(false)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
            >
              Sugestões de perguntas <ChevronDown className="w-3 h-3" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGESTOES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.replace(/^[^\s]+\s/, ''))}
                  className="text-left text-xs px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {apiError && !apiError.includes('ANTHROPIC_API_KEY') && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm">
            <Info className="w-4 h-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre alimentação, cardápios, nutrição esportiva..."
            className="flex-1 input-base resize-none min-h-[44px] max-h-32 py-3 leading-normal"
            rows={1}
            disabled={loading}
            style={{ height: 'auto' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 128) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={clsx(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !loading
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-600/20 active:scale-95'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            )}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          NutriIA fornece orientações gerais. Consulte um nutricionista para planos individualizados.
        </p>
      </div>
    </div>
  )
}
