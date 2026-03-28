'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import {
  Users, UserCheck, AlertCircle, DollarSign, CheckSquare,
  TrendingUp, Dumbbell, Calendar, Trophy, ArrowRight,
  Flame, Target, Clock, Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { SkeletonDashboard } from '@/components/UIComponents'

// ── Admin Stats ─────────────────────────────────────────
interface AdminStats {
  totalAlunos: number
  alunosAtivos: number
  inadimplentes: number
  checkinHoje: number
  faturamentoMes: number
}

// ── Aluno Stats ─────────────────────────────────────────
interface AlunoStats {
  checkinsMes: number
  totalTreinos: number
  proximoTreino: string | null
  ultimoCheckin: string | null
  sequencia: number
  statusAvaliacao: 'pendente' | 'aprovado' | null
  proximaAvaliacao: string | null
}

// ── Professor Stats ─────────────────────────────────────────
interface ProfessorStats {
  totalAlunos: number
  solicitacoesPendentes: number
  proximosHorarios: Array<{ data_hora: string; duracao_min: number }>
}

function GradientStatCard({
  title, value, icon: Icon, gradient, subtitle, link,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  gradient: string
  subtitle?: string
  link?: string
}) {
  const content = (
    <div className={`stat-card-gradient ${gradient} relative overflow-hidden`}>
      {/* Círculo decorativo */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -right-1 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/80 text-xs font-medium">{title}</p>
          <Icon className="w-5 h-5 text-white/70" />
        </div>
        <p className="text-2xl font-black text-white">{value}</p>
        {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )

  if (link) return <Link href={link} className="block active:scale-95 transition-transform">{content}</Link>
  return content
}

export default function DashboardPage() {
  const { usuario, role } = useAuth()
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [alunoStats, setAlunoStats] = useState<AlunoStats | null>(null)
  const [professorStats, setProfessorStats] = useState<ProfessorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alunosInadimplentes, setAlunosInadimplentes] = useState<{ nome: string; vencimento: string }[]>([])

  const fetchAdminStats = useCallback(async () => {
    if (!usuario?.academia_id) return
    const id = usuario.academia_id

    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [
      { count: total },
      { count: ativos },
      { count: inadimplentes },
      { count: checkins },
      { data: pagamentos },
      { data: inadList },
    ] = await Promise.all([
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('academia_id', id),
      supabase.from('alunos').select('*, usuarios!inner(*)', { count: 'exact', head: true }).eq('academia_id', id).eq('usuarios.status', 'ativo'),
      supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('academia_id', id).eq('status_pagamento', 'vencido'),
      supabase.from('presencas').select('*', { count: 'exact', head: true }).eq('academia_id', id).gte('data_checkin', `${hoje}T00:00:00`).lte('data_checkin', `${hoje}T23:59:59`),
      supabase.from('pagamentos').select('valor, valor_desconto').eq('academia_id', id).eq('status', 'pago').gte('data_pagamento', inicioMes),
      supabase.from('alunos').select('usuario_id, data_vencimento').eq('academia_id', id).eq('status_pagamento', 'vencido').limit(5),
    ])

    const faturamento = (pagamentos ?? []).reduce((s, p) => s + (p.valor - (p.valor_desconto || 0)), 0)

    // Nomes dos inadimplentes
    if (inadList?.length) {
      const usuIds = inadList.map(a => a.usuario_id)
      const { data: usu } = await supabase.from('usuarios').select('id, nome').in('id', usuIds)
      const map = Object.fromEntries((usu ?? []).map(u => [u.id, u.nome]))
      setAlunosInadimplentes(inadList.map(a => ({
        nome: map[a.usuario_id] ?? '—',
        vencimento: a.data_vencimento ? format(new Date(a.data_vencimento), 'dd/MM') : '—',
      })))
    }

    setAdminStats({
      totalAlunos: total ?? 0,
      alunosAtivos: ativos ?? 0,
      inadimplentes: inadimplentes ?? 0,
      checkinHoje: checkins ?? 0,
      faturamentoMes: faturamento,
    })
  }, [usuario?.academia_id])

  const fetchAlunoStats = useCallback(async () => {
    if (!usuario?.id) return

    const { data: aluno } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (!aluno) return

    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [
      { data: presencas },
      { count: totalTreinos },
      { data: proximoTreino },
      { data: ultimaPresenca },
      { data: solicitacoes },
    ] = await Promise.all([
      supabase.from('presencas').select('data_checkin').eq('aluno_id', aluno.id).gte('data_checkin', inicioMes),
      supabase.from('historico_treinos').select('*', { count: 'exact', head: true }).eq('aluno_id', aluno.id),
      supabase.from('treinos').select('nome, dia_semana').eq('aluno_id', aluno.id).eq('ativo', true).order('created_at', { ascending: false }).limit(1),
      supabase.from('presencas').select('data_checkin').eq('aluno_id', aluno.id).order('data_checkin', { ascending: false }).limit(1),
      supabase.from('solicitacoes_avaliacao').select('status, horarios_disponiveis(data_hora)').eq('aluno_id', aluno.id).in('status', ['pendente', 'aprovado']).order('created_at', { ascending: false }).limit(1),
    ])

    // Calcular sequência de dias consecutivos
    const diasComPresenca = new Set((presencas ?? []).map(p => p.data_checkin.split('T')[0]))
    let sequencia = 0
    const hoje = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoje)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (diasComPresenca.has(ds)) sequencia++
      else if (i > 0) break
    }

    const solicitacao = solicitacoes?.[0] as any
    let statusAvaliacao: 'pendente' | 'aprovado' | null = null
    let proximaAvaliacao: string | null = null

    if (solicitacao) {
      statusAvaliacao = solicitacao.status as 'pendente' | 'aprovado'
      if (solicitacao.horarios_disponiveis?.data_hora) {
        proximaAvaliacao = solicitacao.horarios_disponiveis.data_hora
      }
    }

    setAlunoStats({
      checkinsMes: diasComPresenca.size,
      totalTreinos: totalTreinos ?? 0,
      proximoTreino: proximoTreino?.[0]?.nome ?? null,
      ultimoCheckin: ultimaPresenca?.[0]?.data_checkin ?? null,
      sequencia,
      statusAvaliacao,
      proximaAvaliacao,
    })
  }, [usuario?.id])

  const fetchProfessorStats = useCallback(async () => {
    if (!usuario?.id) return

    const { data: prof } = await supabase.from('professores').select('id, academia_id').eq('usuario_id', usuario.id).single()
    if (!prof) return

    const [
      { count: totalAlunos },
      { count: solicitacoesPendentes },
      { data: proximosHorarios },
    ] = await Promise.all([
      supabase.from('treinos').select('aluno_id', { count: 'exact', head: true }).eq('professor_id', prof.id),
      supabase.from('solicitacoes_avaliacao').select('*', { count: 'exact', head: true }).eq('professor_id', prof.id).eq('status', 'pendente'),
      supabase.from('horarios_disponiveis').select('data_hora, duracao_min').eq('professor_id', prof.id).eq('disponivel', true).gt('data_hora', new Date().toISOString()).order('data_hora', { ascending: true }).limit(3),
    ])

    setProfessorStats({
      totalAlunos: totalAlunos ?? 0,
      solicitacoesPendentes: solicitacoesPendentes ?? 0,
      proximosHorarios: (proximosHorarios as any) ?? [],
    })
  }, [usuario?.id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (role === 'admin') await fetchAdminStats()
      else if (role === 'aluno') await fetchAlunoStats()
      else if (role === 'professor') await fetchProfessorStats()
      setLoading(false)
    }
    if (role) load()
  }, [role, fetchAdminStats, fetchAlunoStats, fetchProfessorStats])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (loading) return <SkeletonDashboard />

  const quickActions = {
    admin: [
      { href: '/admin/alunos/novo', icon: '👤', label: 'Novo Aluno',     gradient: 'from-blue-500 to-blue-600' },
      { href: '/admin/financeiro',  icon: '💳', label: 'Financeiro',     gradient: 'from-green-500 to-green-600' },
      { href: '/admin/relatorios',  icon: '📊', label: 'Relatórios',     gradient: 'from-purple-500 to-purple-600' },
      { href: '/admin/configuracoes',icon: '⚙️',label: 'Config.',        gradient: 'from-gray-500 to-gray-600' },
    ],
    professor: [
      { href: '/professor/treinos/novo', icon: '📋', label: 'Novo Treino',    gradient: 'from-blue-500 to-blue-600' },
      { href: '/professor/exercicios',   icon: '💪', label: 'Exercícios',     gradient: 'from-orange-500 to-orange-600' },
      { href: '/professor/avaliacoes',   icon: '📏', label: 'Avaliação',      gradient: 'from-purple-500 to-purple-600' },
      { href: '/professor/alunos',       icon: '👥', label: 'Meus Alunos',   gradient: 'from-green-500 to-green-600' },
    ],
    aluno: [
      { href: '/aluno/treino',    icon: '🏋️', label: 'Treino',      gradient: 'from-orange-500 to-orange-600' },
      { href: '/aluno/checkin',   icon: '✅',  label: 'Check-in',   gradient: 'from-green-500 to-green-600' },
      { href: '/aluno/historico', icon: '📅',  label: 'Histórico',  gradient: 'from-blue-500 to-blue-600' },
      { href: '/aluno/avaliacoes',icon: '📊',  label: 'Avaliações', gradient: 'from-purple-500 to-purple-600' },
    ],
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Saudação */}
      <div className="animate-fade-in">
        <h1 className="page-title">
          {greeting()}, {usuario?.nome.split(' ')[0]}! {role === 'aluno' ? '💪' : '👋'}
        </h1>
        <p className="page-subtitle capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* ── ADMIN STATS ── */}
      {role === 'admin' && adminStats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 animate-fade-in stagger-1">
            <GradientStatCard title="Total Alunos"   value={adminStats.totalAlunos}   icon={Users}       gradient="gradient-blue"    link="/admin/alunos" />
            <GradientStatCard title="Ativos"         value={adminStats.alunosAtivos}  icon={UserCheck}   gradient="gradient-success" link="/admin/alunos" />
            <GradientStatCard title="Inadimplentes"  value={adminStats.inadimplentes} icon={AlertCircle} gradient="gradient-danger"  link="/admin/financeiro" />
            <GradientStatCard title="Check-in Hoje"  value={adminStats.checkinHoje}   icon={CheckSquare} gradient="gradient-purple"  />
            <GradientStatCard
              title="Faturamento/Mês"
              value={`R$${adminStats.faturamentoMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              gradient="gradient-orange"
              link="/admin/financeiro"
            />
          </div>

          {/* Alerta inadimplentes */}
          {alunosInadimplentes.length > 0 && (
            <div className="card-base p-4 border-l-4 border-l-red-500 animate-slide-right stagger-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Alunos Inadimplentes
                </h3>
                <Link href="/admin/financeiro" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {alunosInadimplentes.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{a.nome}</span>
                    <span className="badge-danger">Venceu {a.vencimento}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ALUNO STATS ── */}
      {role === 'aluno' && alunoStats && (
        <>
          <div className="grid grid-cols-2 gap-3 animate-fade-in stagger-1">
            <GradientStatCard
              title="Check-ins/Mês"
              value={`${alunoStats.checkinsMes}/20`}
              icon={Calendar}
              gradient="gradient-orange"
              subtitle={`${Math.round((alunoStats.checkinsMes / 20) * 100)}% da meta`}
              link="/aluno/frequencia"
            />
            <GradientStatCard
              title="Treinos Feitos"
              value={alunoStats.totalTreinos}
              icon={Dumbbell}
              gradient="gradient-blue"
              link="/aluno/historico"
            />
          </div>

          {/* Próxima avaliação */}
          {alunoStats.proximaAvaliacao && (
            <div className="card-base p-4 border-l-4 border-l-purple-500 animate-slide-right stagger-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Próxima Avaliação</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {format(new Date(alunoStats.proximaAvaliacao), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Status: <span className={alunoStats.statusAvaliacao === 'aprovado' ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                      {alunoStats.statusAvaliacao === 'aprovado' ? 'Aprovada' : 'Pendente'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sequência */}
          {alunoStats.sequencia > 0 && (
            <div className="card-base p-4 bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-l-orange-500 animate-slide-right stagger-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-orange rounded-2xl flex items-center justify-center flex-shrink-0 animate-float">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    🔥 {alunoStats.sequencia} {alunoStats.sequencia === 1 ? 'dia' : 'dias'} seguidos!
                  </p>
                  <p className="text-xs text-gray-500">Continue assim para bater sua meta!</p>
                </div>
              </div>
            </div>
          )}

          {/* Próximo treino */}
          {alunoStats.proximoTreino && (
            <Link href="/aluno/treino" className="block animate-fade-in stagger-4">
              <div className="card-base p-4 hover:shadow-md transition-all hover-glow-orange group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-orange rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Treino do dia</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{alunoStats.proximoTreino}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* Meta do mês */}
          <div className="card-base p-5 animate-fade-in stagger-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />Meta do Mês
              </h3>
              <span className="text-sm font-bold text-orange-500">{alunoStats.checkinsMes}/20</span>
            </div>
            <div className="progress-bar h-3 mb-2">
              <div className="progress-fill h-3" style={{ width: `${Math.min((alunoStats.checkinsMes / 20) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400">
              {alunoStats.checkinsMes >= 20
                ? '🏆 Meta atingida! Parabéns!'
                : `Faltam ${20 - alunoStats.checkinsMes} dias para atingir a meta`
              }
            </p>
          </div>
        </>
      )}

      {/* ── PROFESSOR STATS ── */}
      {role === 'professor' && professorStats && (
        <>
          <div className="grid grid-cols-2 gap-3 animate-fade-in stagger-1">
            <GradientStatCard
              title="Meus Alunos"
              value={professorStats.totalAlunos}
              icon={Users}
              gradient="gradient-blue"
              link="/professor/alunos"
            />
            <GradientStatCard
              title="Solicitações"
              value={professorStats.solicitacoesPendentes}
              icon={AlertCircle}
              gradient={professorStats.solicitacoesPendentes > 0 ? 'gradient-orange' : 'gradient-gray'}
              link="/professor/agenda"
            />
          </div>

          {/* Próximos horários */}
          {professorStats.proximosHorarios.length > 0 && (
            <div className="card-base p-5 animate-slide-right stagger-2">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-orange-500" />Próximos Horários
              </h3>
              <div className="space-y-2">
                {professorStats.proximosHorarios.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(h.data_hora), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {format(new Date(h.data_hora), 'HH:mm', { locale: ptBR })} · {h.duracao_min}min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── AÇÕES RÁPIDAS ── */}
      <div className="card-base p-5 animate-fade-in" style={{ animationDelay: role === 'aluno' ? '500ms' : role === 'professor' ? '400ms' : '300ms' }}>
        <h3 className="section-title flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />Ações Rápidas
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(quickActions[role as keyof typeof quickActions] ?? quickActions.aluno).map(({ href, icon, label, gradient }, i) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${gradient} active:scale-95 transition-all duration-200 hover:shadow-lg group stagger-${i + 1}`}>
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
              <span className="text-xs font-semibold text-white text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sem dados */}
      {role === 'admin' && adminStats && adminStats.totalAlunos === 0 && (
        <div className="card-base p-8 text-center border-2 border-dashed border-orange-200 dark:border-orange-800 animate-scale-in">
          <div className="text-5xl mb-3 animate-float">🏋️</div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Academia configurada!</h3>
          <p className="text-gray-500 text-sm mb-4">Cadastre seus primeiros alunos e professores.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/admin/alunos/novo" className="btn-primary text-sm">+ Cadastrar Aluno</Link>
            <Link href="/admin/professores" className="btn-secondary text-sm">+ Cadastrar Professor</Link>
          </div>
        </div>
      )}
    </div>
  )
}
