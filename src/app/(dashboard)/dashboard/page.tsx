'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import {
  Users, UserCheck, AlertCircle, TrendingUp, DollarSign,
  Activity, Calendar, CheckSquare, Dumbbell, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mock data for demonstration
const faturamentoData = [
  { mes: 'Jul', valor: 18400, alunos: 84 },
  { mes: 'Ago', valor: 21200, alunos: 92 },
  { mes: 'Set', valor: 19800, alunos: 88 },
  { mes: 'Out', valor: 23100, alunos: 97 },
  { mes: 'Nov', valor: 24500, alunos: 103 },
  { mes: 'Dez', valor: 22300, alunos: 98 },
  { mes: 'Jan', valor: 26800, alunos: 112 },
]

const frequenciaData = [
  { dia: 'Seg', checkins: 45 },
  { dia: 'Ter', checkins: 52 },
  { dia: 'Qua', checkins: 48 },
  { dia: 'Qui', checkins: 58 },
  { dia: 'Sex', checkins: 62 },
  { dia: 'Sáb', checkins: 35 },
  { dia: 'Dom', checkins: 18 },
]

const gruposData = [
  { name: 'Pernas', value: 24, color: '#22c55e' },
  { name: 'Peito', value: 18, color: '#3b82f6' },
  { name: 'Costas', value: 20, color: '#a855f7' },
  { name: 'Ombro', value: 15, color: '#f59e0b' },
  { name: 'Bíceps', value: 12, color: '#ef4444' },
  { name: 'Outros', value: 11, color: '#6b7280' },
]

const alunosTop = [
  { nome: 'Carlos Silva', checkins: 24, avatar: 'CS' },
  { nome: 'Ana Oliveira', checkins: 22, avatar: 'AO' },
  { nome: 'Pedro Santos', checkins: 21, avatar: 'PS' },
  { nome: 'Maria Costa', checkins: 20, avatar: 'MC' },
  { nome: 'João Ferreira', checkins: 19, avatar: 'JF' },
]

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: string
  loading?: boolean
}

