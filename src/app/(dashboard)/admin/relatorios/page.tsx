'use client'

import { useState } from 'react'
import { Download, FileText, BarChart3, Users, DollarSign, Calendar, TrendingUp, Filter } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const retenção = [
  { mes: 'Jul', novos: 12, cancelamentos: 4, total: 98 },
  { mes: 'Ago', novos: 15, cancelamentos: 3, total: 110 },
  { mes: 'Set', novos: 8, cancelamentos: 6, total: 112 },
  { mes: 'Out', novos: 18, cancelamentos: 5, total: 125 },
  { mes: 'Nov', novos: 10, cancelamentos: 4, total: 131 },
  { mes: 'Dez', novos: 6, cancelamentos: 8, total: 129 },
  { mes: 'Jan', novos: 14, cancelamentos: 3, total: 140 },
]

const planoDistribuicao = [
  { name: 'Premium', value: 45, color: '#22c55e', receita: 8100 },
  { name: 'Básico', value: 60, color: '#3b82f6', receita: 7200 },
  { name: 'Família', value: 22, color: '#f59e0b', receita: 5500 },
  { name: 'Trimestral', value: 13, color: '#a855f7', receita: 4680 },
]

const diasSemanaFreq = [
  { dia: 'Seg', media: 45, pico: 68 },
  { dia: 'Ter', media: 52, pico: 71 },
  { dia: 'Qua', media: 48, pico: 65 },
  { dia: 'Qui', media: 58, pico: 82 },
  { dia: 'Sex', media: 62, pico: 89 },
  { dia: 'Sáb', media: 35, pico: 55 },
  { dia: 'Dom', media: 18, pico: 28 },
]

const alunosTop = [
  { nome: 'Carlos Silva', checkins: 24, meta: 20, plano: 'Premium' },
  { nome: 'Ana Oliveira', checkins: 22, meta: 20, plano: 'Premium' },
  { nome: 'Pedro Santos', checkins: 21, meta: 20, plano: 'Básico' },
  { nome: 'Maria Costa', checkins: 20, meta: 20, plano: 'Família' },
  { nome: 'João Ferreira', checkins: 19, meta: 20, plano: 'Básico' },
  { nome: 'Fernanda Lima', checkins: 18, meta: 20, plano: 'Premium' },
  { nome: 'Roberto Alves', checkins: 17, meta: 20, plano: 'Básico' },
  { nome: 'Juliana Santos', checkins: 16, meta: 20, plano: 'Família' },
]

type ReportType = 'financeiro' | 'presenca' | 'alunos' | 'retencao'

export default function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('financeiro')
  const [periodo, setPeriodo] = useState('mes')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExportPDF = async () => {
    setIsGenerating(true)
    // In production: use jsPDF to generate PDF
    await new Promise(r => setTimeout(r, 1500))
    setIsGenerating(false)
    // toast.success('PDF gerado com sucesso!')
  }

  const reports = [
    { key: 'financeiro', label: 'Financeiro', icon: DollarSign, color: 'text-green-500' },
    { key: 'presenca', label: 'Presença', icon: Calendar, color: 'text-blue-500' },
    { key: 'alunos', label: 'Alunos', icon: Users, color: 'text-purple-500' },
    { key: 'retencao', label: 'Retenção', icon: TrendingUp, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Análises e métricas da academia</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Exportar PDF
            </>
          )}
        </button>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reports.map(r => {
          const Icon = r.icon
          return (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key as ReportType)}
              className={`card-base p-4 flex flex-col items-center gap-2 transition-all ${
                activeReport === r.key
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:shadow-md'
              }`}
            >
              <Icon className={`w-6 h-6 ${activeReport === r.key ? 'text-primary-600' : r.color}`} />
              <span className={`text-sm font-medium ${
                activeReport === r.key
                  ? 'text-primary-700 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>{r.label}</span>
            </button>
          )
        })}
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {[
          { key: 'semana', label: 'Semana' },
          { key: 'mes', label: 'Mês' },
          { key: 'trimestre', label: 'Trimestre' },
          { key: 'ano', label: 'Ano' },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              periodo === p.key
                ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FINANCIAL REPORT */}
      {activeReport === 'financeiro' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Faturamento', value: 'R$ 26.800', change: '+9.4%', positive: true },
              { label: 'Ticket Médio', value: 'R$ 191', change: '+3.2%', positive: true },
              { label: 'Inadimplência', value: '11.8%', change: '-1.2%', positive: true },
              { label: 'Projeção Mês', value: 'R$ 28.500', change: '+6.3%', positive: true },
            ].map(kpi => (
              <div key={kpi.label} className="stat-card">
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpi.value}</p>
                <p className={`text-xs font-medium ${kpi.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>

          {/* Distribution by plan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card-base p-5">
              <h3 className="section-title">Receita por Plano</h3>
              <div className="space-y-3">
                {planoDistribuicao.map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                        <span className="text-gray-400">({p.value} alunos)</span>
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        R$ {p.receita.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(p.receita / 25480) * 100}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-base p-5">
              <h3 className="section-title">Distribuição por Plano</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planoDistribuicao} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {planoDistribuicao.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE REPORT */}
      {activeReport === 'presenca' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Média diária', value: '45' },
              { label: 'Pico do dia', value: '89 (Sex)' },
              { label: 'Check-ins/mês', value: '1.423' },
              { label: 'Frequência média', value: '68%' },
            ].map(s => (
              <div key={s.label} className="stat-card text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card-base p-5">
            <h3 className="section-title">Frequência por Dia da Semana</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={diasSemanaFreq} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Bar dataKey="media" fill="#22c55e" name="Média" radius={[3,3,0,0]} />
                <Bar dataKey="pico" fill="#3b82f6" name="Pico" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top alunos ranking */}
          <div className="card-base overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ranking de Frequência — Janeiro</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {alunosTop.map((a, i) => (
                <div key={a.nome} className="flex items-center gap-3 p-3.5">
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                  </span>
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400 flex-shrink-0">
                    {a.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="progress-bar flex-1">
                        <div className="progress-fill" style={{ width: `${(a.checkins / a.meta) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{a.checkins}/{a.meta}</span>
                    </div>
                  </div>
                  <span className="badge-info flex-shrink-0">{a.plano}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS REPORT */}
      {activeReport === 'alunos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total de Alunos', value: '140', change: '+5.3%' },
              { label: 'Ativos', value: '127', change: '+4.1%' },
              { label: 'Novos no Mês', value: '14', change: '+16.7%' },
              { label: 'Cancelamentos', value: '3', change: '-40%' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{s.value}</p>
                <p className="text-xs text-green-500 font-medium">{s.change}</p>
              </div>
            ))}
          </div>

          <div className="card-base p-5">
            <h3 className="section-title">Evolução da Base de Alunos</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={retenção}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5} name="Total" dot={{ r: 4 }} />
                <Bar dataKey="novos" fill="#3b82f6" name="Novos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* RETENTION REPORT */}
      {activeReport === 'retencao' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Taxa Retenção', value: '94.2%', positive: true },
              { label: 'LTV Médio', value: 'R$ 2.292', positive: true },
              { label: 'Churn Rate', value: '2.3%', positive: false },
              { label: 'MRR', value: 'R$ 26.800', positive: true },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.positive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="card-base p-5">
            <h3 className="section-title">Novos Alunos x Cancelamentos</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={retenção} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Bar dataKey="novos" fill="#22c55e" name="Novos" radius={[3,3,0,0]} />
                <Bar dataKey="cancelamentos" fill="#ef4444" name="Cancelamentos" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
