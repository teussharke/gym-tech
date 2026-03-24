'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, CreditCard, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const mockProfessores = [
  { id: '1', nome: 'Carlos Souza' },
  { id: '2', nome: 'Ana Paula Ferreira' },
]

const mockPlanos = [
  { id: '1', nome: 'Básico', valor: 120 },
  { id: '2', nome: 'Premium', valor: 180 },
  { id: '3', nome: 'Família', valor: 250 },
  { id: '4', nome: 'Trimestral', valor: 320 },
]

export default function NovoAlunoPage() {
  const router = useRouter()
  const [step, setStep] = useState<'dados' | 'plano' | 'confirmacao'>('dados')
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    // Dados pessoais
    nome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    cpf: '',
    // Endereço
    endereco: '',
    cidade: '',
    estado: 'MG',
    // Academia
    professor_id: '',
    plano_id: '',
    data_vencimento: '',
    objetivos: '',
    observacoes: '',
    // Senha inicial
    senha: '123456',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const planoSelecionado = mockPlanos.find(p => p.id === form.plano_id)
  const professorSelecionado = mockProfessores.find(p => p.id === form.professor_id)

  const salvar = async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    toast.success('Aluno cadastrado com sucesso!')
    router.push('/admin/alunos')
  }

  const steps = [
    { key: 'dados', label: 'Dados Pessoais', icon: User },
    { key: 'plano', label: 'Plano e Professor', icon: CreditCard },
    { key: 'confirmacao', label: 'Confirmação', icon: UserCheck },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Novo Aluno</h1>
          <p className="page-subtitle">Preencha os dados do novo aluno</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {steps.map((s, i) => {
          const Icon = s.icon
          const isActive = step === s.key
          const isDone = steps.findIndex(x => x.key === step) > i
          return (
            <button
              key={s.key}
              onClick={() => isDone && setStep(s.key as typeof step)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : isDone
                  ? 'text-primary-600 dark:text-primary-400 cursor-pointer'
                  : 'text-gray-400 cursor-default'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          )
        })}
      </div>

      {/* STEP 1: Dados pessoais */}
      {step === 'dados' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais</h3>

            <div>
              <label className="label-base">Nome completo *</label>
              <input type="text" value={form.nome} onChange={e => update('nome', e.target.value)} className="input-base" placeholder="Nome do aluno" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Email *</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-base" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label-base">Telefone</label>
                <input type="tel" value={form.telefone} onChange={e => update('telefone', e.target.value)} className="input-base" placeholder="(32) 99999-9999" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Data de nascimento</label>
                <input type="date" value={form.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="label-base">CPF</label>
                <input type="text" value={form.cpf} onChange={e => update('cpf', e.target.value)} className="input-base" placeholder="000.000.000-00" />
              </div>
            </div>
          </div>

          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Endereço</h3>
            <div>
              <label className="label-base">Logradouro</label>
              <input type="text" value={form.endereco} onChange={e => update('endereco', e.target.value)} className="input-base" placeholder="Rua, número, complemento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">Cidade</label>
                <input type="text" value={form.cidade} onChange={e => update('cidade', e.target.value)} className="input-base" placeholder="Juiz de Fora" />
              </div>
              <div>
                <label className="label-base">Estado</label>
                <select value={form.estado} onChange={e => update('estado', e.target.value)} className="input-base">
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Acesso ao Sistema</h3>
            <div>
              <label className="label-base">Senha inicial</label>
              <input type="text" value={form.senha} onChange={e => update('senha', e.target.value)} className="input-base" />
              <p className="text-xs text-gray-400 mt-1">O aluno poderá alterar a senha no primeiro acesso.</p>
            </div>
          </div>

          <button
            onClick={() => setStep('plano')}
            disabled={!form.nome || !form.email}
            className="btn-primary w-full"
          >
            Próximo: Plano e Professor →
          </button>
        </div>
      )}

      {/* STEP 2: Plano e professor */}
      {step === 'plano' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plano de Mensalidade</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockPlanos.map(plano => (
                <button
                  key={plano.id}
                  type="button"
                  onClick={() => update('plano_id', plano.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.plano_id === plano.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{plano.nome}</p>
                  <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">R$ {plano.valor}/mês</p>
                </button>
              ))}
            </div>

            <div>
              <label className="label-base">Data de vencimento *</label>
              <input type="date" value={form.data_vencimento} onChange={e => update('data_vencimento', e.target.value)} className="input-base" />
            </div>
          </div>

          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Professor Responsável</h3>

            <div className="space-y-2">
              {mockProfessores.map(prof => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => update('professor_id', prof.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                    form.professor_id === prof.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                      {prof.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{prof.nome}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Adicionais</h3>
            <div>
              <label className="label-base">Objetivo</label>
              <select value={form.objetivos} onChange={e => update('objetivos', e.target.value)} className="input-base">
                <option value="">Selecionar...</option>
                <option>Hipertrofia</option>
                <option>Emagrecimento</option>
                <option>Força</option>
                <option>Condicionamento</option>
                <option>Reabilitação</option>
                <option>Qualidade de vida</option>
              </select>
            </div>
            <div>
              <label className="label-base">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => update('observacoes', e.target.value)}
                className="input-base resize-none"
                rows={3}
                placeholder="Lesões, restrições, informações relevantes..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('dados')} className="btn-secondary flex-1">← Voltar</button>
            <button
              onClick={() => setStep('confirmacao')}
              disabled={!form.plano_id || !form.data_vencimento}
              className="btn-primary flex-1"
            >
              Revisar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirmação */}
      {step === 'confirmacao' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary-500" />
              Confirmar Cadastro
            </h3>

            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dados Pessoais</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{form.nome}</p>
                <p className="text-sm text-gray-500">{form.email}</p>
                {form.telefone && <p className="text-sm text-gray-500">{form.telefone}</p>}
                {form.cpf && <p className="text-sm text-gray-500">CPF: {form.cpf}</p>}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plano</p>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{planoSelecionado?.nome}</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">R$ {planoSelecionado?.valor}/mês</span>
                </div>
                <p className="text-sm text-gray-500">Vence em: {new Date(form.data_vencimento).toLocaleDateString('pt-BR')}</p>
              </div>

              {professorSelecionado && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Professor</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{professorSelecionado.nome}</p>
                </div>
              )}

              {form.objetivos && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Objetivo</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{form.objetivos}</p>
                </div>
              )}

              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 uppercase mb-1">Acesso ao Sistema</p>
                <p className="text-sm text-primary-800 dark:text-primary-300">
                  Email: <strong>{form.email}</strong> · Senha inicial: <strong>{form.senha}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('plano')} className="btn-secondary flex-1">← Voltar</button>
            <button
              onClick={salvar}
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Cadastrando...</>
              ) : (
                <><Save className="w-4 h-4" /> Cadastrar Aluno</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