function StatCard({ title, value, change, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          {loading ? (
            <div className="skeleton h-8 w-20 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{Math.abs(change)}% em relação ao mês anterior</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { usuario, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAlunos: 0,
    alunosAtivos: 0,
    inadimplentes: 0,
    checkinHoje: 0,
    faturamentoMes: 0,
    novosMes: 0,
  })

  useEffect(() => {
    // Simulate loading with mock data
    setTimeout(() => {
      setStats({
        totalAlunos: 127,
        alunosAtivos: 112,
        inadimplentes: 15,
        checkinHoje: 48,
        faturamentoMes: 26800,
        novosMes: 8,
      })
      setLoading(false)
    }, 800)
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">
          {greeting()}, {usuario?.nome.split(' ')[0]}! 👋
        </h1>
        <p className="page-subtitle">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Grid - Admin */}
      {role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Alunos" value={stats.totalAlunos} change={6.3} icon={Users} color="bg-blue-500" loading={loading} />
          <StatCard title="Alunos Ativos" value={stats.alunosAtivos} change={4.1} icon={UserCheck} color="bg-green-500" loading={loading} />
          <StatCard title="Inadimplentes" value={stats.inadimplentes} change={-2.1} icon={AlertCircle} color="bg-red-500" loading={loading} />
          <StatCard title="Check-in Hoje" value={stats.checkinHoje} icon={CheckSquare} color="bg-purple-500" loading={loading} />
          <StatCard title="Faturamento" value={`R$ ${(stats.faturamentoMes / 1000).toFixed(1)}k`} change={9.4} icon={DollarSign} color="bg-amber-500" loading={loading} />
          <StatCard title="Novos Alunos" value={stats.novosMes} change={14.2} icon={TrendingUp} color="bg-cyan-500" loading={loading} />
        </div>
      )}

      {/* Stats Grid - Professor */}
      {role === 'professor' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Meus Alunos" value="24" change={8.3} icon={Users} color="bg-blue-500" loading={loading} />
          <StatCard title="Treinos Criados" value="48" change={12.5} icon={ClipboardList} color="bg-green-500" loading={loading} />
          <StatCard title="Avaliações" value="12" change={5.0} icon={Activity} color="bg-purple-500" loading={loading} />
          <StatCard title="Check-ins Hoje" value="18" icon={CheckSquare} color="bg-amber-500" loading={loading} />
        </div>
      )}

      {/* Stats Grid - Aluno */}
      {role === 'aluno' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Treinos no Mês" value="18" change={12.5} icon={Dumbbell} color="bg-blue-500" loading={loading} />
          <StatCard title="Frequência" value="72%" change={5.0} icon={Calendar} color="bg-green-500" loading={loading} />
          <StatCard title="Check-ins" value="22" change={10.0} icon={CheckSquare} color="bg-purple-500" loading={loading} />
          <StatCard title="Carga Máxima" value="+15kg" icon={TrendingUp} color="bg-amber-500" loading={loading} />
        </div>
      )}

      {/* Charts - Admin */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Faturamento mensal */}
          <div className="card-base p-5 xl:col-span-2">
            <h3 className="section-title flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Faturamento Mensal
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grupos musculares */}
          <div className="card-base p-5">
            <h3 className="section-title flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-500" />
              Exercícios Utilizados
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={gruposData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {gruposData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {gruposData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frequência semanal */}
          <div className="card-base p-5">
            <h3 className="section-title flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Check-ins por Dia
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={frequenciaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="checkins" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolução de alunos */}
          <div className="card-base p-5">
            <h3 className="section-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Evolução de Alunos
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="alunos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top alunos frequência */}
          <div className="card-base p-5">
            <h3 className="section-title flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              Ranking Frequência
            </h3>
            <div className="space-y-3">
              {alunosTop.map((aluno, index) => (
                <div key={aluno.nome} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-5 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </span>
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{aluno.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{aluno.nome}</p>
                    <div className="progress-bar mt-1">
                      <div className="progress-fill" style={{ width: `${(aluno.checkins / 31) * 100}%`, background: '#22c55e' }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {aluno.checkins}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions based on role */}
      <div className="card-base p-5">
        <h3 className="section-title">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {role === 'admin' && (
            <>
              <QuickAction href="/admin/alunos/novo" icon="👤" label="Novo Aluno" color="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" />
              <QuickAction href="/admin/financeiro/novo" icon="💳" label="Novo Pagamento" color="bg-green-50 dark:bg-green-900/20 hover:bg-green-100" />
              <QuickAction href="/admin/relatorios" icon="📊" label="Ver Relatórios" color="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100" />
              <QuickAction href="/admin/configuracoes" icon="⚙️" label="Configurações" color="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100" />
            </>
          )}
          {role === 'professor' && (
            <>
              <QuickAction href="/professor/treinos/novo" icon="📋" label="Novo Treino" color="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100" />
              <QuickAction href="/professor/exercicios" icon="💪" label="Exercícios" color="bg-green-50 dark:bg-green-900/20 hover:bg-green-100" />
              <QuickAction href="/professor/avaliacoes/nova" icon="📏" label="Nova Avaliação" color="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100" />
              <QuickAction href="/professor/alunos" icon="👥" label="Meus Alunos" color="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100" />
            </>
          )}
          {role === 'aluno' && (
            <>
              <QuickAction href="/aluno/treino" icon="🏋️" label="Iniciar Treino" color="bg-green-50 dark:bg-green-900/20 hover:bg-green-100" />
              <QuickAction href="/aluno/checkin" icon="✅" label="Check-in" color="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100" />
              <QuickAction href="/aluno/historico" icon="📅" label="Histórico" color="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100" />
              <QuickAction href="/aluno/avaliacoes" icon="📊" label="Avaliações" color="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <a
      href={href}
      className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 active:scale-95 group`}
    >
      <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{label}</span>
    </a>
  )
}

// Placeholder for missing import
function ClipboardList({ className }: { className?: string }) {
  return <Activity className={className} />
}
