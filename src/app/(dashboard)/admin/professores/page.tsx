'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Search, Edit, Ban, CheckCircle2, Eye, Phone, Mail, Users, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface Professor {
  id: string
  cref: string | null
  especialidades: string[] | null
  bio: string | null
  usuario: {
    id: string
    nome: string
    email: string
    telefone: string | null
    status: string
  }
  _count?: { alunos: number }
}

const especialidadeColors: Record<string, string> = {
  'Musculação': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Crossfit': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Funcional': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pilates': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Yoga': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
}

type ModalState = { type: 'none' } | { type: 'view'; prof: Professor } | { type: 'form'; prof: Professor | null }

export default function ProfessoresPage() {
  const { usuario } = useAuth()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cref: '', especialidades: [] as string[], bio: '', senha: '123456' })
  const [saving, setSaving] = useState(false)

  const todasEspecialidades = ['Musculação', 'Crossfit', 'Funcional', 'Pilates', 'Yoga', 'Alongamento', 'Powerlifting', 'Natação']

  const fetchProfessores = useCallback(async () => {
    if (!usuario?.academia_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('professores')
        .select(`
          id, cref, especialidades, bio,
          usuario:usuarios!professores_usuario_id_fkey (id, nome, email, telefone, status)
        `)
        .eq('academia_id', usuario.academia_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfessores((data as unknown as Professor[]) ?? [])
    } catch {
      toast.error('Erro ao carregar professores')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchProfessores() }, [fetchProfessores])

  const abrirNovo = () => {
    setForm({ nome: '', email: '', telefone: '', cref: '', especialidades: [], bio: '', senha: '123456' })
    setModal({ type: 'form', prof: null })
  }

  const abrirEditar = (prof: Professor) => {
    setForm({
      nome: prof.usuario?.nome ?? '',
      email: prof.usuario?.email ?? '',
      telefone: prof.usuario?.telefone ?? '',
      cref: prof.cref ?? '',
      especialidades: prof.especialidades ?? [],
      bio: prof.bio ?? '',
      senha: '',
    })
    setModal({ type: 'form', prof })
  }

  const salvar = async () => {
    if (!form.nome || !form.email) { toast.error('Nome e email são obrigatórios'); return }
    if (!usuario?.academia_id) return
    setSaving(true)

    try {
      if (modal.type === 'form' && !modal.prof) {
        // Novo professor — criar via API interna
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            telefone: form.telefone,
            password: form.senha || '123456',
            role: 'professor',
            academia_id: usuario.academia_id,
            cref: form.cref,
            especialidades: form.especialidades,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Professor cadastrado!')
      } else if (modal.type === 'form' && modal.prof) {
        // Editar
        await supabase.from('usuarios').update({ nome: form.nome, telefone: form.telefone }).eq('id', modal.prof.usuario.id)
        await supabase.from('professores').update({ cref: form.cref, especialidades: form.especialidades, bio: form.bio }).eq('id', modal.prof.id)
        toast.success('Professor atualizado!')
      }
      setModal({ type: 'none' })
      fetchProfessores()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (prof: Professor) => {
    const novo = prof.usuario.status === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase.from('usuarios').update({ status: novo }).eq('id', prof.usuario.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success(`Professor ${novo === 'ativo' ? 'ativado' : 'desativado'}`)
    fetchProfessores()
  }

  const filtered = professores.filter(p =>
    p.usuario?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.usuario?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Professores</h1>
          <p className="page-subtitle">{professores.length} professor{professores.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Professor</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card text-center">
          <GraduationCap className="w-6 h-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{professores.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="stat-card text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {professores.filter(p => p.usuario?.status === 'ativo').length}
          </p>
          <p className="text-xs text-gray-500">Ativos</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar professor..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(prof => (
            <div key={prof.id} className="card-base p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-700 dark:text-primary-400">
                      {prof.usuario?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{prof.usuario?.nome}</p>
                    <p className="text-xs text-gray-400">{prof.cref ?? 'CREF não informado'}</p>
                  </div>
                </div>
                <span className={prof.usuario?.status === 'ativo' ? 'badge-success' : 'badge-gray'}>
                  {prof.usuario?.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {prof.especialidades && prof.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prof.especialidades.map(esp => (
                    <span key={esp} className={`text-xs px-2 py-0.5 rounded-full font-medium ${especialidadeColors[esp] ?? 'badge-gray'}`}>
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span className="truncate">{prof.usuario?.email}</span></div>
                {prof.usuario?.telefone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{prof.usuario.telefone}</span></div>}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setModal({ type: 'view', prof })} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Ver
                </button>
                <button onClick={() => abrirEditar(prof)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" />Editar
                </button>
                <button onClick={() => toggleStatus(prof)} className={`btn-secondary text-xs py-1.5 px-3 ${prof.usuario?.status === 'ativo' ? 'text-red-500' : 'text-green-500'}`}>
                  {prof.usuario?.status === 'ativo' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full card-base p-12 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {professores.length === 0 ? 'Nenhum professor cadastrado ainda.' : 'Nenhum resultado encontrado.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {modal.type === 'form' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {modal.prof ? 'Editar Professor' : 'Novo Professor'}
              </h2>
              <button onClick={() => setModal({ type: 'none' })} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="label-base">Nome *</label><input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-base">Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-base" disabled={!!modal.prof} /></div>
                <div><label className="label-base">Telefone</label><input type="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} className="input-base" /></div>
              </div>
              <div><label className="label-base">CREF</label><input type="text" value={form.cref} onChange={e => setForm(p => ({ ...p, cref: e.target.value }))} className="input-base" placeholder="CREF 000000-G/MG" /></div>
              {!modal.prof && (
                <div><label className="label-base">Senha inicial</label><input type="text" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} className="input-base" /></div>
              )}
              <div>
                <label className="label-base">Especialidades</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {todasEspecialidades.map(esp => (
                    <button key={esp} type="button"
                      onClick={() => setForm(p => ({ ...p, especialidades: p.especialidades.includes(esp) ? p.especialidades.filter(e => e !== esp) : [...p.especialidades, esp] }))}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${form.especialidades.includes(esp) ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {esp}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label-base">Bio</label><textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="input-base resize-none" rows={3} /></div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setModal({ type: 'none' })} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvar} disabled={saving || !form.nome || !form.email} className="btn-primary flex-1">
                {saving ? 'Salvando...' : modal.prof ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
