'use client'

import { useState } from 'react'
import {
  Activity, TrendingDown, TrendingUp, Save, Calendar, ArrowLeft, Camera
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const mockAlunos = [
  { id: '1', nome: 'Carlos Silva' },
  { id: '2', nome: 'Ana Oliveira' },
  { id: '3', nome: 'Pedro Santos' },
  { id: '4', nome: 'Maria Costa' },
  { id: '5', nome: 'João Ferreira' },
]

const evolucaoPeso = [
  { data: 'Jul/23', peso: 95.2, imc: 31.1, gordura: 28.5 },
  { data: 'Set/23', peso: 91.5, imc: 29.9, gordura: 26.1 },
  { data: 'Nov/23', peso: 87.0, imc: 28.4, gordura: 23.5 },
  { data: 'Jan/24', peso: 84.3, imc: 27.5, gordura: 22.1 },
]

const evolucaoMedidas = [
  { data: 'Jul/23', cintura: 95, braco: 35, coxa: 55 },
  { data: 'Set/23', cintura: 91, braco: 36, coxa: 56 },
  { data: 'Nov/23', cintura: 87, braco: 37, coxa: 57 },
  { data: 'Jan/24', cintura: 83, braco: 38, coxa: 58 },
]

const historicoAvaliacoes = [
  { id: '1', data: '2024-01-15', peso: 84.3, imc: 27.5, gordura: 22.1, obs: 'Ótima evolução! -11kg em 6 meses.' },
  { id: '2', data: '2023-11-10', peso: 87.0, imc: 28.4, gordura: 23.5, obs: 'Progresso consistente.' },
  { id: '3', data: '2023-09-05', peso: 91.5, imc: 29.9, gordura: 26.1, obs: 'Início do protocolo.' },
  { id: '4', data: '2023-07-01', peso: 95.2, imc: 31.1, gordura: 28.5, obs: 'Avaliação inicial.' },
]

function getIMCInfo(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Normal', color: 'text-green-500' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' }
  return { label: 'Obesidade', color: 'text-red-500' }
}

type Tab = 'nova' | 'historico'

