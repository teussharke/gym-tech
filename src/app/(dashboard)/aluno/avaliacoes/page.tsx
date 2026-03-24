'use client'

import { useState } from 'react'
import { Activity, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Camera } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const mockAvaliacoes = [
  {
    id: '1',
    data: '2024-01-15',
    peso_kg: 84.3,
    altura_cm: 175,
    imc: 27.5,
    percentual_gordura: 22.1,
    medidas: {
      braco_direito: 38, peito: 102, cintura: 83,
      abdomen: 87, quadril: 99, coxa_direita: 58, panturrilha_direita: 38,
    },
    observacoes: 'Ótima evolução! Redução de 11kg em 6 meses. Manter dieta e intensidade.',
  },
  {
    id: '2',
    data: '2023-11-10',
    peso_kg: 87.0,
    altura_cm: 175,
    imc: 28.4,
    percentual_gordura: 23.5,
    medidas: {
      braco_direito: 37, peito: 104, cintura: 87,
      abdomen: 91, quadril: 102, coxa_direita: 57, panturrilha_direita: 37,
    },
    observacoes: 'Progresso consistente. Aumentar treino de cardio.',
  },
  {
    id: '3',
    data: '2023-09-05',
    peso_kg: 91.5,
    altura_cm: 175,
    imc: 29.9,
    percentual_gordura: 26.1,
    medidas: {
      braco_direito: 36, peito: 107, cintura: 91,
      abdomen: 95, quadril: 105, coxa_direita: 56, panturrilha_direita: 37,
    },
    observacoes: 'Início do protocolo de emagrecimento.',
  },
  {
    id: '4',
    data: '2023-07-01',
    peso_kg: 95.2,
    altura_cm: 175,
    imc: 31.1,
    percentual_gordura: 28.5,
    medidas: {
      braco_direito: 35, peito: 110, cintura: 95,
      abdomen: 99, quadril: 108, coxa_direita: 55, panturrilha_direita: 36,
    },
    observacoes: 'Avaliação inicial.',
  },
]

