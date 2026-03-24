'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Building2, CreditCard, Bell, Clock, Save, Plus, Edit, Trash2, CheckCircle2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const mockAcademia = {
  nome: 'GymFlow Academia',
  cnpj: '12.345.678/0001-99',
  email: 'contato@gymflow.com',
  telefone: '(32) 3333-4444',
  endereco: { logradouro: 'Rua das Flores, 123', bairro: 'Centro', cidade: 'Juiz de Fora', estado: 'MG', cep: '36000-000' },
  horario_abertura: '06:00',
  horario_fechamento: '22:00',
  horario_sabado: '08:00 - 18:00',
  horario_domingo: 'Fechado',
}

const mockPlanos = [
  { id: '1', nome: 'Básico', descricao: 'Acesso à musculação', valor: 120, duracao_dias: 30, ativo: true },
  { id: '2', nome: 'Premium', descricao: 'Acesso completo + aulas', valor: 180, duracao_dias: 30, ativo: true },
  { id: '3', nome: 'Família', descricao: 'Até 3 membros', valor: 250, duracao_dias: 30, ativo: true },
  { id: '4', nome: 'Trimestral', descricao: 'Básico por 3 meses', valor: 320, duracao_dias: 90, ativo: false },
]

type Tab = 'geral' | 'planos' | 'horarios' | 'notificacoes'