export default function AvaliacoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('nova')
  const [alunoId, setAlunoId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    peso: '', altura: '', percentual_gordura: '',
    braco_d: '', braco_e: '', peito: '', cintura: '',
    abdomen: '', quadril: '', coxa_d: '', coxa_e: '',
    panturrilha_d: '', panturrilha_e: '', ombro: '',
    observacoes: '',
  })

  const up = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const imc = form.peso && form.altura && Number(form.altura) > 0
    ? (Number(form.peso) / Math.pow(Number(form.altura) / 100, 2)).toFixed(1)
    : null

  const imcInfo = imc ? getIMCInfo(Number(imc)) : null

  const salvar = async () => {
    if (!alunoId) { toast.error('Selecione um aluno'); return }
    if (!form.peso && !form.altura) { toast.error('Preencha ao menos peso e altura'); return }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Avaliação salva com sucesso!')
    setIsLoading(false)
    setActiveTab('historico')
  }

  const medidas = [
    { label: 'Braço D.', field: 'braco_d' }, { label: 'Braço E.', field: 'braco_e' },
    { label: 'Peito', field: 'peito' }, { label: 'Cintura', field: 'cintura' },
    { label: 'Abdômen', field: 'abdomen' }, { label: 'Quadril', field: 'quadril' },
    { label: 'Coxa D.', field: 'coxa_d' }, { label: 'Coxa E.', field: 'coxa_e' },
    { label: 'Panturrilha D.', field: 'panturrilha_d' }, { label: 'Panturrilha E.', field: 'panturrilha_e' },
    { label: 'Ombro', field: 'ombro' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Avaliações Físicas</h1>
        <p className="page-subtitle">Registre e acompanhe a evolução dos alunos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[
          { key: 'nova', label: '+ Nova Avaliação' },
          { key: 'historico', label: 'Histórico & Evolução' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── NOVA AVALIAÇÃO ── */}
      {activeTab === 'nova' && (
        <div className="max-w-2xl space-y-4">
          {/* Aluno e data */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Gerais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Aluno *</label>
                <select value={alunoId} onChange={e => setAlunoId(e.target.value)} className="input-base">
                  <option value="">Selecionar aluno...</option>
                  {mockAlunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Data da avaliação *</label>
                <input type="date" value={form.data} onChange={e => up('data', e.target.value)} className="input-base" />
              </div>
            </div>
          </div>

          {/* Dados biométricos */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Biométricos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="label-base">Peso (kg)</label>
                <input type="number" step="0.1" value={form.peso} onChange={e => up('peso', e.target.value)} className="input-base" placeholder="84.5" />
              </div>
              <div>
                <label className="label-base">Altura (cm)</label>
                <input type="number" value={form.altura} onChange={e => up('altura', e.target.value)} className="input-base" placeholder="175" />
              </div>
              <div>
                <label className="label-base">% Gordura</label>
                <input type="number" step="0.1" value={form.percentual_gordura} onChange={e => up('percentual_gordura', e.target.value)} className="input-base" placeholder="22.1" />
              </div>
            </div>

            {/* IMC calculado */}
            {imc && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">IMC calculado</p>
                  <p className={`text-xs font-medium ${imcInfo?.color}`}>{imcInfo?.label}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{imc}</p>
              </div>
            )}
          </div>

          {/* Medidas corporais */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais (cm)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {medidas.map(m => (
                <div key={m.field}>
                  <label className="label-base">{m.label}</label>
                  <input
                    type="number" step="0.1"
                    value={form[m.field as keyof typeof form]}
                    onChange={e => up(m.field, e.target.value)}
                    className="input-base"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fotos de progresso */}
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fotos de Progresso</h3>
            <div className="grid grid-cols-4 gap-2">
              {['Frente', 'Costas', 'Lat. E.', 'Lat. D.'].map(tipo => (
                <div key={tipo} className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary-400 transition-colors">
                  <Camera className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                  <p className="text-xs text-gray-400 text-center leading-tight">{tipo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="card-base p-5">
            <label className="label-base">Observações / Recomendações</label>
            <textarea
              value={form.observacoes}
              onChange={e => up('observacoes', e.target.value)}
              className="input-base resize-none"
              rows={4}
              placeholder="Observações gerais, metas, recomendações para o aluno..."
            />
          </div>

          <button
            onClick={salvar}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
              : <><Save className="w-4 h-4" /> Salvar Avaliação</>
            }
          </button>
        </div>
      )}

      {/* ── HISTÓRICO & EVOLUÇÃO ── */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          {/* Seletor de aluno */}
          <div className="card-base p-4">
            <label className="label-base">Selecionar aluno</label>
            <select value={alunoId} onChange={e => setAlunoId(e.target.value)} className="input-base">
              <option value="">Selecionar...</option>
              {mockAlunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Peso atual', value: `${evolucaoPeso[evolucaoPeso.length - 1].peso}kg`, diff: -10.9, icon: Activity },
              { label: 'IMC', value: evolucaoPeso[evolucaoPeso.length - 1].imc, diff: -3.6, icon: TrendingDown },
              { label: '% Gordura', value: `${evolucaoPeso[evolucaoPeso.length - 1].gordura}%`, diff: -6.4, icon: TrendingDown },
              { label: 'Avaliações', value: historicoAvaliacoes.length, diff: null, icon: Calendar },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="stat-card">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                  {s.diff !== null && (
                    <p className={`text-xs font-medium flex items-center gap-0.5 ${s.diff < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(s.diff)} total
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Gráfico peso e gordura */}
          <div className="card-base p-5">
            <h3 className="section-title">Evolução de Peso e % Gordura</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoPeso}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="peso" tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                <YAxis yAxisId="gordura" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Line yAxisId="peso" type="monotone" dataKey="peso" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Peso (kg)" />
                <Line yAxisId="gordura" type="monotone" dataKey="gordura" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Gordura (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico medidas */}
          <div className="card-base p-5">
            <h3 className="section-title">Evolução de Medidas (cm)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolucaoMedidas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="cintura" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cintura" />
                <Line type="monotone" dataKey="braco" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Braço" />
                <Line type="monotone" dataKey="coxa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Coxa" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de avaliações */}
          <div className="card-base overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Histórico de Avaliações</h3>
              <button onClick={() => setActiveTab('nova')} className="btn-primary text-xs py-1.5 px-3">
                + Nova
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {historicoAvaliacoes.map((av, i) => (
                <div key={av.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {i === 0 && <span className="ml-2 badge-success text-xs">Mais recente</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Peso: <strong>{av.peso}kg</strong> · IMC: <strong>{av.imc}</strong> · Gordura: <strong>{av.gordura}%</strong>
                        </p>
                        {av.obs && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{av.obs}"</p>}
                      </div>
                    </div>
                    {i > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-medium flex items-center gap-0.5 ${
                          av.peso > evolucaoPeso[evolucaoPeso.length - 1].peso ? 'text-red-500' : 'text-green-500'
                        }`}>
                          <TrendingDown className="w-3 h-3" />
                          {(av.peso - evolucaoPeso[evolucaoPeso.length - 1].peso).toFixed(1)}kg
                        </p>
                        <p className="text-xs text-gray-400">vs atual</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
