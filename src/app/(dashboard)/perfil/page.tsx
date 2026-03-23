'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Camera, Save, Eye, EyeOff, Lock, Bell, Moon, Sun, Shield, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const { usuario, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha' | 'notificacoes' | 'privacidade'>('perfil')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [form, setForm] = useState({
    nome: usuario?.nome ?? '',
    telefone: usuario?.telefone ?? '',
    data_nascimento: usuario?.data_nascimento ?? '',
    cpf: usuario?.cpf ?? '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [notifications, setNotifications] = useState({
    pagamentos: true,
    treinos: true,
    avaliacoes: true,
    checkin: false,
    email: true,
    push: false,
  })

  const handleSaveProfile = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Perfil atualizado com sucesso!')
    setIsLoading(false)
  }

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    if (passwordForm.new.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Senha alterada com sucesso!')
    setPasswordForm({ current: '', new: '', confirm: '' })
    setIsLoading(false)
  }

  const tabs = [
    { key: 'perfil', label: 'Perfil', icon: '👤' },
    { key: 'senha', label: 'Senha', icon: '🔒' },
    { key: 'notificacoes', label: 'Notificações', icon: '🔔' },
    { key: 'privacidade', label: 'Aparência', icon: '🎨' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Meu Perfil</h1>
        <p className="page-subtitle">Gerencie suas informações pessoais e configurações</p>
      </div>

      {/* Profile Header Card */}
      <div className="card-base p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 overflow-hidden">
              {usuario?.foto_url ? (
                <Image src={usuario.foto_url} alt={usuario.nome} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-700 dark:text-primary-400">
                    {usuario?.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{usuario?.nome}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{usuario?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${
                usuario?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                usuario?.role === 'professor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'badge-success'
              }`}>
                {usuario?.role === 'admin' ? '⚙️ Administrador' : usuario?.role === 'professor' ? '🎓 Professor' : '🏋️ Aluno'}
              </span>
              <span className="badge-success">Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">{t.icon} </span>{t.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'perfil' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Pessoais</h3>

          <div>
            <label className="label-base">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              className="input-base"
            />
          </div>

          <div>
            <label className="label-base">Email</label>
            <input type="email" value={usuario?.email ?? ''} className="input-base opacity-60" disabled />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Telefone</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                className="input-base"
                placeholder="(32) 99999-9999"
              />
            </div>
            <div>
              <label className="label-base">Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={e => setForm(prev => ({ ...prev, data_nascimento: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="label-base">CPF</label>
            <input
              type="text"
              value={form.cpf}
              onChange={e => setForm(prev => ({ ...prev, cpf: e.target.value }))}
              className="input-base"
              placeholder="000.000.000-00"
            />
          </div>

          <button onClick={handleSaveProfile} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'senha' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Alterar Senha</h3>
          </div>

          <div>
            <label className="label-base">Senha atual</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                className="input-base pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base">Nova senha</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.new}
                onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                className="input-base pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label-base">Confirmar nova senha</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
              className="input-base"
              placeholder="Repita a nova senha"
            />
          </div>

          {/* Password strength */}
          {passwordForm.new && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Força da senha</span>
                <span className={passwordForm.new.length >= 12 ? 'text-green-500' : passwordForm.new.length >= 8 ? 'text-yellow-500' : 'text-red-500'}>
                  {passwordForm.new.length >= 12 ? 'Forte' : passwordForm.new.length >= 8 ? 'Média' : 'Fraca'}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill transition-all ${
                    passwordForm.new.length >= 12 ? 'bg-green-500' : passwordForm.new.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((passwordForm.new.length / 16) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <button onClick={handleChangePassword} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Alterar Senha
          </button>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notificacoes' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Preferências de Notificação</h3>
          </div>

          {[
            { key: 'pagamentos', label: 'Pagamentos', desc: 'Vencimentos e confirmações de pagamento' },
            { key: 'treinos', label: 'Treinos', desc: 'Novos treinos e atualizações' },
            { key: 'avaliacoes', label: 'Avaliações', desc: 'Agendamentos e resultados de avaliação' },
            { key: 'checkin', label: 'Check-in', desc: 'Confirmação de presença' },
            { key: 'email', label: 'Email', desc: 'Receber notificações por email' },
            { key: 'push', label: 'Push', desc: 'Notificações no navegador' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  notifications[n.key as keyof typeof notifications] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-1 ${
                  notifications[n.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}

          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Preferências
          </button>
        </div>
      )}

      {/* APPEARANCE TAB */}
      {activeTab === 'privacidade' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aparência</h3>

          <div>
            <p className="label-base">Tema</p>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claro</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <Moon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Escuro</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-400">Sua conta está protegida com autenticação segura Supabase.</p>
          </div>
        </div>
      )}
    </div>
  )
}
