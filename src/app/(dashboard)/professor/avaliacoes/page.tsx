'use client'

import { useState } from 'react'
import {
  Activity, TrendingUp, TrendingDown, Minus,
  Camera, Upload, ArrowLeft, Save, Calendar, User
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const mockAlunos = [
  { id: '1', nome: 'Carlos Silva', matricula: 'GF2024001' },
  { id: '2', nome: 'Ana Oliveira', matricula: 'GF2024002' },
  { id: '3', nome: 'Pedro Santos', matricula: 'GF2024003' },
]

// Historical data for evolution charts
const evolucaoPeso = [
  { data: 'Jul/23', peso: 95.2, imc: 31.4, gordura: 28.5 },
  { data: 'Ago/23', peso: 93.8, imc: 30.9, gordura: 27.2 },
  { data: 'Set/23', peso: 91.5, imc: 30.1, gordura: 26.1 },
  { data: 'Out/23', peso: 89.2, imc: 29.4, gordura: 24.8 },
  { data: 'Nov/23', peso: 87.0, imc: 28.6, gordura: 23.5 },
  { data: 'Dez/23', peso: 85.5, imc: 28.1, gordura: 22.8 },
  { data: 'Jan/24', peso: 84.3, imc: 27.7, gordura: 22.1 },
]

const evolucaoMedidas = [
  { data: 'Jul/23', cintura: 95, quadril: 108, braco: 38, coxa: 62 },
  { data: 'Set/23', cintura: 91, quadril: 105, braco: 39, coxa: 63 },
  { data: 'Nov/23', cintura: 87, quadril: 102, braco: 40, coxa: 64 },
  { data: 'Jan/24', cintura: 83, quadril: 99, braco: 41, coxa: 65 },
]

function getIMCCategory(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Peso normal', color: 'text-green-500' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' }
  if (imc < 35) return { label: 'Obesidade I', color: 'text-orange-500' }
  return { label: 'Obesidade II+', color: 'text-red-500' }
}

