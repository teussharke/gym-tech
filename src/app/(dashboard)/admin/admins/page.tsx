'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldOff, Search, RefreshCw, Users, Crown, AlertTriangle, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  status: string
  foto_url: string | null
}

// ── Modal de confirmação ─────────────────────────────────────────
function ConfirmModal({
  usuario,
  acao,       // 'promover' | 'remover'
  onConfirm,
  onCancel,
  loading,
}: {
  usuario: Usuario
  acao: 'promover' | 'remover'
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const promovendo = acao === 'promover'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="card-base w-full max-w-md p-6 space-y-5 animate-scale-in">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${promovendo ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {promovendo
              ? <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              : <ShieldOff className="w-6 h-6 text-red-600 dark:text-red-400" />
            }
          </div>
          <button onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {promovendo ? 'Conceder acesso Admin?' : 'Remover acesso Admin?'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            <strong className="text-gray-700 dark:text-gray-300">{usuario.nome}</strong>
            {promovendo
              ? ' terá acesso total ao painel administrativo — alunos, professores, financeiro e configurações.'
              : ' perderá o acesso admin e voltará ao papel original.'
            }
          </p>
        </div>

        {promovendo && (
          <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Apenas conceda acesso admin para pessoas de confiança. Admins podem ver e modificar todos os dados da academia.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary text-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              promovendo
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : promovendo
                ? <><ShieldCheck className="w-4 h-4" /> Conceder Admin</>
                : <><ShieldOff className="w-4 h-4" /> Remover Admin</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de usuário ──────────────────────────────────────────────
function UserCard({
  u,
  onAlterarRole,
  isCurrentUser,
}: {
  u: Usuario
  onAlterarRole: (u: Usuario) => void
  isCurrentUser: boolean
}) {
  const isAdmin = u.role === 'admin'
  const roleLabel: Record<string, string> = { admin: 'Admin', professor: 'Professor', aluno: 'Aluno' }
  const roleBg: Record<string, string> = {
    admin:    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    professor:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    aluno:    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  }

  return (
    <div className={`card-base p-4 flex items-center gap-3 ${isAdmin ? 'ring-2 ring-purple-400/30' : ''}`}>
      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
        {u.foto_url
          ? <img src={u.foto_url} alt={u.nome} className="w-full h-full object-cover" />
          : <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
              {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{u.nome}</p>
          {isCurrentUser && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
              Você
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
      </div>

      {/* Role badge */}
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 flex items-center gap-1 ${roleBg[u.role] ?? roleBg.aluno}`}>
        {isAdmin && <Crown className="w-3 h-3" />}
        {roleLabel[u.role] ?? u.role}
      </span>

      {/* Ação */}
      <button
        onClick={() => onAlterarRole(u)}
        disabled={isCurrentUser}
        title={isCurrentUser ? 'Você não pode alterar seu próprio acesso' : isAdmin ? 'Remover acesso Admin' : 'Tornar Admin'}
        className={`p-2 rounded-xl transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
          isAdmin
            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40'
        }`}
      >
        {isAdmin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────
export default function AdminsPage() {
  const { usuario } = useAuth()
  const [todos, setTodos] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'admins' | 'professores' | 'alunos'>('todos')
  const [confirmando, setConfirmando] = useState<Usuario | null>(null)
  const [alterando, setAlterando] = useState(false)

  const fetchUsuarios = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, status, foto_url')
        .eq('academia_id', usuario.academia_id)
        .in('status', ['ativo', 'inativo'])
        .order('role', { ascending: true })
        .order('nome', { ascending: true })
      if (error) throw error
      setTodos((data as Usuario[]) ?? [])
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const handleAlterarRole = (u: Usuario) => {
    // Não deixa admin revogar o próprio acesso pela interface
    if (u.id === usuario?.id) return
    setConfirmando(u)
  }

  const confirmarAlteracao = async () => {
    if (!confirmando) return
    setAlterando(true)

    let novoRole: string
    if (confirmando.role === 'admin') {
      // Descobrir o papel original antes de ter virado admin
      const [{ data: profData }, { data: alunoData }] = await Promise.all([
        supabase.from('professores').select('id').eq('usuario_id', confirmando.id).maybeSingle(),
        supabase.from('alunos').select('id').eq('usuario_id', confirmando.id).maybeSingle(),
      ])
      if (alunoData) novoRole = 'aluno'
      else if (profData) novoRole = 'professor'
      else novoRole = 'professor' // fallback seguro
    } else {
      novoRole = 'admin'
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ role: novoRole })
      .eq('id', confirmando.id)

    if (error) {
      toast.error('Erro ao alterar permissão')
    } else {
      toast.success(novoRole === 'admin'
        ? `${confirmando.nome} agora é Admin! 🛡️`
        : `Acesso admin removido de ${confirmando.nome}`)
      fetchUsuarios()
    }
    setAlterando(false)
    setConfirmando(null)
  }

  const admins   = todos.filter(u => u.role === 'admin')
  const filtered = todos.filter(u => {
    const match = u.nome.toLowerCase().includes(search.toLowerCase()) ||
                  u.email.toLowerCase().includes(search.toLowerCase())
    if (!match) return false
    if (filtro === 'admins')      return u.role === 'admin'
    if (filtro === 'professores') return u.role === 'professor'
    if (filtro === 'alunos')      return u.role === 'aluno'
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {confirmando && (
        <ConfirmModal
          usuario={confirmando}
          acao={confirmando.role === 'admin' ? 'remover' : 'promover'}
          onConfirm={confirmarAlteracao}
          onCancel={() => setConfirmando(null)}
          loading={alterando}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Acesso Admin</h1>
          <p className="page-subtitle">Gerencie quem tem acesso administrativo</p>
        </div>
        <button onClick={fetchUsuarios} disabled={loading} className="btn-ghost p-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Admins atuais */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-purple-500" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Administradores ({admins.length})
          </h2>
        </div>
        {admins.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum admin encontrado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {a.foto_url
                    ? <img src={a.foto_url} alt={a.nome} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                        {a.nome.split(' ')[0][0]}
                      </span>
                  }
                </div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{a.nome.split(' ')[0]}</span>
                {a.id === usuario?.id && (
                  <span className="text-xs text-purple-400">(você)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Busca e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'todos',       label: `Todos (${todos.length})` },
            { key: 'admins',      label: `Admins (${admins.length})` },
            { key: 'professores', label: `Professores (${todos.filter(u => u.role === 'professor').length})` },
            { key: 'alunos',      label: `Alunos (${todos.filter(u => u.role === 'aluno').length})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key as typeof filtro)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filtro === f.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <UserCard
              key={u.id}
              u={u}
              onAlterarRole={handleAlterarRole}
              isCurrentUser={u.id === usuario?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
