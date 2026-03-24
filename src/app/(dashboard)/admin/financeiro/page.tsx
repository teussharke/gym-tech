'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Plus, Search, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Pagamento {
  id: string
  valor: number
  valor_desconto: number
  forma_pagamento: string
  status: string
  data_vencimento: string
  data_pagamento: string | null
  observacoes: string | null
  aluno: { matricula: string; usuario: { nome: string } } | null
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

const statusConfig: Record<string, { label: string; class: string }> = {
  pago:      { label: 'Pago',      class: 'badge-success' },
  pendente:  { label: 'Pendente',  class: 'badge-warning' },
  vencido:   { label: 'Vencido',   class: 'badge-danger'  },
  cancelado: { label: 'Cancelado', class: 'badge-gray'    },
}

const formaLabel: Record<string, string> = {
  pix:            'PIX',
  cartao_credito: 'Cartão Crédito',
  cartao_debito:  'Cartão Débito',
  dinheiro:       'Dinheiro',
  boleto:         'Boleto',
  transferencia:  'Transferência',
}

export default function FinanceiroPage() {
  const { usuario } = useAuth()
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [alunos, setAlunos] = useState<{ id: string; usuario: { nome: string } }[]>([])
  const [planos, setPlanos] = useState<{ id: string; nome: string; valor: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<NovoPagamentoForm>({
    aluno_id: '', plano_id: '', valor: '', forma_pagamento: 'pix',
    data_vencimento: new Date().toISOString().split('T')[0], observacoes: '',
  })

  const fetchPagamentos = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          id, valor, valor_desconto, forma_pagamento, status,
          data_vencimento, data_pagamento, observacoes,
          aluno:alunos (matricula, usuario:usuarios!alunos_usuario_id_fkey (nome)),
          plano:planos (nome)
        `)
        .eq('academia_id', usuario.academia_id)
        .order('data_vencimento', { ascending: false })
        .limit(100)

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
    const { error } = await supabase
      .from('pagamentos')
      .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
      .eq('id', id)
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
      fetchPagamentos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const filtered = pagamentos.filter(p => {
    const nome = (p.aluno as unknown as { usuario: { nome: string } })?.usuario?.nome ?? ''
    const matchSearch = nome.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFiltro === 'todos' || p.status === statusFiltro
    return matchSearch && matchStatus
  })

  const totalMes    = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)
  const totalPendente = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0)
  const totalVencido  = pagamentos.filter(p => p.status === 'vencido').reduce((s, p) => s + p.valor, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Gestão de mensalidades e pagamentos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Pagamento</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Recebido/Mês', value: `R$ ${totalMes.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-green-500' },
          { label: 'A Receber',    value: `R$ ${totalPendente.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'bg-amber-500' },
          { label: 'Inadimplência',value: `R$ ${totalVencido.toLocaleString('pt-BR')}`, icon: AlertCircle, color: 'bg-red-500' },
          { label: 'Pagamentos',   value: pagamentos.filter(p => p.status === 'pago').length, icon: CheckCircle2, color: 'bg-blue-500' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="card-base p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['todos', 'pago', 'pendente', 'vencido'].map(s => (
            <button key={s} onClick={() => setStatusFiltro(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
                statusFiltro === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Aluno</th>
                  <th className="table-th">Plano</th>
                  <th className="table-th">Valor</th>
                  <th className="table-th">Forma</th>
                  <th className="table-th">Vencimento</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="table-td font-medium">
                      {(p.aluno as unknown as { usuario: { nome: string } })?.usuario?.nome ?? '—'}
                    </td>
                    <td className="table-td">
                      {p.plano ? <span className="badge-info">{p.plano.nome}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="table-td font-semibold">R$ {(p.valor - (p.valor_desconto || 0)).toLocaleString('pt-BR')}</td>
                    <td className="table-td text-xs">{formaLabel[p.forma_pagamento] ?? p.forma_pagamento}</td>
                    <td className="table-td text-xs">{format(new Date(p.data_vencimento), 'dd/MM/yyyy')}</td>
                    <td className="table-td">
                      <span className={statusConfig[p.status]?.class ?? 'badge-gray'}>
                        {statusConfig[p.status]?.label ?? p.status}
                      </span>
                    </td>
                    <td className="table-td">
                      {p.status !== 'pago' && (
                        <button onClick={() => registrarPagamento(p.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                          Registrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">{pagamentos.length === 0 ? 'Nenhum pagamento cadastrado.' : 'Nenhum resultado.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal novo pagamento */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Novo Pagamento</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-3">
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
                  <input type="number" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} className="input-base" />
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
                <input type="text" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} className="input-base" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarNovoPagamento} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Criar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
