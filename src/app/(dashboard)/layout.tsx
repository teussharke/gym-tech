'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  LayoutDashboard, Users, GraduationCap, Dumbbell, ClipboardList,
  BarChart3, CreditCard, CheckSquare, Bell, Settings, LogOut,
  Menu, X, Moon, Sun, ChevronRight, Activity, UserCircle,
  TrendingUp, Calendar, Trophy
} from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: string[]
  badge?: number
}

const navItems: NavItem[] = [
  // Admin routes
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'professor', 'aluno'] },
  { href: '/admin/alunos', label: 'Alunos', icon: Users, roles: ['admin'] },
  { href: '/admin/professores', label: 'Professores', icon: GraduationCap, roles: ['admin'] },
  { href: '/admin/financeiro', label: 'Financeiro', icon: CreditCard, roles: ['admin'] },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin'] },
  
  // Professor routes
  { href: '/professor/alunos', label: 'Meus Alunos', icon: Users, roles: ['professor'] },
  { href: '/professor/exercicios', label: 'Exercícios', icon: Dumbbell, roles: ['professor'] },
  { href: '/professor/treinos', label: 'Treinos', icon: ClipboardList, roles: ['professor'] },
  { href: '/professor/avaliacoes', label: 'Avaliações', icon: Activity, roles: ['professor'] },
  
  // Aluno routes
  { href: '/aluno/treino', label: 'Meu Treino', icon: Dumbbell, roles: ['aluno'] },
  { href: '/aluno/historico', label: 'Histórico', icon: Calendar, roles: ['aluno'] },
  { href: '/aluno/avaliacoes', label: 'Avaliações', icon: TrendingUp, roles: ['aluno'] },
  { href: '/aluno/checkin', label: 'Check-in', icon: CheckSquare, roles: ['aluno'] },
  { href: '/aluno/frequencia', label: 'Frequência', icon: Trophy, roles: ['aluno'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { usuario, role, signOut, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationCount] = useState(3)

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push('/login')
    }
  }, [usuario, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  const filteredNav = navItems.filter(item => item.roles.includes(role ?? ''))

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white text-sm">GymFlow</h1>
          <p className="text-xs text-gray-400">Sistema de Academia</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4 text-primary-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-1">
        <Link
          href="/perfil"
          className="sidebar-link"
          onClick={() => setSidebarOpen(false)}
        >
          <UserCircle className="w-5 h-5" />
          <span>Meu Perfil</span>
        </Link>
        <Link
          href="/admin/configuracoes"
          className="sidebar-link"
          onClick={() => setSidebarOpen(false)}
        >
          <Settings className="w-5 h-5" />
          <span>Configurações</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>

      {/* User info */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <Link href="/perfil" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="relative w-9 h-9 flex-shrink-0">
            {usuario.foto_url ? (
              <Image
                src={usuario.foto_url}
                alt={usuario.nome}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{usuario.nome}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
          </div>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700',
        'transform transition-transform duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-ghost p-2"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb */}
            <div className="hidden sm:block">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {filteredNav.find(n => n.href === pathname || pathname.startsWith(n.href + '/'))?.label ?? 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-ghost p-2 rounded-lg"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <Link href="/notificacoes" className="relative btn-ghost p-2 rounded-lg">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>

            {/* User avatar (mobile) */}
            <Link href="/perfil" className="lg:hidden">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
