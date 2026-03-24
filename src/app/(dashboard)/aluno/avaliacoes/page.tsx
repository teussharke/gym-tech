'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Camera } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface Avaliacao {
  id: string
  data_avaliacao: string
  peso_kg: number | null
  altura_cm: number | null
  imc: number | null
  percentual_gordura: number | null
  observacoes: string | null
  medidas: {
    cintura: number | null
    braco_direito: number | null
    coxa_direita: number | null
    quadril: number | null
    abdomen: number | null
  } | null
  fotos: { url: string; tipo: string }[]
}

function getIMCLabel(imc: number) {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Normal', color: 'text-green-500' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' }
  return { label: 'Obesidade', color: 'text-red-500' }
}

type Tab = 'resumo' | 'graficos' | 'historico'

export default function AvaliacoesAlunoPage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('resumo')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchAlunoId = useCallback(async () => {
    if (!usuario?.id) return
    const { data } = await supabase.from('alunos').select('id').eq('usuario_id', usuario.id).single()
    if (data) setAlunoId(data.id)
  }, [usuario?.id])

  const fetchAvaliacoes = useCallback(async () => {
    if (!alunoId) return
    setLoading(true)
    const { data } = await supabase
      .from('avaliacoes_fisicas')
      .select(`
        id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura, observacoes,
        medidas:medidas_corporais (cintura, braco_direito, coxa_direita, quadril, abdomen),
        fotos:fotos_progresso (url, tipo)
      `)
      .eq('aluno_id', alunoId)
      .order('data_avaliacao', { ascending: false })

    setAvaliacoes((data as unknown as Avaliacao[]) ?? [])
    setLoading(false)
  }, [alunoId])

  useEffect(() => { fetchAlunoId() }, [fetchAlunoId])
  useEffect(() => { if (alunoId) fetchAvaliacoes() }, [alunoId, fetchAvaliacoes])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (avaliacoes.length === 0) return (
    <div className="max-w-2xl mx-auto card-base p-12 text-center">
      <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhuma avaliação</h2>
      <p className="text-gray-500">Seu professor ainda não registrou uma avaliação física.</p>
    </div>
  )

  const ultima = avaliacoes[0]
  const penultima = avaliacoes[1]
  const imcInfo = ultima.imc ? getIMCLabel(ultima.imc) : null

  const graficoData = avaliacoes.slice().reverse().map(a => ({
    data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    peso: a.peso_kg,
    gordura: a.percentual_gordura,
    imc: a.imc,
  }))

  const medidasData = avaliacoes.slice().reverse().map(a => ({
    data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    cintura: a.medidas?.cintura,
    braco: a.medidas?.braco_direito,
    coxa: a.medidas?.coxa_direita,
  }))

  const diff = (a: number | null | undefined, b: number | null | undefined) =>
    a != null && b != null ? Number((a - b).toFixed(1)) : null

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minhas Avaliações</h1>
        <p className="page-subtitle">{avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''} registrada{avaliacoes.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[{ key: 'resumo', label: 'Resumo' }, { key: 'graficos', label: 'Evolução' }, { key: 'historico', label: 'Histórico' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RESUMO */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Última Avaliação</h3>
              <span className="text-xs text-gray-400">{new Date(ultima.data_avaliacao).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Peso', value: ultima.peso_kg ? `${ultima.peso_kg}kg` : '—', diff: diff(ultima.peso_kg, penultima?.peso_kg), bom: 'negativo' },
                { label: 'IMC', value: ultima.imc ?? '—', diff: diff(ultima.imc, penultima?.imc), bom: 'negativo' },
                { label: '% Gordura', value: ultima.percentual_gordura ? `${ultima.percentual_gordura}%` : '—', diff: diff(ultima.percentual_gordura, penultima?.percentual_gordura), bom: 'negativo' },
                { label: 'Altura', value: ultima.altura_cm ? `${ultima.altura_cm}cm` : '—', diff: null, bom: 'positivo' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{String(item.value)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                  {item.diff != null && item.diff !== 0 && (
                    <p className={`text-xs font-medium mt-1 flex items-center justify-center gap-0.5 ${
                      (item.diff < 0 && item.bom === 'negativo') || (item.diff > 0 && item.bom === 'positivo')
                        ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {item.diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(item.diff)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {imcInfo && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classificação IMC</span>
                <span className={`text-sm font-bold ${imcInfo.color}`}>{imcInfo.label}</span>
              </div>
            )}

            {ultima.observacoes && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">Observações do Professor</p>
                <p className="text-sm text-primary-800 dark:text-primary-300">{ultima.observacoes}</p>
              </div>
            )}
          </div>

          {/* Medidas */}
          {ultima.medidas && (
            <div className="card-base p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais</h3>
              {[
                { label: 'Cintura', atual: ultima.medidas.cintura, anterior: penultima?.medidas?.cintura },
                { label: 'Abdômen', atual: ultima.medidas.abdomen, anterior: penultima?.medidas?.abdomen },
                { label: 'Quadril', atual: ultima.medidas.quadril, anterior: penultima?.medidas?.quadril },
                { label: 'Braço D.', atual: ultima.medidas.braco_direito, anterior: penultima?.medidas?.braco_direito },
                { label: 'Coxa D.', atual: ultima.medidas.coxa_direita, anterior: penultima?.medidas?.coxa_direita },
              ].filter(m => m.atual != null).map(m => {
                const delta = diff(m.atual, m.anterior)
                return (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 progress-bar"><div className="progress-fill" style={{ width: `${((m.atual ?? 0) / 120) * 100}%` }} /></div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-14 text-right">{m.atual}cm</span>
                    {delta != null && delta !== 0 && (
                      <span className={`text-xs w-10 flex items-center gap-0.5 ${delta < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fotos */}
          {ultima.fotos && ultima.fotos.length > 0 && (
            <div className="card-base p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Fotos</h3>
              <div className="grid grid-cols-4 gap-2">
                {ultima.fotos.map((f, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl aspect-square overflow-hidden">
                    <img src={f.url} alt={f.tipo} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRÁFICOS */}
      {activeTab === 'graficos' && (
        <div className="space-y-4">
          {graficoData.length > 1 ? (
            <>
              <div className="card-base p-5">
                <h3 className="section-title">Peso e % Gordura</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={graficoData}>
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
              {medidasData.some(m => m.cintura || m.braco || m.coxa) && (
                <div className="card-base p-5">
                  <h3 className="section-title">Medidas (cm)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={medidasData}>
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
              )}
            </>
          ) : (
            <div className="card-base p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Você precisa de pelo menos 2 avaliações para ver os gráficos de evolução.</p>
            </div>
          )}
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-3">
          {avaliacoes.map((av, i) => {
            const isExpanded = expandedId === av.id
            return (
              <div key={av.id} className="card-base overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  onClick={() => setExpandedId(isExpanded ? null : av.id)}>
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                      {i === 0 && <span className="badge-success text-xs">Mais recente</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {av.peso_kg && `${av.peso_kg}kg`}
                      {av.imc && ` · IMC ${av.imc}`}
                      {av.percentual_gordura && ` · ${av.percentual_gordura}% gordura`}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExpanded && av.medidas && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(av.medidas).filter(([, v]) => v != null).map(([key, val]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{val}cm</p>
                          <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                        </div>
                      ))}
                    </div>
                    {av.observacoes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{av.observacoes}</p>
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
