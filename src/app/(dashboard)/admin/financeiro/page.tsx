'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  Plus, Search, X, Loader2, AlertTriangle, Clock,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Pagamento {
  id: string
  valor: number
  valor_desconto: number
  forma_pagamento: string
  status: string
  data_vencimento: string
  data_pagamento: string | null
  observacoes: string | null
  aluno: { id: string; matricula: string; usuario: { nome: string } } | null
  plano: { nome: string } | null
}

interface NovoPagamentoForm {
  aluno_id: string
  plano_id: string
  valor: string
  forma_pagamento: string
  data_vencimento: string
  observacoes: string
}

const formaLabel: Record<string, string> = {
  pix:            'PIX',
  cartao_credito: 'Cartão Crédito',
  cartao_debito:  'Cartão Débito',
  dinheiro:       'Dinheiro',
  boleto:         'Boleto',
  transferencia:  'Transferência',
}

type TabKey = 'todos' | 'vencidos' | 'a_vencer' | 'pagos'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos',    label: 'Todos'     },
  { key: 'vencidos', label: 'Vencidos'  },
  { key: 'a_vencer', label: 'A vencer'  },
  { key: 'pagos',    label: 'Pagos'     },
]

function diasParaVencer(dataVencimento: string): number {
  return differenceInDays(parseISO(dataVencimento), new Date())
}

function isAVencer(p: Pagamento): boolean {
  if (p.status === 'pago' || p.status === 'cancelado') return false
  const dias = diasParaVencer(p.data_vencimento)
  return dias >= 0 && dias <= 7
}

function isVencido(p: Pagamento): boolean {
  if (p.status === 'pago' || p.status === 'cancelado') return false
  return p.status === 'vencido' || diasParaVencer(p.data_vencimento) < 0
}

