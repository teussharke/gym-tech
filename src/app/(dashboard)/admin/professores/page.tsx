'use client'

import { useState } from 'react'
import {
  UserPlus, Search, Edit, Ban, Eye, Phone, Mail,
  GraduationCap, Users, CheckCircle2, Award
} from 'lucide-react'

const mockProfessores = [
  {
    id: '1',
    nome: 'Carlos Eduardo Souza',
    email: 'carlos@gymflow.com',
    telefone: '(32) 99999-1111',
    cref: 'CREF 123456-G/MG',
    especialidades: ['Musculação', 'Crossfit', 'Funcional'],
    alunos: 12,
    status: 'ativo',
    data_admissao: '2022-03-15',
    bio: 'Especialista em hipertrofia e condicionamento físico com 8 anos de experiência.',
  },
  {
    id: '2',
    nome: 'Ana Paula Ferreira',
    email: 'ana@gymflow.com',
    telefone: '(32) 99999-2222',
    cref: 'CREF 654321-G/MG',
    especialidades: ['Pilates', 'Yoga', 'Alongamento'],
    alunos: 18,
    status: 'ativo',
    data_admissao: '2021-06-01',
    bio: 'Focada em bem-estar, flexibilidade e qualidade de vida.',
  },
  {
    id: '3',
    nome: 'Roberto Lima',
    email: 'roberto@gymflow.com',
    telefone: '(32) 99999-3333',
    cref: 'CREF 789012-G/MG',
    especialidades: ['Musculação', 'Powerlifting'],
    alunos: 9,
    status: 'inativo',
    data_admissao: '2023-01-10',
    bio: 'Especialista em força e powerlifting.',
  },
]

