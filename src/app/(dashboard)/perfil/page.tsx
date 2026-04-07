'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Camera, Save, Eye, EyeOff, Lock, Bell, Moon, Sun, Loader2, Shield, Download, Trash2, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const { usuario, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha' | 'aparencia' | 'privacidade'>('perfil')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)

  const [form, setForm] = useState({
    nome: usuario?.nome ?? '',
    telefone: usuario?.telefone ?? '',
    data_nascimento: usuario?.data_nascimento ?? '',
    cpf: usuario?.cpf ?? '',
  })

  const [pwdForm, setPwdForm] = useState({ current: '', novo: '', confirmar: '' })

  const [notifs, setNotifs] = useState({
    pagamentos: true, treinos: true, avaliacoes: true, checkin: false,
  })
  const [exportando, setExportando] = useState(false)
  const [excluindoConta, setExcluindoConta] = useState(false)
  const [confirmaExclusao, setConfirmaExclusao] = useState('')

  const handleExportarDados = async () => {
    if (!usuario) return
    setExportando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { toast.error('Sessão expirada, faça login novamente'); return }

      const res = await fetch('/api/export', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) throw new Error('Erro ao exportar')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-i9fitness-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Dados exportados com sucesso!')
    } catch {
      toast.error('Erro ao exportar dados')
    } finally {
      setExportando(false)
    }
  }

  const handleExcluirConta = async () => {
    if (confirmaExclusao !== 'EXCLUIR') { toast.error('Digite EXCLUIR para confirmar'); return }
    if (!usuario) return
    setExcluindoConta(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { toast.error('Sessão expirada'); return }

      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) throw new Error('Erro ao excluir')

      toast.success('Conta excluída. Redirecionando...')
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch {
      toast.error('Erro ao excluir conta. Tente novamente ou contate o suporte.')
    } finally {
      setExcluindoConta(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !usuario?.id) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Foto deve ter no máximo 5MB'); return }

    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${usuario.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_url: urlData.publicUrl })
        .eq('id', usuario.id)

      if (updateError) throw updateError

      await refreshUser()
      toast.success('Foto atualizada!')
    } catch (err: unknown) {
      toast.error('Erro ao fazer upload da foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const salvarPerfil = async () => {
    if (!usuario?.id) return
    setSaving(true)
    const { error } = await supabase
      .from('usuarios')
      .update({
        nome: form.nome,
        telefone: form.telefone || null,
        data_nascimento: form.data_nascimento || null,
        cpf: form.cpf || null,
      })
      .eq('id', usuario.id)

    setSaving(false)
    if (error) { toast.error('Erro ao salvar perfil'); return }
    await refreshUser()
    toast.success('Perfil atualizado!')
  }

  const alterarSenha = async () => {
    if (!pwdForm.novo || pwdForm.novo.length < 6) { toast.error('Nova senha deve ter mínimo 6 caracteres'); return }
    if (pwdForm.novo !== pwdForm.confirmar) { toast.error('Senhas não coincidem'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwdForm.novo })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Senha alterada com sucesso!')
    setPwdForm({ current: '', novo: '', confirmar: '' })
  }

  const tabs = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'senha', label: 'Senha' },
    { key: 'aparencia', label: 'Aparência' },
    { key: 'privacidade', label: 'Privacidade' },
  ]

  const lgpdConsent = (usuario?.configuracoes as Record<string, unknown> | undefined)?.lgpd_consent as boolean | undefined
  const lgpdConsentAt = (usuario?.configuracoes as Record<string, unknown> | undefined)?.lgpd_consent_at as string | undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title">Meu Perfil</h1><p className="page-subtitle">Gerencie suas informações e configurações</p></div>

      {/* Card do usuário */}
      <div className="card-base p-6">
        <div className="flex items-center gap-5">
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
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{usuario?.nome}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{usuario?.email}</p>
            <span className={`badge mt-2 inline-block ${
              usuario?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              usuario?.role === 'professor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'badge-success'
            }`}>
              {usuario?.role === 'admin' ? '⚙️ Administrador' : usuario?.role === 'professor' ? '🎓 Professor' : '🏋️ Aluno'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PERFIL */}
      {activeTab === 'perfil' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Pessoais</h3>
          <div><label className="label-base">Nome completo</label><input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="input-base" /></div>
          <div><label className="label-base">Email</label><input type="email" value={usuario?.email ?? ''} className="input-base opacity-60" disabled /><p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-base">Telefone</label><input type="tel" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} className="input-base" placeholder="(32) 99999-9999" /></div>
            <div><label className="label-base">Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={e => setForm(p => ({ ...p, data_nascimento: e.target.value }))} className="input-base" /></div>
          </div>
          <div><label className="label-base">CPF</label><input type="text" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} className="input-base" placeholder="000.000.000-00" /></div>
          <button onClick={salvarPerfil} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      )}

      {/* SENHA */}
      {activeTab === 'senha' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Lock className="w-5 h-5 text-primary-500" /><h3 className="font-semibold text-gray-900 dark:text-gray-100">Alterar Senha</h3></div>
          <div>
            <label className="label-base">Nova senha</label>
            <div className="relative">
              <input type={showNewPwd ? 'text' : 'password'} value={pwdForm.novo} onChange={e => setPwdForm(p => ({ ...p, novo: e.target.value }))} className="input-base pr-10" placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label-base">Confirmar nova senha</label>
            <input type="password" value={pwdForm.confirmar} onChange={e => setPwdForm(p => ({ ...p, confirmar: e.target.value }))} className="input-base" placeholder="Repita a nova senha" />
          </div>
          {pwdForm.novo && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Força da senha</span>
                <span className={pwdForm.novo.length >= 12 ? 'text-green-500' : pwdForm.novo.length >= 8 ? 'text-yellow-500' : 'text-red-500'}>
                  {pwdForm.novo.length >= 12 ? 'Forte' : pwdForm.novo.length >= 8 ? 'Média' : 'Fraca'}
                </span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${pwdForm.novo.length >= 12 ? 'bg-green-500' : pwdForm.novo.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((pwdForm.novo.length / 16) * 100, 100)}%` }} />
              </div>
            </div>
          )}
          <button onClick={alterarSenha} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Alterar Senha
          </button>
        </div>
      )}

      {/* APARÊNCIA */}
      {activeTab === 'aparencia' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tema</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claro</span>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
              <Moon className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Escuro</span>
            </button>
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 pt-2">Notificações</h3>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
            {[
              { key: 'pagamentos', label: 'Pagamentos', desc: 'Vencimentos e confirmações' },
              { key: 'treinos', label: 'Treinos', desc: 'Novos treinos e atualizações' },
              { key: 'avaliacoes', label: 'Avaliações', desc: 'Agendamentos e resultados' },
              { key: 'checkin', label: 'Check-in', desc: 'Confirmação de presença' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3">
                <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</p><p className="text-xs text-gray-400">{n.desc}</p></div>
                <button onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                  className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ml-4 ${notifs[n.key as keyof typeof notifs] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-1 ${notifs[n.key as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRIVACIDADE & DADOS */}
      {activeTab === 'privacidade' && (
        <div className="space-y-4">

          {/* Status do consentimento */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: 'var(--neon)' }} />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Status LGPD</h3>
            </div>
            {lgpdConsent ? (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Consentimento registrado</p>
                  {lgpdConsentAt && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                      Aceito em {new Date(lgpdConsentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.1)' }}>
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Consentimento pendente</p>
              </div>
            )}
            <Link href="/privacidade" target="_blank"
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: 'var(--neon)' }}>
              <ExternalLink className="w-4 h-4" />
              Ler Política de Privacidade completa
            </Link>
          </div>

          {/* Exportar dados */}
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Exportar meus dados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Baixe uma cópia completa de todos os seus dados pessoais armazenados no sistema, conforme o direito à portabilidade previsto no Art. 18 da LGPD.
            </p>
            <div className="text-xs text-gray-400 space-y-0.5">
              <p>O arquivo JSON incluirá:</p>
              <p className="ml-2">• Perfil, avaliações físicas e medidas</p>
              <p className="ml-2">• Histórico de treinos e cargas</p>
              <p className="ml-2">• Registros de check-in e pagamentos</p>
              <p className="ml-2">• Anamnese e registros de consentimento</p>
            </div>
            <button
              onClick={handleExportarDados}
              disabled={exportando}
              className="btn-secondary flex items-center gap-2 w-full justify-center"
            >
              {exportando
                ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando arquivo...</>
                : <><Download className="w-4 h-4" />Exportar meus dados (JSON)</>
              }
            </button>
          </div>

          {/* Excluir conta */}
          <div className="card-base p-5 space-y-3" style={{ borderColor: 'rgba(239,68,68,0.3)', borderWidth: '1px' }}>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Excluir minha conta</h3>
            </div>
            <div className="p-3 rounded-xl text-sm space-y-1" style={{ background: 'rgba(239,68,68,0.08)' }}>
              <p className="font-medium text-red-600 dark:text-red-400">Atenção: esta ação é irreversível</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Todos os seus dados pessoais serão removidos permanentemente, incluindo histórico de treinos, avaliações físicas e fotos de progresso. Dados financeiros serão anonimizados por obrigação legal.
              </p>
            </div>
            <div>
              <label className="label-base text-red-500">Digite <strong>EXCLUIR</strong> para confirmar</label>
              <input
                type="text"
                value={confirmaExclusao}
                onChange={e => setConfirmaExclusao(e.target.value)}
                className="input-base"
                placeholder="EXCLUIR"
                style={{ borderColor: confirmaExclusao === 'EXCLUIR' ? '#ef4444' : undefined }}
              />
            </div>
            <button
              onClick={handleExcluirConta}
              disabled={excluindoConta || confirmaExclusao !== 'EXCLUIR'}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: confirmaExclusao === 'EXCLUIR' && !excluindoConta ? '#ef4444' : 'rgba(239,68,68,0.15)',
                color: confirmaExclusao === 'EXCLUIR' ? '#fff' : '#f87171',
                cursor: confirmaExclusao !== 'EXCLUIR' ? 'not-allowed' : 'pointer',
              }}
            >
              {excluindoConta
                ? <><Loader2 className="w-4 h-4 animate-spin" />Excluindo...</>
                : <><Trash2 className="w-4 h-4" />Excluir minha conta permanentemente</>
              }
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
