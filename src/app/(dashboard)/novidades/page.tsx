'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone, Sparkles, CalendarDays, AlertTriangle,
  Plus, X, Pin, Trash2, Loader2, Send, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

interface Comunicado {
  id: string
  titulo: string
  conteudo: string
  tipo: 'comunicado' | 'atualizacao' | 'evento' | 'urgente'
  fixado: boolean
  created_at: string
  autor?: { nome: string } | null
}

const TIPO_CONFIG = {
  comunicado:  { icon: Megaphone,       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: 'Comunicado' },
  atualizacao: { icon: Sparkles,        color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  label: 'Atualização' },
  evento:      { icon: CalendarDays,    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Evento' },
  urgente:     { icon: AlertTriangle,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Urgente' },
}

export default function NovidadesPage() {
  const { usuario, role } = useAuth()
  const isAdmin = role === 'admin'

  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'comunicado' as Comunicado['tipo'],
    fixado: false,
  })

  const fetchComunicados = useCallback(async () => {
    if (!usuario?.academia_id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comunicados')
        .select('id, titulo, conteudo, tipo, fixado, created_at, autor:usuarios!autor_id (nome)')
        .eq('academia_id', usuario.academia_id)
        .eq('ativo', true)
        .order('fixado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setComunicados((data as unknown as Comunicado[]) ?? [])
    } catch (err) {
      console.error('Erro ao buscar comunicados:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchComunicados() }, [fetchComunicados])

  const handleSalvar = async () => {
    if (!form.titulo.trim()) { toast.error('Preencha o título'); return }
    if (!form.conteudo.trim()) { toast.error('Preencha o conteúdo'); return }
    if (!usuario?.academia_id) return

    setSaving(true)
    try {
      const { error } = await supabase.from('comunicados').insert({
        academia_id: usuario.academia_id,
        autor_id: usuario.id,
        titulo: form.titulo.trim(),
        conteudo: form.conteudo.trim(),
        tipo: form.tipo,
        fixado: form.fixado,
      })
      if (error) throw error

      toast.success('Comunicado publicado!')
      setForm({ titulo: '', conteudo: '', tipo: 'comunicado', fixado: false })
      setShowForm(false)
      fetchComunicados()
    } catch (err) {
      toast.error('Erro ao publicar comunicado')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este comunicado?')) return
    try {
      await supabase.from('comunicados').update({ ativo: false }).eq('id', id)
      setComunicados(prev => prev.filter(c => c.id !== id))
      toast.success('Comunicado removido')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleFixar = async (id: string, fixado: boolean) => {
    try {
      await supabase.from('comunicados').update({ fixado: !fixado }).eq('id', id)
      setComunicados(prev => prev.map(c => c.id === id ? { ...c, fixado: !fixado } : c))
    } catch {
      toast.error('Erro ao fixar/desfixar')
    }
  }

  const filtered = filtroTipo === 'todos'
    ? comunicados
    : comunicados.filter(c => c.tipo === filtroTipo)

  const tempoRelativo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d`
    return format(new Date(dateStr), "dd MMM", { locale: ptBR })
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--neon)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Novidades</h1>
          <p className="page-subtitle">Comunicados e atualizações</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
              showForm
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-black'
            )}
            style={!showForm ? { background: 'var(--neon)', boxShadow: '0 0 16px var(--neon-glow)' } : undefined}
          >
            {showForm ? <><X className="w-4 h-4" />Cancelar</> : <><Plus className="w-4 h-4" />Novo</>}
          </button>
        )}
      </div>

      {/* Form de criação (admin) */}
      {showForm && isAdmin && (
        <div className="card-base p-5 space-y-4" style={{ borderLeft: '3px solid var(--neon)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Novo Comunicado</h3>

          <input
            type="text"
            placeholder="Título do comunicado"
            value={form.titulo}
            onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
            className="input-base w-full"
            maxLength={120}
          />

          <textarea
            placeholder="Escreva o conteúdo do comunicado..."
            value={form.conteudo}
            onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
            className="input-base w-full resize-none"
            rows={5}
            maxLength={2000}
          />

          <div className="flex flex-wrap gap-2">
            {(Object.entries(TIPO_CONFIG) as [Comunicado['tipo'], typeof TIPO_CONFIG.comunicado][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  onClick={() => setForm(p => ({ ...p, tipo: key }))}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    form.tipo === key
                      ? 'border-current'
                      : 'border-transparent opacity-50'
                  )}
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-2)' }}>
              <input
                type="checkbox"
                checked={form.fixado}
                onChange={e => setForm(p => ({ ...p, fixado: e.target.checked }))}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <Pin className="w-3.5 h-3.5" />
              Fixar no topo
            </label>

            <button
              onClick={handleSalvar}
              disabled={saving || !form.titulo.trim() || !form.conteudo.trim()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</>
                : <><Send className="w-4 h-4" />Publicar</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Filtros por tipo */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
            filtroTipo === 'todos'
              ? 'text-black'
              : ''
          )}
          style={filtroTipo === 'todos'
            ? { background: 'var(--neon)' }
            : { background: 'var(--bg-chip)', color: 'var(--text-3)' }
          }
        >
          Todos
        </button>
        {(Object.entries(TIPO_CONFIG) as [Comunicado['tipo'], typeof TIPO_CONFIG.comunicado][]).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setFiltroTipo(key)}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                filtroTipo === key ? 'border border-current' : ''
              )}
              style={filtroTipo === key
                ? { background: cfg.bg, color: cfg.color }
                : { background: 'var(--bg-chip)', color: 'var(--text-3)' }
              }
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Lista de comunicados */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center space-y-3">
          <Megaphone className="w-12 h-12 mx-auto" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-3)' }}>Nenhum comunicado ainda.</p>
          {isAdmin && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Clique em "Novo" para publicar o primeiro comunicado.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const cfg = TIPO_CONFIG[c.tipo] ?? TIPO_CONFIG.comunicado
            const Icon = cfg.icon
            return (
              <article
                key={c.id}
                className="card-base overflow-hidden transition-all"
                style={c.fixado ? { borderLeft: `3px solid ${cfg.color}` } : undefined}
              >
                {/* Cabeçalho */}
                <div className="p-4 pb-2 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {c.fixado && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: 'var(--neon)' }}>
                          <Pin className="w-2.5 h-2.5" /> Fixado
                        </span>
                      )}
                      <span className="text-[10px] flex items-center gap-0.5 ml-auto" style={{ color: 'var(--text-3)' }}>
                        <Clock className="w-2.5 h-2.5" />
                        {tempoRelativo(c.created_at)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mt-1.5" style={{ color: 'var(--text-1)' }}>
                      {c.titulo}
                    </h3>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="px-4 pb-3 pl-16">
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>
                    {c.conteudo}
                  </p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-3 pl-16 flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {c.autor?.nome ? `Por ${c.autor.nome}` : ''}
                    {c.autor?.nome ? ' · ' : ''}
                    {format(new Date(c.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFixar(c.id, c.fixado)}
                        className="p-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: c.fixado ? 'var(--neon-glow)' : 'var(--bg-chip)' }}
                        title={c.fixado ? 'Desfixar' : 'Fixar'}
                      >
                        <Pin className="w-3.5 h-3.5" style={{ color: c.fixado ? 'var(--neon)' : 'var(--text-3)' }} />
                      </button>
                      <button
                        onClick={() => handleExcluir(c.id)}
                        className="p-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'rgba(239,68,68,0.1)' }}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
