'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Users, Calendar, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ReportTab = 'financeiro' | 'presenca' | 'alunos'

export default function RelatoriosPage() {
  const { usuario } = useAuth()
  const [activeTab, setActiveTab] = useState<ReportTab>('financeiro')
  const [loading, setLoading] = useState(true)

  const [dadosFinanceiro, setDadosFinanceiro] = useState<{
    faturamentoMensal: { mes: string; receita: number }[]
    totalMes: number
    totalPendente: number
    formasPagamento: { forma: string; total: number; color: string }[]
  }>({ faturamentoMensal: [], totalMes: 0, totalPendente: 0, formasPagamento: [] })

  const [dadosPresenca, setDadosPresenca] = useState<{
    presencaMensal: { mes: string; checkins: number }[]
    rankingPresenca: { nome: string; checkins: number }[]
  }>({ presencaMensal: [], rankingPresenca: [] })

  const [dadosAlunos, setDadosAlunos] = useState<{
    evolucao: { mes: string; total: number }[]
    stats: { total: number; ativos: number; novos: number; inadimplentes: number }
  }>({ evolucao: [], stats: { total: 0, ativos: 0, novos: 0, inadimplentes: 0 } })

  const cores = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#6b7280']
  const formaLabels: Record<string, string> = {
    pix: 'PIX', cartao_credito: 'Cartão Crédito', dinheiro: 'Dinheiro',
    boleto: 'Boleto', transferencia: 'Transferência', cartao_debito: 'Cartão Débito',
  }

  const fetchTudo = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    const id = usuario.academia_id

    // Gera array dos últimos 6 meses
    const meses = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))
    const mesAtual = new Date()
    const inicioMesAtual = startOfMonth(mesAtual).toISOString()
    const fimMesAtual = endOfMonth(mesAtual).toISOString()
    const inicioMes6 = startOfMonth(meses[0]).toISOString()

    try {
      // ── Todas as queries em paralelo ──────────────────────
      const [
        { data: pagamentosTodos },
        { data: pagamentosPendentes },
        { data: presencasTodas },
        { data: alunosTodos },
        { count: novosCount },
        { count: inadimplentesCount },
      ] = await Promise.all([
        // Pagamentos dos últimos 6 meses (pago)
        supabase.from('pagamentos')
          .select('valor, valor_desconto, forma_pagamento, data_pagamento')
          .eq('academia_id', id)
          .eq('status', 'pago')
          .gte('data_pagamento', inicioMes6),

        // Pagamentos pendentes/vencidos
        supabase.from('pagamentos')
          .select('valor')
          .eq('academia_id', id)
          .in('status', ['pendente', 'vencido']),

        // Presenças dos últimos 6 meses
        supabase.from('presencas')
          .select('aluno_id, data_checkin')
          .eq('academia_id', id)
          .gte('data_checkin', inicioMes6),

        // Alunos com data de matrícula
        supabase.from('alunos')
          .select('data_matricula, status_pagamento')
          .eq('academia_id', id),

        // Novos alunos este mês
        supabase.from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('academia_id', id)
          .gte('data_matricula', inicioMesAtual),

        // Inadimplentes
        supabase.from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('academia_id', id)
          .eq('status_pagamento', 'vencido'),
      ])

      // ── Processar financeiro ──────────────────────────────
      const faturamentoMensal = meses.map(d => {
        const inicio = startOfMonth(d).toISOString().split('T')[0]
        const fim = endOfMonth(d).toISOString().split('T')[0]
        const receita = (pagamentosTodos ?? [])
          .filter(p => p.data_pagamento >= inicio && p.data_pagamento <= fim)
          .reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)
        return { mes: format(d, 'MMM/yy', { locale: ptBR }), receita }
      })

      const totalMes = (pagamentosTodos ?? [])
        .filter(p => p.data_pagamento >= inicioMesAtual.split('T')[0])
        .reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)

      const totalPendente = (pagamentosPendentes ?? []).reduce((s, p) => s + p.valor, 0)

      const agrupFormas: Record<string, number> = {}
      ;(pagamentosTodos ?? []).forEach(p => {
        agrupFormas[p.forma_pagamento] = (agrupFormas[p.forma_pagamento] ?? 0) + p.valor
      })
      const formasPagamento = Object.entries(agrupFormas).map(([forma, total], i) => ({
        forma: formaLabels[forma] ?? forma, total, color: cores[i % cores.length],
      }))

      // ── Processar presenças ───────────────────────────────
      const presencaMensal = meses.map(d => {
        const inicio = startOfMonth(d).toISOString().split('T')[0]
        const fim = endOfMonth(d).toISOString().split('T')[0]
        const checkins = new Set(
          (presencasTodas ?? [])
            .filter(p => p.data_checkin.split('T')[0] >= inicio && p.data_checkin.split('T')[0] <= fim)
            .map(p => `${p.aluno_id}-${p.data_checkin.split('T')[0]}`)
        ).size
        return { mes: format(d, 'MMM/yy', { locale: ptBR }), checkins }
      })

      // Ranking do mês atual
      const inicioMesStr = inicioMesAtual.split('T')[0]
      const presencasMes = (presencasTodas ?? []).filter(p => p.data_checkin.split('T')[0] >= inicioMesStr)
      
      // Buscar nomes dos alunos do ranking
      const contagem: Record<string, number> = {}
      presencasMes.forEach(p => { contagem[p.aluno_id] = (contagem[p.aluno_id] ?? 0) + 1 })
      const topIds = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

      let rankingPresenca: { nome: string; checkins: number }[] = []
      if (topIds.length > 0) {
        const { data: usuariosRanking } = await supabase
          .from('alunos')
          .select('id, usuario:usuarios!alunos_usuario_id_fkey(nome)')
          .in('id', topIds)
        
        rankingPresenca = topIds.map(id => {
          const aluno = (usuariosRanking ?? []).find(a => a.id === id)
          return {
            nome: (aluno?.usuario as unknown as { nome: string })?.nome ?? 'Desconhecido',
            checkins: contagem[id],
          }
        })
      }

      // ── Processar alunos ──────────────────────────────────
      const evolucao = meses.map(d => {
        const fimMes = format(endOfMonth(d), 'yyyy-MM-dd')
        const total = (alunosTodos ?? []).filter(a => !a.data_matricula || a.data_matricula <= fimMes).length
        return { mes: format(d, 'MMM/yy', { locale: ptBR }), total }
      })

      setDadosFinanceiro({ faturamentoMensal, totalMes, totalPendente, formasPagamento })
      setDadosPresenca({ presencaMensal, rankingPresenca })
      setDadosAlunos({
        evolucao,
        stats: {
          total: alunosTodos?.length ?? 0,
          ativos: (alunosTodos ?? []).filter(a => a.status_pagamento !== 'cancelado').length,
          novos: novosCount ?? 0,
          inadimplentes: inadimplentesCount ?? 0,
        },
      })
    } catch (err) {
      console.error('Erro relatórios:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchTudo() }, [fetchTudo])

  const tabs = [
    { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { key: 'presenca',   label: 'Presença',   icon: Calendar   },
    { key: 'alunos',     label: 'Alunos',      icon: Users      },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Análises e métricas da academia</p></div>
        <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => window.print()}>
          <Download className="w-4 h-4" />Exportar
        </button>
      </div>

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

      {loading ? (
        <div className="card-base p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando dados...</p>
        </div>
      ) : (
        <>
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <p className="text-sm text-gray-500">Recebido este mês</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ {dadosFinanceiro.totalMes.toLocaleString('pt-BR')}</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-500">A receber</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ {dadosFinanceiro.totalPendente.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="card-base p-5">
                <h3 className="section-title">Faturamento Mensal</h3>
                {dadosFinanceiro.faturamentoMensal.every(m => m.receita === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum pagamento registrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dadosFinanceiro.faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} name="Receita" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {dadosFinanceiro.formasPagamento.length > 0 && (
                <div className="card-base p-5 space-y-3">
                  <h3 className="section-title">Formas de Pagamento</h3>
                  {dadosFinanceiro.formasPagamento.map(fp => (
                    <div key={fp.forma}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: fp.color }} /><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{fp.forma}</span></div>
                        <span className="text-xs font-semibold">R$ {fp.total.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${(fp.total / dadosFinanceiro.formasPagamento.reduce((s, f) => s + f.total, 0)) * 100}%`, background: fp.color }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'presenca' && (
            <div className="space-y-4">
              <div className="card-base p-5">
                <h3 className="section-title">Check-ins por Mês</h3>
                {dadosPresenca.presencaMensal.every(m => m.checkins === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum check-in registrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dadosPresenca.presencaMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="checkins" fill="#a855f7" radius={[4, 4, 0, 0]} name="Check-ins" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {dadosPresenca.rankingPresenca.length > 0 && (
                <div className="card-base overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-gray-100">Ranking do Mês</h3></div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {dadosPresenca.rankingPresenca.map((a, i) => (
                      <div key={a.nome} className="flex items-center gap-3 p-3.5">
                        <span className="text-lg w-7 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}°`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.nome}</p>
                          <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${(a.checkins / (dadosPresenca.rankingPresenca[0]?.checkins || 1)) * 100}%` }} /></div>
                        </div>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{a.checkins}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alunos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total',        value: dadosAlunos.stats.total },
                  { label: 'Ativos',       value: dadosAlunos.stats.ativos },
                  { label: 'Novos/mês',    value: dadosAlunos.stats.novos },
                  { label: 'Inadimplentes',value: dadosAlunos.stats.inadimplentes },
                ].map(s => (
                  <div key={s.label} className="stat-card text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="card-base p-5">
                <h3 className="section-title">Evolução da Base</h3>
                {dadosAlunos.evolucao.every(m => m.total === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhum aluno cadastrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dadosAlunos.evolucao}>
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