export default function AvaliacoesPage() {
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova')
  const [selectedAluno, setSelectedAluno] = useState('')
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    percentual_gordura: '',
    braco_d: '', braco_e: '',
    peito: '', cintura: '', abdomen: '', quadril: '',
    coxa_d: '', coxa_e: '',
    panturrilha_d: '', panturrilha_e: '',
    observacoes: '',
  })

  const imc = form.peso && form.altura
    ? (Number(form.peso) / Math.pow(Number(form.altura) / 100, 2)).toFixed(1)
    : null

  const imcCategory = imc ? getIMCCategory(Number(imc)) : null

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const lastAvaliacao = evolucaoPeso[evolucaoPeso.length - 1]
  const prevAvaliacao = evolucaoPeso[evolucaoPeso.length - 2]
  const pesoDiff = lastAvaliacao.peso - prevAvaliacao.peso
  const gorduraDiff = lastAvaliacao.gordura - prevAvaliacao.gordura

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Avaliações Físicas</h1>
          <p className="page-subtitle">Registro e acompanhamento de evolução</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'nova', label: 'Nova Avaliação' },
          { key: 'historico', label: 'Histórico & Evolução' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Assessment */}
      {activeTab === 'nova' && (
        <div className="space-y-4">
          {/* Aluno selection */}
          <div className="card-base p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Gerais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Aluno *</label>
                <select
                  value={selectedAluno}
                  onChange={e => setSelectedAluno(e.target.value)}
                  className="input-base"
                >
                  <option value="">Selecionar aluno...</option>
                  {mockAlunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Data da avaliação *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => updateForm('data', e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Biometric data */}
          <div className="card-base p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Biométricos</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="label-base">Peso (kg)</label>
                <input type="number" step="0.1" value={form.peso} onChange={e => updateForm('peso', e.target.value)} className="input-base" placeholder="75.5" />
              </div>
              <div>
                <label className="label-base">Altura (cm)</label>
                <input type="number" value={form.altura} onChange={e => updateForm('altura', e.target.value)} className="input-base" placeholder="175" />
              </div>
              <div>
                <label className="label-base">% Gordura</label>
                <input type="number" step="0.1" value={form.percentual_gordura} onChange={e => updateForm('percentual_gordura', e.target.value)} className="input-base" placeholder="18.5" />
              </div>
            </div>

            {/* IMC indicator */}
            {imc && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">IMC calculado</p>
                  <p className={`text-xs ${imcCategory?.color}`}>{imcCategory?.label}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{imc}</p>
              </div>
            )}
          </div>

          {/* Body measurements */}
          <div className="card-base p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais (cm)</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Braço D.', field: 'braco_d' },
                { label: 'Braço E.', field: 'braco_e' },
                { label: 'Peito', field: 'peito' },
                { label: 'Cintura', field: 'cintura' },
                { label: 'Abdômen', field: 'abdomen' },
                { label: 'Quadril', field: 'quadril' },
                { label: 'Coxa D.', field: 'coxa_d' },
                { label: 'Coxa E.', field: 'coxa_e' },
                { label: 'Panturrilha D.', field: 'panturrilha_d' },
                { label: 'Panturrilha E.', field: 'panturrilha_e' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="label-base">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form[field as keyof typeof form]}
                    onChange={e => updateForm(field, e.target.value)}
                    className="input-base"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Progress photos */}
          <div className="card-base p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fotos de Evolução</h3>
            <p className="text-sm text-gray-400">Upload de fotos de frente, costas e lateral</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Frente', 'Costas', 'Lateral E.', 'Lateral D.'].map(tipo => (
                <div
                  key={tipo}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-400 transition-colors"
                >
                  <Camera className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                  <p className="text-xs text-gray-400 text-center">{tipo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="card-base p-4">
            <label className="label-base">Observações / Conclusões</label>
            <textarea
              value={form.observacoes}
              onChange={e => updateForm('observacoes', e.target.value)}
              className="input-base resize-none"
              rows={4}
              placeholder="Observações gerais sobre a avaliação, metas, recomendações..."
            />
          </div>

          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Avaliação
          </button>
        </div>
      )}

      {/* History & Evolution */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          {/* Aluno selector */}
          <div className="card-base p-4">
            <label className="label-base">Selecionar aluno</label>
            <select
              value={selectedAluno}
              onChange={e => setSelectedAluno(e.target.value)}
              className="input-base"
            >
              <option value="">Selecionar...</option>
              {mockAlunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          {/* Evolution summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Peso atual', value: `${lastAvaliacao.peso}kg`, diff: pesoDiff, unit: 'kg', icon: Activity },
              { label: 'IMC', value: lastAvaliacao.imc, diff: lastAvaliacao.imc - prevAvaliacao.imc, icon: Activity },
              { label: '% Gordura', value: `${lastAvaliacao.gordura}%`, diff: gorduraDiff, unit: '%', icon: TrendingDown },
              { label: 'Avaliações', value: evolucaoPeso.length, icon: Calendar },
            ].map(({ label, value, diff, icon: Icon }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                {diff !== undefined && (
                  <p className={`text-xs flex items-center gap-0.5 ${
                    diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {diff < 0 ? <TrendingDown className="w-3 h-3" /> : diff > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {Math.abs(diff).toFixed(1)} vs anterior
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Peso e gordura chart */}
          <div className="card-base p-5">
            <h3 className="section-title">Evolução de Peso e % Gordura</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoPeso}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="peso" tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                <YAxis yAxisId="gordura" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Line yAxisId="peso" type="monotone" dataKey="peso" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} name="Peso (kg)" />
                <Line yAxisId="gordura" type="monotone" dataKey="gordura" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Gordura (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Medidas chart */}
          <div className="card-base p-5">
            <h3 className="section-title">Evolução de Medidas (cm)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoMedidas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Line type="monotone" dataKey="cintura" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cintura" />
                <Line type="monotone" dataKey="quadril" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Quadril" />
                <Line type="monotone" dataKey="braco" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Braço" />
                <Line type="monotone" dataKey="coxa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Coxa" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* History list */}
          <div className="card-base overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Histórico de Avaliações</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {evolucaoPeso.slice().reverse().map((av, i) => (
                <div key={av.data} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{av.data}</p>
                        <p className="text-xs text-gray-400">
                          Peso: {av.peso}kg · IMC: {av.imc} · Gordura: {av.gordura}%
                        </p>
                      </div>
                    </div>
                    <button className="btn-ghost text-xs px-2 py-1">Ver detalhes</button>
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
