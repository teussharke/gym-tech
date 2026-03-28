'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Building2, CreditCard, Clock, Bell, Save, Plus, Edit, Trash2, CheckCircle2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

interface Academia {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  endereco: Record<string, string>
}

interface Plano {
  id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_dias: number
  ativo: boolean
}

type Tab = 'geral' | 'planos' | 'horarios'

export default function ConfiguracoesPage() {
  const { usuario, role } = useAuth()
  const isAdmin = role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [academia, setAcademia] = useState<Academia | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPlanoForm, setShowPlanoForm] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState<Plano | null>(null)
  const [planoForm, setPlanoForm] = useState({ nome: '', descricao: '', valor: '', duracao_dias: '30' })

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [{ data: acad }, { data: pl }] = await Promise.all([
        supabase.from('academias').select('*').eq('id', usuario.academia_id).single(),
        supabase.from('planos').select('*').eq('academia_id', usuario.academia_id).order('valor'),
      ])
      if (acad) setAcademia(acad)
      if (pl) setPlanos(pl)
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const salvarAcademia = async () => {
    if (!academia) return
    setSaving(true)
    const { error } = await supabase
      .from('academias')
      .update({ nome: academia.nome, cnpj: academia.cnpj, email: academia.email, telefone: academia.telefone, endereco: academia.endereco })
      .eq('id', academia.id)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Configurações salvas!')
  }

  const salvarPlano = async () => {
    if (!planoForm.nome || !planoForm.valor) { toast.error('Preencha nome e valor'); return }
    if (!usuario?.academia_id) return
    setSaving(true)
    try {
      if (editandoPlano) {
        const { error } = await supabase.from('planos').update({
          nome: planoForm.nome, descricao: planoForm.descricao || null,
          valor: Number(planoForm.valor), duracao_dias: Number(planoForm.duracao_dias),
        }).eq('id', editandoPlano.id)
        if (error) throw error
        toast.success('Plano atualizado!')
      } else {
        const { error } = await supabase.from('planos').insert({
          academia_id: usuario.academia_id, nome: planoForm.nome,
          descricao: planoForm.descricao || null, valor: Number(planoForm.valor),
          duracao_dias: Number(planoForm.duracao_dias), ativo: true,
        })
        if (error) throw error
        toast.success('Plano criado!')
      }
      setShowPlanoForm(false)
      fetchDados()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  const togglePlano = async (plano: Plano) => {
    await supabase.from('planos').update({ ativo: !plano.ativo }).eq('id', plano.id)
    fetchDados()
  }

  const excluirPlano = async (id: string) => {
    await supabase.from('planos').delete().eq('id', id)
    toast.success('Plano removido')
    fetchDados()
  }

  const abrirEditarPlano = (plano: Plano) => {
    setPlanoForm({ nome: plano.nome, descricao: plano.descricao ?? '', valor: String(plano.valor), duracao_dias: String(plano.duracao_dias) })
    setEditandoPlano(plano)
    setShowPlanoForm(true)
  }

  const abrirNovoPLano = () => {
    setPlanoForm({ nome: '', descricao: '', valor: '', duracao_dias: '30' })
    setEditandoPlano(null)
    setShowPlanoForm(true)
  }

  // View somente-leitura para professor
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div><h1 className="page-title">Configurações</h1><p className="page-subtitle">Informações da academia</p></div>
        {academia && (
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{academia.nome}</h2>
                {academia.cnpj && <p className="text-sm text-gray-400">{academia.cnpj}</p>}
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {academia.email && <div className="flex justify-between py-2.5 text-sm"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800 dark:text-gray-200">{academia.email}</span></div>}
              {academia.telefone && <div className="flex justify-between py-2.5 text-sm"><span className="text-gray-500">Telefone</span><span className="font-medium text-gray-800 dark:text-gray-200">{academia.telefone}</span></div>}
            </div>
          </div>
        )}
        <div className="card-base p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Planos disponíveis</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {planos.filter(p => p.ativo).map(plano => (
              <div key={plano.id} className="flex items-center justify-between py-2.5">
                <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{plano.nome}</p>{plano.descricao && <p className="text-xs text-gray-400">{plano.descricao}</p>}</div>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">R$ {plano.valor}/mês</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Para alterar, entre em contato com o administrador.</p>
      </div>
    )
  }

  const tabs = [
    { key: 'geral', label: 'Geral', icon: Building2 },
    { key: 'planos', label: 'Planos', icon: CreditCard },
    { key: 'horarios', label: 'Horários', icon: Clock },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="page-title">Configurações</h1><p className="page-subtitle">Gerencie as configurações da academia</p></div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
              className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* GERAL */}
          {activeTab === 'geral' && academia && (
            <div className="space-y-4">
              <div className="card-base p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary-500" />Dados da Academia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className="label-base">Nome da academia</label><input type="text" value={academia.nome} onChange={e => setAcademia(p => p ? { ...p, nome: e.target.value } : p)} className="input-base" /></div>
                  <div><label className="label-base">CNPJ</label><input type="text" value={academia.cnpj ?? ''} onChange={e => setAcademia(p => p ? { ...p, cnpj: e.target.value } : p)} className="input-base" placeholder="00.000.000/0001-00" /></div>
                  <div><label className="label-base">Telefone</label><input type="tel" value={academia.telefone ?? ''} onChange={e => setAcademia(p => p ? { ...p, telefone: e.target.value } : p)} className="input-base" /></div>
                  <div className="sm:col-span-2"><label className="label-base">Email</label><input type="email" value={academia.email ?? ''} onChange={e => setAcademia(p => p ? { ...p, email: e.target.value } : p)} className="input-base" /></div>
                  <div><label className="label-base">Cidade</label><input type="text" value={academia.endereco?.cidade ?? ''} onChange={e => setAcademia(p => p ? { ...p, endereco: { ...p.endereco, cidade: e.target.value } } : p)} className="input-base" /></div>
                  <div><label className="label-base">Estado</label>
                    <select value={academia.endereco?.estado ?? 'MG'} onChange={e => setAcademia(p => p ? { ...p, endereco: { ...p.endereco, estado: e.target.value } } : p)} className="input-base">
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={salvarAcademia} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          )}

          {/* PLANOS */}
          {activeTab === 'planos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{planos.length} planos</p>
                <button onClick={abrirNovoPLano} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" />Novo Plano</button>
              </div>
              <div className="space-y-3">
                {planos.map(plano => (
                  <div key={plano.id} className={`card-base p-4 flex items-center gap-4 ${!plano.ativo ? 'opacity-60' : ''}`}>
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{plano.nome}</p>
                        {!plano.ativo && <span className="badge-gray">Inativo</span>}
                      </div>
                      {plano.descricao && <p className="text-xs text-gray-400">{plano.descricao}</p>}
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-0.5">R$ {plano.valor.toLocaleString('pt-BR')} / {plano.duracao_dias} dias</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => abrirEditarPlano(plano)} className="btn-ghost p-1.5"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => togglePlano(plano)} className="btn-ghost p-1.5"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => excluirPlano(plano.id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {planos.length === 0 && <div className="card-base p-8 text-center text-gray-400">Nenhum plano cadastrado.</div>}
              </div>
            </div>
          )}

          {/* HORÁRIOS */}
          {activeTab === 'horarios' && academia && (
            <div className="card-base p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-500" />Horário de Funcionamento</h3>
              <div className="space-y-3">
                {[
                  { label: 'Seg - Sex abertura', key: 'horario_abertura', placeholder: '06:00', type: 'time' },
                  { label: 'Seg - Sex fechamento', key: 'horario_fechamento', placeholder: '22:00', type: 'time' },
                  { label: 'Sábado', key: 'horario_sabado', placeholder: '08:00 - 18:00 ou Fechado', type: 'text' },
                  { label: 'Domingo', key: 'horario_domingo', placeholder: 'Fechado', type: 'text' },
                ].map(h => (
                  <div key={h.key} className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-36 flex-shrink-0">{h.label}</span>
                    <input
                      type={h.type}
                      value={(academia.endereco?.[h.key] as string) ?? ''}
                      onChange={e => setAcademia(p => p ? { ...p, endereco: { ...p.endereco, [h.key]: e.target.value } } : p)}
                      className="input-base flex-1 max-w-xs"
                      placeholder={h.placeholder}
                    />
                  </div>
                ))}
              </div>
              <button onClick={salvarAcademia} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar Horários'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal plano */}
      {showPlanoForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{editandoPlano ? 'Editar Plano' : 'Novo Plano'}</h3>
              <button onClick={() => setShowPlanoForm(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label-base">Nome *</label><input type="text" value={planoForm.nome} onChange={e => setPlanoForm(p => ({ ...p, nome: e.target.value }))} className="input-base" placeholder="Ex: Premium" /></div>
              <div><label className="label-base">Descrição</label><input type="text" value={planoForm.descricao} onChange={e => setPlanoForm(p => ({ ...p, descricao: e.target.value }))} className="input-base" placeholder="O que inclui..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-base">Valor (R$) *</label><input type="number" value={planoForm.valor} onChange={e => setPlanoForm(p => ({ ...p, valor: e.target.value }))} className="input-base" /></div>
                <div>
                  <label className="label-base">Duração</label>
                  <select value={planoForm.duracao_dias} onChange={e => setPlanoForm(p => ({ ...p, duracao_dias: e.target.value }))} className="input-base">
                    <option value="30">30 dias</option>
                    <option value="60">60 dias</option>
                    <option value="90">90 dias</option>
                    <option value="180">180 dias</option>
                    <option value="365">365 dias</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowPlanoForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarPlano} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : editandoPlano ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