export default function FinanceiroPage() {
  const { usuario } = useAuth()
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('todos')
  const [showForm, setShowForm] = useState(false)
  const [alunos, setAlunos] = useState<{ id: string; usuario: { nome: string } }[]>([])
  const [planos, setPlanos] = useState<{ id: string; nome: string; valor: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmandoPagamento, setConfirmandoPagamento] = useState<string | null>(null)
  const [form, setForm] = useState<NovoPagamentoForm>({
    aluno_id: '', plano_id: '', valor: '', forma_pagamento: 'pix',
    data_vencimento: new Date().toISOString().split('T')[0], observacoes: '',
  })

  const fetchPagamentos = useCallback(async () => {
    if (!usuario?.academia_id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          id, valor, valor_desconto, forma_pagamento, status,
          data_vencimento, data_pagamento, observacoes,
          aluno:alunos (id, matricula, usuario:usuarios!alunos_usuario_id_fkey (nome)),
          plano:planos (nome)
        `)
        .eq('academia_id', usuario.academia_id)
        .order('data_vencimento', { ascending: true })
        .limit(200)

      if (error) throw error
      setPagamentos((data as unknown as Pagamento[]) ?? [])
    } catch {
      toast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  const fetchAlunosPlanos = useCallback(async () => {
    if (!usuario?.academia_id) return
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('alunos').select('id, usuario:usuarios!alunos_usuario_id_fkey (nome)').eq('academia_id', usuario.academia_id),
      supabase.from('planos').select('id, nome, valor').eq('academia_id', usuario.academia_id).eq('ativo', true),
    ])
    setAlunos((a as unknown as { id: string; usuario: { nome: string } }[]) ?? [])
    setPlanos(p ?? [])
  }, [usuario?.academia_id])

  useEffect(() => { fetchPagamentos(); fetchAlunosPlanos() }, [fetchPagamentos, fetchAlunosPlanos])

  const registrarPagamento = async (id: string) => {
    setConfirmandoPagamento(id)
    const { error } = await supabase
      .from('pagamentos')
      .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    setConfirmandoPagamento(null)
    if (error) { toast.error('Erro ao registrar pagamento'); return }
    toast.success('Pagamento registrado!')
    fetchPagamentos()
  }

  const salvarNovoPagamento = async () => {
    if (!form.aluno_id || !form.valor) { toast.error('Preencha aluno e valor'); return }
    if (!usuario?.academia_id) return
    setSaving(true)
    try {
      const { error } = await supabase.from('pagamentos').insert({
        aluno_id: form.aluno_id,
        academia_id: usuario.academia_id,
        plano_id: form.plano_id || null,
        valor: Number(form.valor),
        valor_desconto: 0,
        forma_pagamento: form.forma_pagamento,
        status: 'pendente',
        data_vencimento: form.data_vencimento,
        observacoes: form.observacoes || null,
        created_by: usuario.id,
      })
      if (error) throw error
      toast.success('Pagamento criado!')
      setShowForm(false)
      setForm({ aluno_id: '', plano_id: '', valor: '', forma_pagamento: 'pix', data_vencimento: new Date().toISOString().split('T')[0], observacoes: '' })
      fetchPagamentos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const vencidos  = pagamentos.filter(isVencido)
    const aVencer   = pagamentos.filter(isAVencer)
    const pagos     = pagamentos.filter(p => p.status === 'pago')
    const recebido  = pagos.reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)
    const emAberto  = [...vencidos, ...aVencer].reduce((s, p) => s + p.valor, 0)
    return { vencidos, aVencer, pagos, recebido, emAberto }
  }, [pagamentos])

  const filtered = useMemo(() => {
    let list = pagamentos
    if (tab === 'vencidos') list = pagamentos.filter(isVencido)
    if (tab === 'a_vencer') list = pagamentos.filter(isAVencer)
    if (tab === 'pagos')    list = pagamentos.filter(p => p.status === 'pago')

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => {
        const nome = (p.aluno as unknown as { usuario: { nome: string } })?.usuario?.nome ?? ''
        return nome.toLowerCase().includes(q)
      })
    }
    return list
  }, [pagamentos, tab, search])

  const tabCounts: Record<TabKey, number> = {
    todos:    pagamentos.length,
    vencidos: stats.vencidos.length,
    a_vencer: stats.aVencer.length,
    pagos:    stats.pagos.length,
  }

  function getRowStyle(p: Pagamento) {
    if (isVencido(p))  return { borderLeft: '3px solid #ef4444' }
    if (isAVencer(p))  return { borderLeft: '3px solid #f59e0b' }
    if (p.status === 'pago') return { borderLeft: '3px solid #22c55e' }
    return {}
  }

  function getStatusBadge(p: Pagamento) {
    if (isVencido(p)) {
      const dias = Math.abs(diasParaVencer(p.data_vencimento))
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
          <AlertCircle className="w-3 h-3" />
          {dias}d atraso
        </span>
      )
    }
    if (isAVencer(p)) {
      const dias = diasParaVencer(p.data_vencimento)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
          <Clock className="w-3 h-3" />
          {dias === 0 ? 'Hoje' : `${dias}d`}
        </span>
      )
    }
    if (p.status === 'pago') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
          <CheckCircle2 className="w-3 h-3" />
          Pago
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: 'var(--bg-chip)', color: 'var(--text-3)' }}>
        Pendente
      </span>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Gestão de mensalidades e pagamentos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Lançamento</span>
        </button>
      </div>

      {/* Alertas críticos */}
      {!loading && (stats.vencidos.length > 0 || stats.aVencer.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.vencidos.length > 0 && (
            <button
              onClick={() => setTab('vencidos')}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-opacity hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-500">{stats.vencidos.length} em atraso</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  R$ {stats.vencidos.reduce((s, p) => s + p.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 flex-shrink-0" />
            </button>
          )}
          {stats.aVencer.length > 0 && (
            <button
              onClick={() => setTab('a_vencer')}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-opacity hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)' }}>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-500">{stats.aVencer.length} vencem em 7 dias</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  R$ {stats.aVencer.reduce((s, p) => s + p.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Recebido',      value: `R$ ${stats.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Em aberto',     value: `R$ ${stats.emAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp,   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { label: 'Inadimplentes', value: stats.vencidos.length,  icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Pagos/mês',     value: stats.pagos.length,     icon: DollarSign,  color: 'var(--neon)', bg: 'rgba(255,107,0,0.12)' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="p-4 rounded-2xl space-y-2"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-lg font-black" style={{ color: 'var(--text-1)' }}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs + Search */}
      <div className="space-y-3">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              )}
              style={tab === t.key
                ? { background: 'var(--neon)', color: '#000' }
                : { background: 'var(--bg-chip)', color: 'var(--text-3)' }
              }
            >
              {t.label}
              {tabCounts[t.key] > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={tab === t.key
                    ? { background: 'rgba(0,0,0,0.2)', color: '#000' }
                    : { background: 'var(--bg-base)', color: 'var(--text-2)' }
                  }>
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: 'var(--neon)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'Nenhum resultado.' : 'Nenhum pagamento nesta categoria.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const nome = (p.aluno as unknown as { usuario: { nome: string } })?.usuario?.nome ?? '—'
            const vencido = isVencido(p)
            const aVencer = isAVencer(p)
            return (
              <div
                key={p.id}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  ...getRowStyle(p),
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar inicial */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{
                      background: vencido ? 'rgba(239,68,68,0.12)' : aVencer ? 'rgba(245,158,11,0.12)' : 'var(--bg-chip)',
                      color: vencido ? '#ef4444' : aVencer ? '#f59e0b' : 'var(--text-2)',
                    }}
                  >
                    {nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                        {nome}
                      </span>
                      {p.plano && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: 'var(--bg-chip)', color: 'var(--text-3)' }}>
                          {p.plano.nome}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                        Venc. {format(parseISO(p.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {formaLabel[p.forma_pagamento] ?? p.forma_pagamento}
                      </span>
                    </div>
                  </div>

                  {/* Direita: valor + status + ação */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-black" style={{ color: 'var(--text-1)' }}>
                      R$ {(p.valor - (p.valor_desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {getStatusBadge(p)}
                    {p.status !== 'pago' && p.status !== 'cancelado' && (
                      <button
                        onClick={() => registrarPagamento(p.id)}
                        disabled={confirmandoPagamento === p.id}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: 'var(--neon)', color: '#000' }}
                      >
                        {confirmandoPagamento === p.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : 'Receber'
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal novo pagamento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="p-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>Novo Lançamento</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label-base">Aluno *</label>
                <select value={form.aluno_id} onChange={e => setForm(p => ({ ...p, aluno_id: e.target.value }))} className="input-base">
                  <option value="">Selecionar aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{(a.usuario as unknown as { nome: string })?.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Plano</label>
                <select value={form.plano_id} onChange={e => {
                  const plano = planos.find(p => p.id === e.target.value)
                  setForm(p => ({ ...p, plano_id: e.target.value, valor: plano ? String(plano.valor) : p.valor }))
                }} className="input-base">
                  <option value="">Selecionar plano...</option>
                  {planos.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.valor}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Valor (R$) *</label>
                  <input type="number" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} className="input-base" placeholder="0,00" />
                </div>
                <div>
                  <label className="label-base">Forma</label>
                  <select value={form.forma_pagamento} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))} className="input-base">
                    {Object.entries(formaLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-base">Vencimento *</label>
                <input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="label-base">Observações</label>
                <input type="text" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} className="input-base" placeholder="Opcional" />
              </div>
            </div>

            <div className="p-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarNovoPagamento} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : 'Criar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