const evolucaoGrafico = mockAvaliacoes.slice().reverse().map(a => ({
  data: new Date(a.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
  peso: a.peso_kg,
  gordura: a.percentual_gordura,
  imc: a.imc,
}))

const medidasGrafico = mockAvaliacoes.slice().reverse().map(a => ({
  data: new Date(a.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
  cintura: a.medidas.cintura,
  braco: a.medidas.braco_direito,
  coxa: a.medidas.coxa_direita,
}))

function getIMCLabel(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Normal', color: 'text-green-500' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' }
  return { label: 'Obesidade', color: 'text-red-500' }
}

export default function AvaliacoesAlunoPage() {
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico' | 'graficos'>('resumo')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const ultima = mockAvaliacoes[0]
  const penultima = mockAvaliacoes[1]
  const imcInfo = getIMCLabel(ultima.imc)

  const diff = (a: number, b: number) => Number((a - b).toFixed(1))

  const medidas = [
    { label: 'Braço D.', atual: ultima.medidas.braco_direito, anterior: penultima.medidas.braco_direito, unit: 'cm', positiveIsGood: true },
    { label: 'Peito', atual: ultima.medidas.peito, anterior: penultima.medidas.peito, unit: 'cm', positiveIsGood: false },
    { label: 'Cintura', atual: ultima.medidas.cintura, anterior: penultima.medidas.cintura, unit: 'cm', positiveIsGood: false },
    { label: 'Abdômen', atual: ultima.medidas.abdomen, anterior: penultima.medidas.abdomen, unit: 'cm', positiveIsGood: false },
    { label: 'Quadril', atual: ultima.medidas.quadril, anterior: penultima.medidas.quadril, unit: 'cm', positiveIsGood: false },
    { label: 'Coxa D.', atual: ultima.medidas.coxa_direita, anterior: penultima.medidas.coxa_direita, unit: 'cm', positiveIsGood: true },
    { label: 'Panturrilha', atual: ultima.medidas.panturrilha_direita, anterior: penultima.medidas.panturrilha_direita, unit: 'cm', positiveIsGood: true },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minhas Avaliações</h1>
        <p className="page-subtitle">{mockAvaliacoes.length} avaliações registradas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[
          { key: 'resumo', label: 'Resumo' },
          { key: 'graficos', label: 'Evolução' },
          { key: 'historico', label: 'Histórico' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          {/* Biométricos */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Última Avaliação</h3>
              <span className="text-xs text-gray-400">
                {new Date(ultima.data).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Peso', value: `${ultima.peso_kg}kg`, diff: diff(ultima.peso_kg, penultima.peso_kg), positiveIsGood: false },
                { label: 'IMC', value: ultima.imc, diff: diff(ultima.imc, penultima.imc), positiveIsGood: false },
                { label: '% Gordura', value: `${ultima.percentual_gordura}%`, diff: diff(ultima.percentual_gordura, penultima.percentual_gordura), positiveIsGood: false },
                { label: 'Altura', value: `${ultima.altura_cm}cm`, diff: null, positiveIsGood: true },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                  {item.diff !== null && item.diff !== 0 && (
                    <p className={`text-xs font-medium mt-1 flex items-center justify-center gap-0.5 ${
                      (item.diff < 0) === item.positiveIsGood
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`}>
                      {item.diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(item.diff)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* IMC label */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Classificação IMC</span>
              <span className={`text-sm font-bold ${imcInfo.color}`}>{imcInfo.label}</span>
            </div>

            {ultima.observacoes && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">Observações do Professor</p>
                <p className="text-sm text-primary-800 dark:text-primary-300">{ultima.observacoes}</p>
              </div>
            )}
          </div>

          {/* Medidas */}
          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais</h3>
            <div className="space-y-2">
              {medidas.map(m => {
                const delta = diff(m.atual, m.anterior)
                const isGood = delta === 0 ? null : (delta < 0) !== m.positiveIsGood ? false : true
                return (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${(m.atual / 120) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-16 text-right flex-shrink-0">
                      {m.atual}{m.unit}
                    </span>
                    {delta !== 0 && (
                      <span className={`text-xs w-12 flex-shrink-0 flex items-center gap-0.5 ${
                        isGood ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Fotos */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Fotos de Progresso</h3>
            <div className="grid grid-cols-4 gap-2">
              {['Frente', 'Costas', 'Lat. E.', 'Lat. D.'].map(t => (
                <div key={t} className="bg-gray-100 dark:bg-gray-700 rounded-xl aspect-square flex flex-col items-center justify-center gap-1">
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVOLUÇÃO */}
      {activeTab === 'graficos' && (
        <div className="space-y-4">
          <div className="card-base p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Peso e % Gordura</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="peso" tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                <YAxis yAxisId="gordura" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Line yAxisId="peso" type="monotone" dataKey="peso" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5 }} name="Peso (kg)" />
                <Line yAxisId="gordura" type="monotone" dataKey="gordura" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5 }} strokeDasharray="5 5" name="Gordura (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Medidas (cm)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={medidasGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="cintura" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Cintura" />
                <Line type="monotone" dataKey="braco" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Braço" />
                <Line type="monotone" dataKey="coxa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Coxa" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Resumo da evolução */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Evolução Total</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Peso perdido', value: `${diff(mockAvaliacoes[mockAvaliacoes.length - 1].peso_kg, ultima.peso_kg)}kg`, color: 'text-green-500' },
                { label: 'Redução de gordura', value: `${diff(mockAvaliacoes[mockAvaliacoes.length - 1].percentual_gordura, ultima.percentual_gordura)}%`, color: 'text-green-500' },
                { label: 'Redução cintura', value: `${diff(mockAvaliacoes[mockAvaliacoes.length - 1].medidas.cintura, ultima.medidas.cintura)}cm`, color: 'text-green-500' },
                { label: 'Ganho de braço', value: `+${diff(ultima.medidas.braco_direito, mockAvaliacoes[mockAvaliacoes.length - 1].medidas.braco_direito)}cm`, color: 'text-blue-500' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-3">
          {mockAvaliacoes.map(av => {
            const isExpanded = expandedId === av.id
            return (
              <div key={av.id} className="card-base overflow-hidden">
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : av.id)}
                >
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {av.peso_kg}kg · IMC {av.imc} · {av.percentual_gordura}% gordura
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(av.medidas).map(([key, val]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val}cm</p>
                          <p className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                    {av.observacoes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        {av.observacoes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
