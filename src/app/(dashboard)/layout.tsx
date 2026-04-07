'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, GraduationCap, Dumbbell, ClipboardList,
  BarChart3, CreditCard, CheckSquare, Settings, LogOut,
  ChevronRight, Activity, UserCircle, TrendingUp, Calendar,
  Trophy, Bell, Menu, X, CalendarDays, Smile, BarChart2, ClipboardCheck, Leaf, ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'

interface NavItem { href: string; label: string; icon: React.ElementType; roles: string[] }

const navItems: NavItem[] = [
  { href: '/dashboard',             label: 'Início',      icon: LayoutDashboard, roles: ['admin','professor','aluno'] },
  { href: '/admin/alunos',          label: 'Alunos',      icon: Users,           roles: ['admin'] },
  { href: '/admin/professores',     label: 'Professores', icon: GraduationCap,   roles: ['admin'] },
  { href: '/admin/financeiro',      label: 'Financeiro',  icon: CreditCard,      roles: ['admin'] },
  { href: '/admin/relatorios',      label: 'Relatórios',  icon: BarChart3,       roles: ['admin'] },
  { href: '/admin/configuracoes',   label: 'Config.',     icon: Settings,        roles: ['admin'] },
  { href: '/admin/admins',          label: 'Acesso Admin', icon: ShieldCheck,     roles: ['admin'] },
  { href: '/professor/alunos',      label: 'Alunos',      icon: Users,           roles: ['professor'] },
  { href: '/professor/agenda',      label: 'Agenda',      icon: CalendarDays,    roles: ['professor'] },
  { href: '/professor/exercicios',  label: 'Exercícios',  icon: Dumbbell,        roles: ['professor'] },
  { href: '/professor/treinos',     label: 'Treinos',     icon: ClipboardList,   roles: ['professor'] },
  { href: '/professor/avaliacoes',  label: 'Avaliações',  icon: Activity,        roles: ['professor'] },
  { href: '/professor/feedbacks',   label: 'Feedbacks',   icon: Smile,           roles: ['professor'] },
  { href: '/professor/anamneses',   label: 'Anamneses',   icon: ClipboardCheck,  roles: ['professor'] },
  { href: '/admin/ocupacao',        label: 'Ocupação',    icon: BarChart2,       roles: ['admin'] },
  { href: '/aluno/treino',          label: 'Treino',      icon: Dumbbell,        roles: ['aluno'] },
  { href: '/aluno/historico',       label: 'Histórico',   icon: Calendar,        roles: ['aluno'] },
  { href: '/aluno/avaliacoes',      label: 'Avaliações',  icon: TrendingUp,      roles: ['aluno'] },
  { href: '/aluno/ocupacao',        label: 'Ocupação',    icon: BarChart2,       roles: ['aluno'] },
  { href: '/aluno/anamnese',        label: 'Anamnese',    icon: ClipboardCheck,  roles: ['aluno'] },
  { href: '/aluno/checkin',         label: 'Check-in',    icon: CheckSquare,     roles: ['aluno'] },
  { href: '/aluno/frequencia',      label: 'Frequência',  icon: Trophy,          roles: ['aluno'] },
]

const mobileNavByRole: Record<string, NavItem[]> = {
  admin: [
    { href: '/dashboard',         label: 'Início',     icon: LayoutDashboard, roles: ['admin'] },
    { href: '/admin/alunos',      label: 'Alunos',     icon: Users,           roles: ['admin'] },
    { href: '/admin/financeiro',  label: 'Financeiro', icon: CreditCard,      roles: ['admin'] },
    { href: '/admin/relatorios',  label: 'Relatórios', icon: BarChart3,       roles: ['admin'] },
    { href: '/perfil',            label: 'Perfil',     icon: UserCircle,      roles: ['admin'] },
  ],
  professor: [
    { href: '/dashboard',             label: 'Início',     icon: LayoutDashboard, roles: ['professor'] },
    { href: '/professor/agenda',      label: 'Agenda',     icon: CalendarDays,    roles: ['professor'] },
    { href: '/professor/alunos',      label: 'Alunos',     icon: Users,           roles: ['professor'] },
    { href: '/professor/treinos',     label: 'Treinos',    icon: ClipboardList,   roles: ['professor'] },
    { href: '/perfil',                label: 'Perfil',     icon: UserCircle,      roles: ['professor'] },
  ],
  aluno: [
    { href: '/dashboard',        label: 'Início',     icon: LayoutDashboard, roles: ['aluno'] },
    { href: '/aluno/treino',     label: 'Treino',     icon: Dumbbell,        roles: ['aluno'] },
    { href: '/aluno/avaliacoes', label: 'Avaliações', icon: Activity,        roles: ['aluno'] },
    { href: '/aluno/checkin',    label: 'Check-in',   icon: CheckSquare,     roles: ['aluno'] },
    { href: '/perfil',           label: 'Perfil',     icon: UserCircle,      roles: ['aluno'] },
  ],
}

// ── Sidebar (memo = só re-renderiza se props mudarem) ────
interface SidebarProps {
  filteredNav: NavItem[]
  pathname: string
  usuario: { nome: string }
  role: string | null
  onClose: () => void
  onSignOut: () => void
}

