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
  const { usuario, session } = useAuth()
  const [step, setStep] = useState<Step>('dados')
  const [saving, setSaving] = useState(false)
  const [professores, setProfessores] = useState<{ id: string; nome: string }[]>([])
  const [planos, setPlanos] = useState<{ id: string; nome: string; valor: number }[]>([])

  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', data_nascimento: '', cpf: '',
    professor_id: '', plano_id: '', data_vencimento: '', objetivos: '', observacoes: '',
    senha: '123456',
  })

  const up = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) return
    const [{ data: profs }, { data: pl }] = await Promise.all([
      supabase.from('professores').select('id, usuario_id').eq('academia_id', usuario.academia_id),
      supabase.from('planos').select('id, nome, valor').eq('academia_id', usuario.academia_id).eq('ativo', true),
    ])

    // Buscar nomes dos professores
    if (profs && profs.length > 0) {
      const ids = profs.map(p => p.usuario_id)
      const { data: usuarios } = await supabase.from('usuarios').select('id, nome').in('id', ids)
      const map = Object.fromEntries((usuarios ?? []).map(u => [u.id, u.nome]))
      setProfessores(profs.map(p => ({ id: p.id, nome: map[p.usuario_id] ?? 'Professor' })))
    }

    setPlanos(pl ?? [])
  }, [usuario?.academia_id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const salvar = async () => {
    if (!form.nome || !form.email) { toast.error('Nome e email são obrigatórios'); return }
    if (!usuario?.academia_id) return
    setSaving(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
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
          plano_id: form.plano_id || null,
          data_vencimento: form.data_vencimento || null,
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
    { key: 'dados',        label: 'Dados Pessoais',    icon: User },
    { key: 'plano',        label: 'Plano e Professor', icon: CreditCard },
    { key: 'confirmacao',  label: 'Confirmação',       icon: UserCheck },
  ]

  const stepIndex = steps.findIndex(s => s.key === step)

  // Validação de cada step — sem campos obrigatórios no step 2
  const canGoToPlano = !!form.nome && !!form.email
  const canGoToConfirmacao = true // plano e professor são opcionais

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
          const done = stepIndex > i
          const active = step === s.key
          return (
            <button key={s.key}
              onClick={() => {
                if (i === 0) setStep('dados')
                if (i === 1 && canGoToPlano) setStep('plano')
                if (i === 2 && canGoToPlano) setStep('confirmacao')
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                active ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' :
                done ? 'text-primary-600 dark:text-primary-400 cursor-pointer' :
                'text-gray-400'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          )
        })}
      </div>

      {/* STEP 1 — Dados Pessoais */}
      {step === 'dados' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais</h3>
            <div>
              <label className="label-base">Nome completo *</label>
              <input type="text" value={form.nome} onChange={e => up('nome', e.target.value)} className="input-base" placeholder="Nome do aluno" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Email *</label>
                <input type="email" value={form.email} onChange={e => up('email', e.target.value)} className="input-base" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label-base">Telefone</label>
                <input type="tel" value={form.telefone} onChange={e => up('telefone', e.target.value)} className="input-base" placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Data de nascimento</label>
                <input type="date" value={form.data_nascimento} onChange={e => up('data_nascimento', e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="label-base">CPF</label>
                <input type="text" value={form.cpf} onChange={e => up('cpf', e.target.value)} className="input-base" placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Acesso ao Sistema</h3>
            <div>
              <label className="label-base">Senha inicial</label>
              <input type="text" value={form.senha} onChange={e => up('senha', e.target.value)} className="input-base" />
            </div>
            <p className="text-xs text-gray-400">O aluno poderá alterar a senha no primeiro acesso.</p>
          </div>

          <button
            onClick={() => setStep('plano')}
            disabled={!canGoToPlano}
            className="btn-primary w-full"
          >
            Próximo: Plano e Professor →
          </button>
        </div>
      )}

      {/* STEP 2 — Plano e Professor */}
      {step === 'plano' && (
        <div className="space-y-4">
          {/* Planos */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plano de Mensalidade</h3>
              <span className="text-xs text-gray-400">Opcional</span>
            </div>

            {planos.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Nenhum plano ativo. Cadastre em{' '}
                  <a href="/admin/configuracoes" className="underline font-medium">Configurações → Planos</a>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Você pode continuar o cadastro sem selecionar um plano.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opção "Sem plano" */}
                <button type="button" onClick={() => up('plano_id', '')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${!form.plano_id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Sem plano</p>
                  <p className="text-gray-400 text-xs mt-1">Definir depois</p>
                </button>
                {planos.map(plano => (
                  <button key={plano.id} type="button" onClick={() => up('plano_id', plano.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.plano_id === plano.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{plano.nome}</p>
                    <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">R$ {plano.valor}/mês</p>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="label-base">Data de vencimento</label>
              <input type="date" value={form.data_vencimento} onChange={e => up('data_vencimento', e.target.value)} className="input-base" />
            </div>
          </div>

          {/* Professor */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Professor Responsável</h3>
              <span className="text-xs text-gray-400">Opcional</span>
            </div>
            {professores.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum professor cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {/* Sem professor */}
                <button type="button" onClick={() => up('professor_id', '')}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${!form.professor_id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400">—</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sem professor</span>
                </button>
                {professores.map(prof => (
                  <button key={prof.id} type="button" onClick={() => up('professor_id', prof.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${form.professor_id === prof.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                        {prof.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{prof.nome}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Objetivo e observações */}
          <div className="card-base p-5 space-y-3">
            <div>
              <label className="label-base">Objetivo</label>
              <select value={form.objetivos} onChange={e => up('objetivos', e.target.value)} className="input-base">
                <option value="">Selecionar...</option>
                {['Hipertrofia', 'Emagrecimento', 'Força', 'Condicionamento', 'Reabilitação', 'Qualidade de vida'].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Observações</label>
              <textarea value={form.observacoes} onChange={e => up('observacoes', e.target.value)} className="input-base resize-none" rows={3} placeholder="Lesões, restrições, observações..." />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('dados')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={() => setStep('confirmacao')} className="btn-primary flex-1">
              Revisar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Confirmação */}
      {step === 'confirmacao' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary-500" />Confirmar Cadastro
            </h3>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dados Pessoais</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{form.nome}</p>
              <p className="text-sm text-gray-500">{form.email}</p>
              {form.telefone && <p className="text-sm text-gray-500">{form.telefone}</p>}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Plano</p>
              {planoSelecionado ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{planoSelecionado.nome}</span>
                    <span className="text-primary-600 font-bold">R$ {planoSelecionado.valor}/mês</span>
                  </div>
                  {form.data_vencimento && (
                    <p className="text-sm text-gray-500">
                      Vence em: {new Date(form.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Sem plano definido — definir depois</p>
              )}
            </div>

            {professorSelecionado && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Professor</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{professorSelecionado.nome}</p>
              </div>
            )}

            {form.objetivos && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Objetivo</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{form.objetivos}</p>
              </div>
            )}

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 uppercase mb-1">Acesso ao Sistema</p>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Email: <strong>{form.email}</strong> · Senha: <strong>{form.senha}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('plano')} className="btn-secondary flex-1">← Voltar</button>
            <button onClick={salvar} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Cadastrando...</>
                : <><Save className="w-4 h-4" />Cadastrar Aluno</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