// ============================================================
// VIEW DO PROFESSOR — somente leitura
// ============================================================
function ProfessorView() {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Informações da academia</p>
      </div>

      <div className="card-base p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{mockAcademia.nome}</h2>
            <p className="text-sm text-gray-400">{mockAcademia.cnpj}</p>
          </div>
        </div>

        <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
          {[
            { label: 'Email', value: mockAcademia.email },
            { label: 'Telefone', value: mockAcademia.telefone },
            { label: 'Endereço', value: `${mockAcademia.endereco.logradouro}, ${mockAcademia.endereco.cidade} - ${mockAcademia.endereco.estado}` },
            { label: 'Seg - Sex', value: `${mockAcademia.horario_abertura} - ${mockAcademia.horario_fechamento}` },
            { label: 'Sábado', value: mockAcademia.horario_sabado },
            { label: 'Domingo', value: mockAcademia.horario_domingo },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[220px]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-base p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Planos disponíveis</h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {mockPlanos.filter(p => p.ativo).map(plano => (
            <div key={plano.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{plano.nome}</p>
                <p className="text-xs text-gray-400">{plano.descricao}</p>
              </div>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                R$ {plano.valor}/mês
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        Para alterar configurações, entre em contato com o administrador.
      </p>
    </div>
  )
}

// ============================================================
// VIEW DO ADMIN — acesso completo
// ============================================================
function AdminView() {
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [academia, setAcademia] = useState(mockAcademia)
  const [planos, setPlanos] = useState(mockPlanos)
  const [showPlanoForm, setShowPlanoForm] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState<typeof mockPlanos[0] | null>(null)
  const [planoForm, setPlanoForm] = useState({ nome: '', descricao: '', valor: '', duracao_dias: '30' })
  const [notifConfig, setNotifConfig] = useState({
    pagamento_vencendo: true,
    pagamento_vencido: true,
    aniversario: true,
    novo_aluno: true,
    dias_antecedencia: '3',
  })

  const salvar = () => toast.success('Configurações salvas!')

  const abrirNovoPLano = () => {
    setPlanoForm({ nome: '', descricao: '', valor: '', duracao_dias: '30' })
    setEditandoPlano(null)
    setShowPlanoForm(true)
  }

  const abrirEditarPlano = (plano: typeof mockPlanos[0]) => {
    setPlanoForm({ nome: plano.nome, descricao: plano.descricao, valor: String(plano.valor), duracao_dias: String(plano.duracao_dias) })
    setEditandoPlano(plano)
    setShowPlanoForm(true)
  }

  const salvarPlano = () => {
    if (!planoForm.nome || !planoForm.valor) return
    if (editandoPlano) {
      setPlanos(prev => prev.map(p => p.id === editandoPlano.id
        ? { ...p, ...planoForm, valor: Number(planoForm.valor), duracao_dias: Number(planoForm.duracao_dias) } : p))
      toast.success('Plano atualizado!')
    } else {
      setPlanos(prev => [...prev, { id: String(Date.now()), nome: planoForm.nome, descricao: planoForm.descricao, valor: Number(planoForm.valor), duracao_dias: Number(planoForm.duracao_dias), ativo: true }])
      toast.success('Plano criado!')
    }
    setShowPlanoForm(false)
  }

  const tabs = [
    { key: 'geral', label: 'Geral', icon: Building2 },
    { key: 'planos', label: 'Planos', icon: CreditCard },
    { key: 'horarios', label: 'Horários', icon: Clock },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie as configurações da sua academia</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
              className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />{t.label}
            </button>
          )
        })}
      </div>

      {/* GERAL */}
      {activeTab === 'geral' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" /> Dados da Academia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label-base">Nome da academia</label>
                <input type="text" value={academia.nome} onChange={e => setAcademia(p => ({ ...p, nome: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="label-base">CNPJ</label>
                <input type="text" value={academia.cnpj} onChange={e => setAcademia(p => ({ ...p, cnpj: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="label-base">Telefone</label>
                <input type="tel" value={academia.telefone} onChange={e => setAcademia(p => ({ ...p, telefone: e.target.value }))} className="input-base" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-base">Email</label>
                <input type="email" value={academia.email} onChange={e => setAcademia(p => ({ ...p, email: e.target.value }))} className="input-base" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-base">Logradouro</label>
                <input type="text" value={academia.endereco.logradouro} onChange={e => setAcademia(p => ({ ...p, endereco: { ...p.endereco, logradouro: e.target.value } }))} className="input-base" />
              </div>
              <div>
                <label className="label-base">Cidade</label>
                <input type="text" value={academia.endereco.cidade} onChange={e => setAcademia(p => ({ ...p, endereco: { ...p.endereco, cidade: e.target.value } }))} className="input-base" />
              </div>
              <div>
                <label className="label-base">Estado</label>
                <select value={academia.endereco.estado} onChange={e => setAcademia(p => ({ ...p, endereco: { ...p.endereco, estado: e.target.value } }))} className="input-base">
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={salvar} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Salvar Configurações
          </button>
        </div>
      )}

      {/* PLANOS */}
      {activeTab === 'planos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{planos.length} planos</p>
            <button onClick={abrirNovoPLano} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Novo Plano
            </button>
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
                  <p className="text-xs text-gray-400">{plano.descricao} · {plano.duracao_dias} dias</p>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-0.5">R$ {plano.valor}/mês</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => abrirEditarPlano(plano)} className="btn-ghost p-1.5"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setPlanos(prev => prev.map(p => p.id === plano.id ? { ...p, ativo: !p.ativo } : p))} className="btn-ghost p-1.5"><CheckCircle2 className="w-4 h-4" /></button>
                  <button onClick={() => setPlanos(prev => prev.filter(p => p.id !== plano.id))} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

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
                    <div><label className="label-base">Valor (R$) *</label><input type="number" value={planoForm.valor} onChange={e => setPlanoForm(p => ({ ...p, valor: e.target.value }))} className="input-base" placeholder="120" /></div>
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
                  <button onClick={salvarPlano} disabled={!planoForm.nome || !planoForm.valor} className="btn-primary flex-1">{editandoPlano ? 'Salvar' : 'Criar'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HORÁRIOS */}
      {activeTab === 'horarios' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" /> Horário de Funcionamento
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-28 flex-shrink-0">Seg - Sex</span>
              <input type="time" value={academia.horario_abertura} onChange={e => setAcademia(p => ({ ...p, horario_abertura: e.target.value }))} className="input-base w-32" />
              <span className="text-gray-400 text-sm">até</span>
              <input type="time" value={academia.horario_fechamento} onChange={e => setAcademia(p => ({ ...p, horario_fechamento: e.target.value }))} className="input-base w-32" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-28 flex-shrink-0">Sábado</span>
              <input type="text" value={academia.horario_sabado} onChange={e => setAcademia(p => ({ ...p, horario_sabado: e.target.value }))} className="input-base" placeholder="08:00 - 14:00 ou Fechado" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-28 flex-shrink-0">Domingo</span>
              <input type="text" value={academia.horario_domingo} onChange={e => setAcademia(p => ({ ...p, horario_domingo: e.target.value }))} className="input-base" placeholder="Fechado" />
            </div>
          </div>
          <button onClick={salvar} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Salvar Horários
          </button>
        </div>
      )}

      {/* NOTIFICAÇÕES */}
      {activeTab === 'notificacoes' && (
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" /> Alertas Automáticos
          </h3>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
            {[
              { key: 'pagamento_vencendo', label: 'Pagamento vencendo', desc: 'Avisar alunos antes do vencimento' },
              { key: 'pagamento_vencido', label: 'Pagamento vencido', desc: 'Avisar alunos com pagamento em atraso' },
              { key: 'aniversario', label: 'Aniversário do aluno', desc: 'Parabenizar alunos no aniversário' },
              { key: 'novo_aluno', label: 'Boas-vindas novo aluno', desc: 'Enviar mensagem ao novo cadastro' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifConfig(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                  className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ml-4 ${notifConfig[n.key as keyof typeof notifConfig] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-1 ${notifConfig[n.key as keyof typeof notifConfig] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
          {notifConfig.pagamento_vencendo && (
            <div>
              <label className="label-base">Dias de antecedência</label>
              <select value={notifConfig.dias_antecedencia} onChange={e => setNotifConfig(p => ({ ...p, dias_antecedencia: e.target.value }))} className="input-base">
                <option value="1">1 dia antes</option>
                <option value="3">3 dias antes</option>
                <option value="5">5 dias antes</option>
                <option value="7">7 dias antes</option>
              </select>
            </div>
          )}
          <button onClick={() => toast.success('Notificações salvas!')} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL — decide qual view renderizar
// ============================================================
export default function ConfiguracoesPage() {
  const { role } = useAuth()
  return role === 'admin' ? <AdminView /> : <ProfessorView />
}