const SidebarContent = memo(function SidebarContent({
  filteredNav, pathname, usuario, role, onClose, onSignOut,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--neon)', boxShadow: '0 0 16px var(--neon-glow)' }}>
          <Dumbbell className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-1)' }}>i9 Fitness</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sistema de Gestão</p>
        </div>
        <button onClick={onClose} className="lg:hidden ml-auto btn-ghost p-1.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {filteredNav.map(item => {
          const Icon     = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={clsx('sidebar-link', isActive && 'sidebar-link-active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--neon)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Links extras */}
      <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/perfil" className="sidebar-link" onClick={onClose}>
          <UserCircle className="w-4 h-4" /><span className="text-sm">Meu Perfil</span>
        </Link>
        <button onClick={onSignOut} className="sidebar-link w-full" style={{ color: '#f87171' }}>
          <LogOut className="w-4 h-4" /><span className="text-sm">Sair</span>
        </button>
      </div>

      {/* User info */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--bg-chip)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--neon)', boxShadow: '0 0 10px var(--neon-glow)' }}>
            <span className="text-black font-bold text-xs">
              {usuario.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{usuario.nome}</p>
            <p className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{role}</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { usuario, role, signOut, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!usuario?.id) return
    const { count } = await supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuario.id)
      .eq('lida', false)
    setUnreadCount(count ?? 0)
  }, [usuario?.id])

  // Busca notificações não lidas ao montar e escuta em tempo real
  useEffect(() => {
    fetchUnread()
    const channel = supabase
      .channel('notif-badge')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notificacoes',
        filter: `usuario_id=eq.${usuario?.id}`,
      }, () => fetchUnread())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchUnread, usuario?.id])

  // Zera o badge quando o usuário visita a página de notificações
  useEffect(() => {
    if (pathname === '/notificacoes') fetchUnread()
  }, [pathname, fetchUnread])

  useEffect(() => {
    if (!isLoading) {
      if (!usuario) {
        // Delay de segurança: dá tempo pro retry do fetchUsuario completar
        // antes de redirecionar (evita loop de login)
        const redirectTimer = setTimeout(() => {
          // Verifica novamente se realmente não há sessão ativa
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              router.replace('/login')
            } else {
              // Há sessão mas não há usuario — força um refresh da página
              console.warn('[Dashboard] Sessão ativa mas usuario null — recarregando...')
              window.location.reload()
            }
          })
        }, 2000)
        return () => clearTimeout(redirectTimer)
      } else if (usuario.configuracoes && (usuario.configuracoes as any).primeiro_acesso) {
        router.replace('/primeiro-acesso')
      }
    }
  }, [usuario, isLoading, router])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--neon)', boxShadow: '0 0 20px var(--neon-glow)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Carregando...</p>
      </div>
    </div>
  )

  if (!usuario) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--neon)', boxShadow: '0 0 20px var(--neon-glow)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Redirecionando...</p>
      </div>
    </div>
  )

  const filteredNav = navItems.filter(item => item.roles.includes(role ?? ''))
  const mobileNav   = mobileNavByRole[role ?? ''] ?? mobileNavByRole.aluno

  const handleSignOut = async () => {
    try { await signOut() } catch { /* ignore */ } finally { router.replace('/login') }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent
          filteredNav={filteredNav}
          pathname={pathname}
          usuario={usuario}
          role={role}
          onClose={() => setSidebarOpen(false)}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden modal-backdrop"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Mobile Drawer ── */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 lg:hidden',
        'transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent
          filteredNav={filteredNav}
          pathname={pathname}
          usuario={usuario}
          role={role}
          onClose={() => setSidebarOpen(false)}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
          }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
              <Menu className="w-5 h-5" />
            </button>
            {/* Logo pequeno no mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--neon)', boxShadow: '0 0 10px var(--neon-glow)' }}>
                <Dumbbell className="w-4 h-4 text-black" />
              </div>
              <span className="font-black text-sm tracking-tight" style={{ color: 'var(--text-1)' }}>
                i9 Fitness
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link href="/notificacoes" className="relative btn-ghost p-2 rounded-lg">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
              )}
            </Link>
            <button onClick={handleSignOut} className="btn-ghost p-2 rounded-lg lg:hidden"
              style={{ color: '#f87171' }} title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-28 lg:pb-8">
            {children}
          </div>
        </main>

        {/* ── Bottom Nav Mobile ── */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 safe-bottom"
          style={{
            background: 'rgba(9, 9, 14, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -20px 40px rgba(0,0,0,0.5)',
          }}>
          <div className="flex items-stretch justify-around px-2 py-1">
            {mobileNav.map(item => {
              const Icon     = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl flex-1 relative transition-all duration-200 active:scale-90"
                  style={{
                    minHeight: '56px',
                    background: isActive ? 'rgba(255,107,0,0.1)' : 'transparent',
                  }}>

                  {/* Indicador neon no topo */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                      style={{
                        background: 'var(--neon)',
                        boxShadow: '0 0 8px var(--neon-glow)',
                      }} />
                  )}

                  {/* Ícone */}
                  <Icon
                    className={clsx('transition-all duration-200', isActive ? 'scale-110' : 'scale-100')}
                    style={{
                      width: '22px',
                      height: '22px',
                      stroke: isActive ? 'var(--neon)' : 'var(--text-3)',
                      filter: isActive ? 'drop-shadow(0 0 6px var(--neon-glow))' : 'none',
                    }}
                  />

                  {/* Label */}
                  <span className="text-[10px] font-medium leading-tight transition-colors duration-200"
                    style={{ color: isActive ? 'var(--neon)' : 'var(--text-3)' }}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

      </div>
    </div>
  )
}