const especialidadeColors: Record<string, string> = {
  'Musculação': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Crossfit': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Funcional': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pilates': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Yoga': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Alongamento': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Powerlifting': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

type ModalState = { type: 'none' } | { type: 'view'; id: string } | { type: 'form'; id: string | null }

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState(mockProfessores)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  // Form state
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cref: '',
    especialidades: [] as string[], bio: '',
  })

  const filtered = professores.filter(p => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.cref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchSearch && matchStatus
  })

  const professorSelecionado = modal.type === 'view' || (modal.type === 'form' && modal.id)
    ? professores.find(p => p.id === (modal as { id: string }).id)
    : null

  const abrirNovo = () => {
    setForm({ nome: '', email: '', telefone: '', cref: '', especialidades: [], bio: '' })
    setModal({ type: 'form', id: null })
  }

  const abrirEditar = (prof: typeof mockProfessores[0]) => {
    setForm({
      nome: prof.nome,
      email: prof.email,
      telefone: prof.telefone,
      cref: prof.cref,
      especialidades: prof.especialidades,
      bio: prof.bio,
    })
    setModal({ type: 'form', id: prof.id })
  }

  const salvar = () => {
    if (modal.type !== 'form') return
    if (modal.id) {
      setProfessores(prev => prev.map(p => p.id === modal.id ? { ...p, ...form } : p))
    } else {
      setProfessores(prev => [...prev, {
        id: String(Date.now()),
        ...form,
        alunos: 0,
        status: 'ativo',
        data_admissao: new Date().toISOString().split('T')[0],
      }])
    }
    setModal({ type: 'none' })
  }

  const toggleStatus = (id: string) => {
    setProfessores(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'ativo' ? 'inativo' : 'ativo' } : p
    ))
  }

  const todasEspecialidades = ['Musculação', 'Crossfit', 'Funcional', 'Pilates', 'Yoga', 'Alongamento', 'Powerlifting', 'Natação', 'Spinning']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Professores</h1>
          <p className="page-subtitle">{professores.length} professores cadastrados</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Professor</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <GraduationCap className="w-6 h-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{professores.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="stat-card text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {professores.filter(p => p.status === 'ativo').length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ativos</p>
        </div>
        <div className="stat-card text-center">
          <Users className="w-6 h-6 text-purple-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {professores.reduce((s, p) => s + p.alunos, 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Alunos vinculados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-base p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CREF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'ativo', 'inativo'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
                filtroStatus === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(prof => (
          <div key={prof.id} className="card-base p-5 space-y-4">
            {/* Header do card */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-400">
                    {prof.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{prof.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{prof.cref}</p>
                </div>
              </div>
              <span className={`badge ${prof.status === 'ativo' ? 'badge-success' : 'badge-gray'}`}>
                {prof.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Especialidades */}
            <div className="flex flex-wrap gap-1.5">
              {prof.especialidades.map(esp => (
                <span
                  key={esp}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${especialidadeColors[esp] ?? 'badge-gray'}`}
                >
                  {esp}
                </span>
              ))}
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{prof.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{prof.telefone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{prof.alunos} alunos vinculados</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setModal({ type: 'view', id: prof.id })}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver
              </button>
              <button
                onClick={() => abrirEditar(prof)}
                className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                onClick={() => toggleStatus(prof.id)}
                className={`btn-secondary text-xs py-1.5 px-3 flex items-center justify-center ${
                  prof.status === 'ativo' ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'
                }`}
                title={prof.status === 'ativo' ? 'Desativar' : 'Ativar'}
              >
                {prof.status === 'ativo' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-base p-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum professor encontrado</p>
        </div>
      )}

      {/* Modal: Ver detalhes */}
      {modal.type === 'view' && professorSelecionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Perfil do Professor</h2>
              <button onClick={() => setModal({ type: 'none' })} className="btn-ghost p-1.5 text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                    {professorSelecionado.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{professorSelecionado.nome}</p>
                  <p className="text-sm text-gray-400">{professorSelecionado.cref}</p>
                  <span className={`badge mt-1 ${professorSelecionado.status === 'ativo' ? 'badge-success' : 'badge-gray'}`}>
                    {professorSelecionado.status}
                  </span>
                </div>
              </div>

              {professorSelecionado.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  {professorSelecionado.bio}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />{professorSelecionado.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />{professorSelecionado.telefone}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />{professorSelecionado.alunos} alunos vinculados
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Award className="w-4 h-4" />Desde {new Date(professorSelecionado.data_admissao).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {professorSelecionado.especialidades.map(esp => (
                    <span key={esp} className={`text-xs px-2 py-0.5 rounded-full font-medium ${especialidadeColors[esp] ?? 'badge-gray'}`}>
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button onClick={() => { abrirEditar(professorSelecionado); }} className="flex-1 btn-primary text-sm">
                Editar Professor
              </button>
              <button onClick={() => setModal({ type: 'none' })} className="btn-secondary text-sm px-4">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Formulário novo/editar */}
      {modal.type === 'form' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {modal.id ? 'Editar Professor' : 'Novo Professor'}
              </h2>
              <button onClick={() => setModal({ type: 'none' })} className="btn-ghost p-1.5 text-lg">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label-base">Nome completo *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  className="input-base"
                  placeholder="Nome do professor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="input-base"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="label-base">Telefone</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="input-base"
                    placeholder="(32) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">CREF</label>
                <input
                  type="text"
                  value={form.cref}
                  onChange={e => setForm(p => ({ ...p, cref: e.target.value }))}
                  className="input-base"
                  placeholder="CREF 000000-G/MG"
                />
              </div>

              <div>
                <label className="label-base">Especialidades</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {todasEspecialidades.map(esp => (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => setForm(p => ({
                        ...p,
                        especialidades: p.especialidades.includes(esp)
                          ? p.especialidades.filter(e => e !== esp)
                          : [...p.especialidades, esp],
                      }))}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        form.especialidades.includes(esp)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-base">Bio / Apresentação</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  className="input-base resize-none"
                  rows={3}
                  placeholder="Breve descrição sobre o professor..."
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setModal({ type: 'none' })} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={salvar}
                disabled={!form.nome || !form.email}
                className="btn-primary flex-1"
              >
                {modal.id ? 'Salvar Alterações' : 'Cadastrar Professor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
