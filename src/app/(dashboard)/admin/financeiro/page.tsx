'use client'

import { useState } from 'react'
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  Plus, Download, Search, Filter, CreditCard, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { format } from 'date-fns'

const mockPagamentos = [
  { id: '1', aluno: 'Carlos Silva', plano: 'Premium', valor: 180, desconto: 0, forma: 'pix', status: 'pago', vencimento: '2024-01-15', pagamento: '2024-01-14' },
  { id: '2', aluno: 'Ana Oliveira', plano: 'Básico', valor: 120, desconto: 10, forma: 'cartao_credito', status: 'pago', vencimento: '2024-01-20', pagamento: '2024-01-20' },
  { id: '3', aluno: 'Pedro Santos', plano: 'Premium', valor: 180, desconto: 0, forma: 'dinheiro', status: 'vencido', vencimento: '2024-01-10', pagamento: null },
  { id: '4', aluno: 'Maria Costa', plano: 'Família', valor: 250, desconto: 20, forma: 'pix', status: 'pago', vencimento: '2024-01-28', pagamento: '2024-01-25' },
  { id: '5', aluno: 'João Ferreira', plano: 'Básico', valor: 120, desconto: 0, forma: 'boleto', status: 'pendente', vencimento: '2024-02-05', pagamento: null },
  { id: '6', aluno: 'Fernanda Lima', plano: 'Premium', valor: 180, desconto: 0, forma: 'pix', status: 'pago', vencimento: '2024-01-22', pagamento: '2024-01-22' },
  { id: '7', aluno: 'Roberto Alves', plano: 'Básico', valor: 120, desconto: 0, forma: 'cartao_debito', status: 'pago', vencimento: '2024-01-18', pagamento: '2024-01-17' },
]

const faturamentoMensal = [
  { mes: 'Jul/23', receita: 18400, meta: 20000 },
  { mes: 'Ago/23', receita: 21200, meta: 20000 },
  { mes: 'Set/23', receita: 19800, meta: 20000 },
  { mes: 'Out/23', receita: 23100, meta: 22000 },
  { mes: 'Nov/23', receita: 24500, meta: 22000 },
  { mes: 'Dez/23', receita: 22300, meta: 22000 },
  { mes: 'Jan/24', receita: 26800, meta: 25000 },
]

const formasPagamento = [
  { forma: 'PIX', total: 14200, count: 48, color: '#22c55e' },
  { forma: 'Cartão Crédito', total: 7800, count: 23, color: '#3b82f6' },
  { forma: 'Dinheiro', total: 3200, count: 18, color: '#f59e0b' },
  { forma: 'Boleto', total: 1600, count: 12, color: '#a855f7' },
]

const statusConfig: Record<string, { label: string; class: string }> = {
  pago: { label: 'Pago', class: 'badge-success' },
  pendente: { label: 'Pendente', class: 'badge-warning' },
  vencido: { label: 'Vencido', class: 'badge-danger' },
  cancelado: { label: 'Cancelado', class: 'badge-gray' },
}

const formaLabel: Record<string, string> = {
  pix: 'PIX',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  transferencia: 'Transferência',
}

export default function FinanceiroPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showNovoPagamento, setShowNovoPagamento] = useState(false)

  const totalMes = mockPagamentos.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor - p.desconto), 0)
  const totalPendente = mockPagamentos.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0)
  const totalVencido = mockPagamentos.filter(p => p.status === 'vencido').reduce((sum, p) => sum + p.valor, 0)
  const inadimplentes = mockPagamentos.filter(p => p.status === 'vencido').length

  const filtered = mockPagamentos.filter(p => {
    const matchSearch = p.aluno.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Gestão de mensalidades e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => setShowNovoPagamento(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Pagamento</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Faturamento/Mês</p>
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {totalMes.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +9.4% vs mês anterior
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">A Receber</p>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {totalPendente.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-400">{mockPagamentos.filter(p => p.status === 'pendente').length} pendentes</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Inadimplência</p>
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {totalVencido.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-red-500">{inadimplentes} alunos inadimplentes</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Taxa Adimplência</p>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">88%</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '88%' }} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Faturamento */}
        <div className="card-base p-5 lg:col-span-2">
          <h3 className="section-title">Faturamento x Meta</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faturamentoMensal} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `R$ ${value.toLocaleString('pt-BR')}`,
                  name === 'receita' ? 'Receita' : 'Meta'
                ]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}
              />
              <Bar dataKey="meta" fill="#e5e7eb" radius={[4,4,0,0]} name="meta" />
              <Bar dataKey="receita" fill="#22c55e" radius={[4,4,0,0]} name="receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Formas de pagamento */}
        <div className="card-base p-5">
          <h3 className="section-title">Formas de Pagamento</h3>
          <div className="space-y-3 mt-2">
            {formasPagamento.map(fp => (
              <div key={fp.forma}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: fp.color }} />
                    <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{fp.forma}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      R$ {fp.total.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">({fp.count})</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(fp.total / 26800) * 100}%`, background: fp.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-base pl-9"
              />
            </div>
            <div className="flex gap-2">
              {['todos', 'pago', 'pendente', 'vencido'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
                    statusFilter === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Aluno</th>
                <th className="table-th">Plano</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Forma</th>
                <th className="table-th">Vencimento</th>
                <th className="table-th">Pagamento</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-td font-medium">{p.aluno}</td>
                  <td className="table-td">
                    <span className="badge-info">{p.plano}</span>
                  </td>
                  <td className="table-td">
                    <div>
                      <span className="font-semibold">R$ {(p.valor - p.desconto).toLocaleString('pt-BR')}</span>
                      {p.desconto > 0 && (
                        <span className="text-xs text-gray-400 ml-1 line-through">R$ {p.valor}</span>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs">{formaLabel[p.forma]}</span>
                    </div>
                  </td>
                  <td className="table-td text-xs">
                    {format(new Date(p.vencimento), 'dd/MM/yyyy')}
                  </td>
                  <td className="table-td text-xs">
                    {p.pagamento ? format(new Date(p.pagamento), 'dd/MM/yyyy') : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className={statusConfig[p.status].class}>{statusConfig[p.status].label}</span>
                  </td>
                  <td className="table-td">
                    {p.status !== 'pago' && (
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Registrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
