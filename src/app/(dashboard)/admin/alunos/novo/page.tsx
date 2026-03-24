'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, CreditCard, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

type Step = 'dados' | 'plano' | 'confirmacao'

export default function NovoAlunoPage() {
  const router = useRouter()
  const { usuario } = useAuth()
  const [step, setStep] = useState<Step>('dados')
  const [saving, setSaving] = useState(false)
  const [professores, setProfessores] = useState<{ id: string; usuario: { nome: string } }[]>([])
  const [planos, setPlanos] = useState<{ id: string; nome: string; valor: number }[]>([])

  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', data_nascimento: '', cpf: '',
    cidade: '', estado: 'MG',
    professor_id: '', plano_id: '', data_vencimento: '', objetivos: '', observacoes: '',
    senha: '123456',
  })

  const up = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) return
    const [{ data: profs }, { data: pl }] = await Promise.all([
      supabase.from('professores').select('id, usuario:usuarios!professores_usuario_id_fkey (nome)').eq('academia_id', usuario.academia_id),
      supabase.from('planos').select('id, nome, valor').eq('academia_id', usuario.academia_id).eq('ativo', true),
    ])
    setProfessores((profs as unknown as { id: string; usuario: { nome: string } }[]) ?? [])
    setPlanos(pl ?? [])
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const salvar = async () => {
    if (!form.nome || !form.email || !form.plano_id || !form.data_vencimento) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (!usuario?.academia_id) return
    setSaving(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || null,
          data_nascimento: form.data_nascimento || null,
          cpf: form.cpf || null,
          password: form.senha,
          role: 'aluno',
          academia_id: usuario.academia_id,
          professor_id: form.professor_id || null,
          plano_id: form.plano_id,
          data_vencimento: form.data_vencimento,
          objetivos: form.objetivos || null,
          observacoes: form.observacoes || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Aluno cadastrado com sucesso!')
      router.push('/admin/alunos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setSaving(false)
    }
  }

  const planoSelecionado = planos.find(p => p.id === form.plano_id)
  const professorSelecionado = professores.find(p => p.id === form.professor_id)

  const steps = [
    { key: 'dados', label: 'Dados Pessoais', icon: User },
    { key: 'plano', label: 'Plano e Professor', icon: CreditCard },
    { key: 'confirmacao', label: 'Confirmação', icon: UserCheck },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="page-title">Novo Aluno</h1><p className="page-subtitle">Cadastre um novo aluno</p></div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {steps.map((s, i) => {
          const Icon = s.icon
          const done = steps.findIndex(x => x.key === step) > i
          return (
            <button key={s.key} onClick={() => done && setStep(s.key as Step)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                step === s.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' :
                done ? 'text-primary-600 dark:text-primary-400 cursor-pointer' : 'text-gray-400 cursor-default'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          )
        })}
      </div>

      {/* STEP 1 */}
      {step === 'dados' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais</h3>
            <div><label className="label-base">Nome completo *</label><input type="text" value={form.nome} onChange={e => up('nome', e.target.value)} className="input-base" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label-base">Email *</label><input type="email" value={form.email} onChange={e => up('email', e.target.value)} className="input-base" /></div>
              <div><label className="label-base">Telefone</label><input type="tel" value={form.telefone} onChange={e => up('telefone', e.target.value)} className="input-base" placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label-base">Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={e => up('data_nascimento', e.target.value)} className="input-base" /></div>
              <div><label className="label-base">CPF</label><input type="text" value={form.cpf} onChange={e => up('cpf', e.target.value)} className="input-base" placeholder="000.000.000-00" /></div>
            </div>
          </div>
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Acesso ao Sistema</h3>
            <div><label className="label-base">Senha inicial</label><input type="text" value={form.senha} onChange={e => up('senha', e.target.value)} className="input-base" /></div>
            <p className="text-xs text-gray-400">O aluno poderá alterar no primeiro acesso.</p>
          </div>
          <button onClick={() => setStep('plano')} disabled={!form.nome || !form.email} className="btn-primary w-full">
            Próximo: Plano e Professor →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 'plano' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plano de Mensalidade *</h3>
            {planos.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum plano ativo. Cadastre planos em Configurações → Planos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planos.map(plano => (
                  <button key={plano.id} type="button" onClick={() => up('plano_id', plano.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.plano_id === plano.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{plano.nome}</p>
                    <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">R$ {plano.valor}/mês</p>
                  </button>
                ))}
              </div>
            )}
            <div><label className="label-base">Data de vencimento *</label><input type="date" value={form.data_vencimento} onChange={e => up('data_vencimento', e.target.value)} className="input-base" /></div>
          </div>

          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Professor Responsável</h3>
            {professores.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum professor cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {professores.map(prof => (
                  <button key={prof.id} type="button" onClick={() => up('professor_id', prof.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${form.professor_id === prof.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                        {(prof.usuario as unknown as { nome: string })?.nome?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {(prof.usuario as unknown as { nome: string })?.nome}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card-base p-5 space-y-3">
            <div><label className="label-base">Objetivo</label>
              <select value={form.objetivos} onChange={e => up('objetivos', e.target.value)} className="input-base">
                <option value="">Selecionar...</option>
                {['Hipertrofia','Emagrecimento','Força','Condicionamento','Reabilitação','Qualidade de vida'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label className="label-base">Observações</label><textarea value={form.observacoes} onChange={e => up('observacoes', e.target.value)} className="input-base resize-none" rows={3} placeholder="Lesões, restrições..." /></div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('dados')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={() => setStep('confirmacao')} disabled={!form.plano_id || !form.data_vencimento} className="btn-primary flex-1">Revisar →</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 'confirmacao' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary-500" />Confirmar Cadastro</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dados Pessoais</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{form.nome}</p>
              <p className="text-sm text-gray-500">{form.email}</p>
              {form.telefone && <p className="text-sm text-gray-500">{form.telefone}</p>}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Plano</p>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{planoSelecionado?.nome}</span>
                <span className="text-primary-600 font-bold">R$ {planoSelecionado?.valor}/mês</span>
              </div>
              <p className="text-sm text-gray-500">Vence em: {new Date(form.data_vencimento).toLocaleDateString('pt-BR')}</p>
            </div>
            {professorSelecionado && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Professor</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {(professorSelecionado.usuario as unknown as { nome: string })?.nome}
                </p>
              </div>
            )}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 uppercase mb-1">Acesso</p>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Email: <strong>{form.email}</strong> · Senha: <strong>{form.senha}</strong>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('plano')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={salvar} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Cadastrando...</> : <><Save className="w-4 h-4" />Cadastrar Aluno</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
