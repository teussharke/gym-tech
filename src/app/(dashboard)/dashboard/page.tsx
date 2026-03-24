'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Users, UserCheck, AlertCircle, DollarSign, CheckSquare, TrendingUp } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Stats {
  totalAlunos: number
  alunosAtivos: number
  inadimplentes: number
  checkinHoje: number
  faturamentoMes: number
}

export default function DashboardPage() {
  const { usuario, role } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalAlunos: 0, alunosAtivos: 0, inadimplentes: 0, checkinHoje: 0, faturamentoMes: 0 })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!usuario?.academia_id) return
    const acadId = usuario.academia_id

    try {
      // Total alunos
      const { count: total } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('academia_id', acadId)

      // Alunos ativos
      const { count: ativos } = await supabase
        .from('alunos')
        .select('*, usuarios!inner(*)', { count: 'exact', head: true })
        .eq('academia_id', acadId)
        .eq('usuarios.status', 'ativo')

      // Inadimplentes
      const { count: inadimplentes } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('academia_id', acadId)
        .eq('status_pagamento', 'vencido')

      // Check-ins hoje
      const hoje = new Date().toISOString().split('T')[0]
      const { count: checkins } = await supabase
        .from('presencas')
        .select('*', { count: 'exact', head: true })
        .eq('academia_id', acadId)
        .gte('data_checkin', `${hoje}T00:00:00`)
        .lte('data_checkin', `${hoje}T23:59:59`)

      // Faturamento do mês
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('valor, valor_desconto')
        .eq('academia_id', acadId)
        .eq('status', 'pago')
        .gte('data_pagamento', inicioMes)

      const faturamento = pagamentos?.reduce((sum, p) => sum + (p.valor - (p.valor_desconto || 0)), 0) ?? 0

      setStats({
        totalAlunos: total ?? 0,
        alunosAtivos: ativos ?? 0,
        inadimplentes: inadimplentes ?? 0,
        checkinHoje: checkins ?? 0,
        faturamentoMes: faturamento,
      })
    } catch (err) {
      console.error('Erro ao buscar stats:', err)
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchStats() }, [fetchStats])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const StatCard = ({ title, value, icon: Icon, color, loading }: {
    title: string; value: string | number; icon: React.ElementType; color: string; loading?: boolean
  }) => (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          {loading
            ? <div className="skeleton h-8 w-20 mt-1" />
            : <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          }
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const quickActions = {
    admin: [
      { href: '/admin/alunos/novo', icon: '👤', label: 'Novo Aluno',      color: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100' },
      { href: '/admin/financeiro',  icon: '💳', label: 'Financeiro',      color: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100' },
      { href: '/admin/relatorios',  icon: '📊', label: 'Relatórios',      color: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100' },
      { href: '/admin/configuracoes', icon: '⚙️', label: 'Configurações', color: 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100' },
    ],
    professor: [
      { href: '/professor/treinos/novo', icon: '📋', label: 'Novo Treino',    color: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100' },
      { href: '/professor/exercicios',   icon: '💪', label: 'Exercícios',     color: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100' },
      { href: '/professor/avaliacoes',   icon: '📏', label: 'Nova Avaliação', color: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100' },
      { href: '/professor/alunos',       icon: '👥', label: 'Meus Alunos',   color: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100' },
    ],
    aluno: [
      { href: '/aluno/treino',    icon: '🏋️', label: 'Iniciar Treino', color: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100' },
      { href: '/aluno/checkin',   icon: '✅', label: 'Check-in',       color: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100' },
      { href: '/aluno/historico', icon: '📅', label: 'Histórico',      color: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100' },
      { href: '/aluno/avaliacoes',icon: '📊', label: 'Avaliações',     color: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100' },
    ],
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">{greeting()}, {usuario?.nome.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {/* Stats — só admin vê */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard title="Total Alunos"   value={stats.totalAlunos}   icon={Users}       color="bg-blue-500"   loading={loading} />
          <StatCard title="Alunos Ativos"  value={stats.alunosAtivos}  icon={UserCheck}   color="bg-green-500"  loading={loading} />
          <StatCard title="Inadimplentes"  value={stats.inadimplentes} icon={AlertCircle} color="bg-red-500"    loading={loading} />
          <StatCard title="Check-in Hoje"  value={stats.checkinHoje}   icon={CheckSquare} color="bg-purple-500" loading={loading} />
          <StatCard
            title="Faturamento/Mês"
            value={`R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            icon={DollarSign}
            color="bg-amber-500"
            loading={loading}
          />
        </div>
      )}

      {/* Stats aluno */}
      {role === 'aluno' && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Treinos/Mês"  value="—" icon={TrendingUp} color="bg-blue-500"  loading={loading} />
          <StatCard title="Check-ins"    value="—" icon={CheckSquare} color="bg-green-500" loading={loading} />
        </div>
      )}

      {/* Ações rápidas */}
      <div className="card-base p-5">
        <h3 className="section-title">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(quickActions[role as keyof typeof quickActions] ?? quickActions.aluno).map(({ href, icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 active:scale-95 group`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mensagem se não tem dados */}
      {role === 'admin' && !loading && stats.totalAlunos === 0 && (
        <div className="card-base p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-600">
          <p className="text-4xl mb-3">🏋️</p>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Academia configurada!</h3>
          <p className="text-gray-500 text-sm mb-4">Agora cadastre seus primeiros alunos e professores.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/admin/alunos/novo" className="btn-primary text-sm">+ Cadastrar Aluno</Link>
            <Link href="/admin/professores" className="btn-secondary text-sm">+ Cadastrar Professor</Link>
          </div>
        </div>
      )}
    </div>
  )
}
