'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Users, Calendar, TrendingUp, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ReportTab = 'financeiro' | 'presenca' | 'alunos'

export default function RelatoriosPage() {
  const { usuario } = useAuth()
  const [activeTab, setActiveTab] = useState<ReportTab>('financeiro')
  const [loading, setLoading] = useState(true)

  // Financeiro
  const [faturamentoMensal, setFaturamentoMensal] = useState<{ mes: string; receita: number }[]>([])
  const [totalMes, setTotalMes] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [formasPagamento, setFormasPagamento] = useState<{ forma: string; total: number; color: string }[]>([])

  // Presença
  const [presencaMensal, setPresencaMensal] = useState<{ mes: string; checkins: number }[]>([])
  const [rankingPresenca, setRankingPresenca] = useState<{ nome: string; checkins: number }[]>([])

  // Alunos
  const [evolucaoAlunos, setEvolucaoAlunos] = useState<{ mes: string; total: number }[]>([])
  const [statsAlunos, setStatsAlunos] = useState({ total: 0, ativos: 0, novos: 0, inadimplentes: 0 })

  const cores = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#6b7280']
  const formaLabels: Record<string, string> = { pix: 'PIX', cartao_credito: 'Cartão Crédito', dinheiro: 'Dinheiro', boleto: 'Boleto', transferencia: 'Transferência', cartao_debito: 'Cartão Débito' }

  const fetchFinanceiro = useCallback(async () => {
    if (!usuario?.academia_id) return
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const { data } = await supabase.from('pagamentos')
        .select('valor, valor_desconto, forma_pagamento, status')
        .eq('academia_id', usuario.academia_id)
        .gte('data_pagamento', startOfMonth(d).toISOString())
        .lte('data_pagamento', endOfMonth(d).toISOString())
        .eq('status', 'pago')
      const receita = (data ?? []).reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)
      meses.push({ mes: format(d, 'MMM/yy', { locale: ptBR }), receita })
    }
    setFaturamentoMensal(meses)

    // Total mês atual e pendentes
    const mesAtual = new Date()
    const [{ data: pagos }, { data: pendentes }] = await Promise.all([
      supabase.from('pagamentos').select('valor, valor_desconto').eq('academia_id', usuario.academia_id).eq('status', 'pago')
        .gte('data_pagamento', startOfMonth(mesAtual).toISOString()),
      supabase.from('pagamentos').select('valor').eq('academia_id', usuario.academia_id).in('status', ['pendente', 'vencido']),
    ])
    setTotalMes((pagos ?? []).reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0))
    setTotalPendente((pendentes ?? []).reduce((s, p) => s + p.valor, 0))

    // Formas de pagamento
    const { data: todasFormas } = await supabase.from('pagamentos').select('forma_pagamento, valor').eq('academia_id', usuario.academia_id).eq('status', 'pago')
    const agrup: Record<string, number> = {}
    ;(todasFormas ?? []).forEach(p => { agrup[p.forma_pagamento] = (agrup[p.forma_pagamento] ?? 0) + p.valor })
    setFormasPagamento(Object.entries(agrup).map(([forma, total], i) => ({ forma: formaLabels[forma] ?? forma, total, color: cores[i % cores.length] })))
  }, [usuario?.academia_id])

  const fetchPresenca = useCallback(async () => {
    if (!usuario?.academia_id) return
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const { count } = await supabase.from('presencas').select('*', { count: 'exact', head: true })
        .eq('academia_id', usuario.academia_id)
        .gte('data_checkin', startOfMonth(d).toISOString())
        .lte('data_checkin', endOfMonth(d).toISOString())
      meses.push({ mes: format(d, 'MMM/yy', { locale: ptBR }), checkins: count ?? 0 })
    }
    setPresencaMensal(meses)

    // Ranking
    const { data: checkins } = await supabase.from('presencas')
      .select('aluno_id, aluno:alunos(usuario:usuarios!alunos_usuario_id_fkey(nome))')
      .eq('academia_id', usuario.academia_id)
      .gte('data_checkin', startOfMonth(new Date()).toISOString())
    
    const cont: Record<string, { nome: string; count: number }> = {}
    ;(checkins ?? []).forEach((c: any) => {
      const nome = c.aluno?.usuario?.nome ?? 'Desconhecido'
      if (!cont[c.aluno_id]) cont[c.aluno_id] = { nome, count: 0 }
      cont[c.aluno_id].count++
    })
    setRankingPresenca(Object.values(cont).sort((a, b) => b.count - a.count).slice(0, 8).map(v => ({ nome: v.nome, checkins: v.count })))
  }, [usuario?.academia_id])

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) return
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const { count } = await supabase.from('alunos').select('*', { count: 'exact', head: true })
        .eq('academia_id', usuario.academia_id)
        .lte('data_matricula', format(d, 'yyyy-MM-dd'))
      meses.push({ mes: format(d, 'MMM/yy', { locale: ptBR }), total: count ?? 0 })
    }
    setEvolucaoAlunos(meses)

    const [{ count: total }, { count: inadimplentes }] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('academia_id', usuario.academia_id),
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('academia_id', usuario.academia_id).eq('status_pagamento', 'vencido'),
    ])
    const mesAtual = format(new Date(), 'yyyy-MM')
    const { count: novos } = await supabase.from('alunos').select('*', { count: 'exact', head: true })
      .eq('academia_id', usuario.academia_id).gte('data_matricula', `${mesAtual}-01`)
    setStatsAlunos({ total: total ?? 0, ativos: (total ?? 0) - (inadimplentes ?? 0), novos: novos ?? 0, inadimplentes: inadimplentes ?? 0 })
  }, [usuario?.academia_id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchFinanceiro(), fetchPresenca(), fetchAlunos()])
      setLoading(false)
    }
    load()
  }, [fetchFinanceiro, fetchPresenca, fetchAlunos])

  const tabs = [
    { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { key: 'presenca', label: 'Presença', icon: Calendar },
    { key: 'alunos', label: 'Alunos', icon: Users },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Análises e métricas da academia</p></div>
        <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => window.print()}>
          <Download className="w-4 h-4" />Exportar
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key as ReportTab)}
              className={`card-base p-4 flex flex-col items-center gap-2 transition-all ${activeTab === t.key ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'hover:shadow-md'}`}>
              <Icon className={`w-6 h-6 ${activeTab === t.key ? 'text-primary-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${activeTab === t.key ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando dados...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <p className="text-sm text-gray-500">Recebido/Mês</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ {totalMes.toLocaleString('pt-BR')}</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-500">A Receber</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ {totalPendente.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="card-base p-5">
                <h3 className="section-title">Faturamento Mensal</h3>
                {faturamentoMensal.every(m => m.receita === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum pagamento registrado ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} name="Receita" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {formasPagamento.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="section-title">Formas de Pagamento</h3>
                  <div className="space-y-3">
                    {formasPagamento.map(fp => (
                      <div key={fp.forma}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: fp.color }} />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{fp.forma}</span>
                          </div>
                          <span className="text-xs font-semibold">R$ {fp.total.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(fp.total / formasPagamento.reduce((s, f) => s + f.total, 0)) * 100}%`, background: fp.color }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESENÇA */}
          {activeTab === 'presenca' && (
            <div className="space-y-4">
              <div className="card-base p-5">
                <h3 className="section-title">Check-ins por Mês</h3>
                {presencaMensal.every(m => m.checkins === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum check-in registrado ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={presencaMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="checkins" fill="#a855f7" radius={[4, 4, 0, 0]} name="Check-ins" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {rankingPresenca.length > 0 && (
                <div className="card-base overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ranking do Mês</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rankingPresenca.map((a, i) => (
                      <div key={a.nome} className="flex items-center gap-3 p-3.5">
                        <span className="text-lg w-7 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}°`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.nome}</p>
                          <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${(a.checkins / (rankingPresenca[0]?.checkins || 1)) * 100}%` }} /></div>
                        </div>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{a.checkins}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALUNOS */}
          {activeTab === 'alunos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: statsAlunos.total },
                  { label: 'Ativos', value: statsAlunos.ativos },
                  { label: 'Novos/mês', value: statsAlunos.novos },
                  { label: 'Inadimplentes', value: statsAlunos.inadimplentes },
                ].map(s => (
                  <div key={s.label} className="stat-card text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="card-base p-5">
                <h3 className="section-title">Evolução da Base de Alunos</h3>
                {evolucaoAlunos.every(m => m.total === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum aluno cadastrado ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={evolucaoAlunos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Total alunos" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
