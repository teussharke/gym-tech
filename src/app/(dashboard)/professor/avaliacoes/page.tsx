'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingDown, TrendingUp, Save, Calendar, Camera, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface Avaliacao {
  id: string
  data_avaliacao: string
  peso_kg: number | null
  altura_cm: number | null
  imc: number | null
  percentual_gordura: number | null
  observacoes: string | null
  aluno: { usuario: { nome: string } } | null
  medidas: { cintura: number | null; braco_direito: number | null; coxa_direita: number | null } | null
}

type Tab = 'nova' | 'historico'

export default function AvaliacoesPage() {
  const { usuario } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('nova')
  const [alunos, setAlunos] = useState<{ id: string; usuario: { nome: string } }[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    peso: '', altura: '', percentual_gordura: '',
    braco_d: '', braco_e: '', peito: '', cintura: '',
    abdomen: '', quadril: '', coxa_d: '', coxa_e: '',
    panturrilha_d: '', panturrilha_e: '', ombro: '',
    observacoes: '',
  })

  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const imc = form.peso && form.altura && Number(form.altura) > 0
    ? (Number(form.peso) / Math.pow(Number(form.altura) / 100, 2)).toFixed(1)
    : null

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) return
    const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()
    if (!prof) return
    const { data } = await supabase
      .from('alunos')
      .select('id, usuario:usuarios!alunos_usuario_id_fkey (nome)')
      .eq('academia_id', usuario.academia_id)
      .eq('professor_id', prof.id)
    setAlunos((data as unknown as { id: string; usuario: { nome: string } }[]) ?? [])
  }, [usuario?.academia_id, usuario?.id])

  const fetchAvaliacoes = useCallback(async () => {
    if (!alunoSelecionado) return
    setLoading(true)
    const { data } = await supabase
      .from('avaliacoes_fisicas')
      .select(`
        id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura, observacoes,
        aluno:alunos (usuario:usuarios!alunos_usuario_id_fkey (nome)),
        medidas:medidas_corporais (cintura, braco_direito, coxa_direita)
      `)
      .eq('aluno_id', alunoSelecionado)
      .order('data_avaliacao', { ascending: false })
    setAvaliacoes((data as unknown as Avaliacao[]) ?? [])
    setLoading(false)
  }, [alunoSelecionado])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])
  useEffect(() => { fetchAvaliacoes() }, [fetchAvaliacoes])

  const salvar = async () => {
    if (!alunoSelecionado) { toast.error('Selecione um aluno'); return }
    if (!usuario?.academia_id) return
    setSaving(true)

    try {
      const { data: prof } = await supabase.from('professores').select('id').eq('usuario_id', usuario.id).single()

      const { data: aval, error: avalError } = await supabase.from('avaliacoes_fisicas').insert({
        aluno_id: alunoSelecionado,
        academia_id: usuario.academia_id,
        professor_id: prof?.id ?? null,
        data_avaliacao: form.data,
        peso_kg: form.peso ? Number(form.peso) : null,
        altura_cm: form.altura ? Number(form.altura) : null,
        percentual_gordura: form.percentual_gordura ? Number(form.percentual_gordura) : null,
        observacoes: form.observacoes || null,
      }).select().single()

      if (avalError) throw avalError

      // Salvar medidas
      const temMedidas = form.cintura || form.braco_d || form.coxa_d
      if (temMedidas && aval) {
        await supabase.from('medidas_corporais').insert({
          aluno_id: alunoSelecionado,
          avaliacao_id: aval.id,
          data_medicao: form.data,
          braco_direito: form.braco_d ? Number(form.braco_d) : null,
          braco_esquerdo: form.braco_e ? Number(form.braco_e) : null,
          peito: form.peito ? Number(form.peito) : null,
          cintura: form.cintura ? Number(form.cintura) : null,
          abdomen: form.abdomen ? Number(form.abdomen) : null,
          quadril: form.quadril ? Number(form.quadril) : null,
          coxa_direita: form.coxa_d ? Number(form.coxa_d) : null,
          coxa_esquerda: form.coxa_e ? Number(form.coxa_e) : null,
          panturrilha_direita: form.panturrilha_d ? Number(form.panturrilha_d) : null,
          panturrilha_esquerda: form.panturrilha_e ? Number(form.panturrilha_e) : null,
          ombro: form.ombro ? Number(form.ombro) : null,
        })
      }

      toast.success('Avaliação salva!')
      setForm({ data: new Date().toISOString().split('T')[0], peso: '', altura: '', percentual_gordura: '', braco_d: '', braco_e: '', peito: '', cintura: '', abdomen: '', quadril: '', coxa_d: '', coxa_e: '', panturrilha_d: '', panturrilha_e: '', ombro: '', observacoes: '' })
      setActiveTab('historico')
      fetchAvaliacoes()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const graficoPeso = avaliacoes.slice().reverse().map(a => ({
    data: new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    peso: a.peso_kg,
    gordura: a.percentual_gordura,
  }))

  return (
    <div className="space-y-5 animate-fade-in">
      <div><h1 className="page-title">Avaliações Físicas</h1><p className="page-subtitle">Registre e acompanhe a evolução</p></div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[{ key: 'nova', label: '+ Nova Avaliação' }, { key: 'historico', label: 'Histórico & Evolução' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* NOVA AVALIAÇÃO */}
      {activeTab === 'nova' && (
        <div className="max-w-2xl space-y-4">
          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informações Gerais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Aluno *</label>
                <select value={alunoSelecionado} onChange={e => setAlunoSelecionado(e.target.value)} className="input-base">
                  <option value="">Selecionar aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{(a.usuario as unknown as { nome: string })?.nome}</option>)}
                </select>
              </div>
              <div><label className="label-base">Data *</label><input type="date" value={form.data} onChange={e => up('data', e.target.value)} className="input-base" /></div>
            </div>
          </div>

          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dados Biométricos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className="label-base">Peso (kg)</label><input type="number" step="0.1" value={form.peso} onChange={e => up('peso', e.target.value)} className="input-base" placeholder="84.5" /></div>
              <div><label className="label-base">Altura (cm)</label><input type="number" value={form.altura} onChange={e => up('altura', e.target.value)} className="input-base" placeholder="175" /></div>
              <div><label className="label-base">% Gordura</label><input type="number" step="0.1" value={form.percentual_gordura} onChange={e => up('percentual_gordura', e.target.value)} className="input-base" placeholder="22.1" /></div>
            </div>
            {imc && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-gray-700 dark:text-gray-300">IMC calculado</p></div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{imc}</p>
              </div>
            )}
          </div>

          <div className="card-base p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais (cm)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Braço D.', field: 'braco_d' }, { label: 'Braço E.', field: 'braco_e' },
                { label: 'Peito', field: 'peito' }, { label: 'Cintura', field: 'cintura' },
                { label: 'Abdômen', field: 'abdomen' }, { label: 'Quadril', field: 'quadril' },
                { label: 'Coxa D.', field: 'coxa_d' }, { label: 'Coxa E.', field: 'coxa_e' },
                { label: 'Panturrilha D.', field: 'panturrilha_d' }, { label: 'Panturrilha E.', field: 'panturrilha_e' },
                { label: 'Ombro', field: 'ombro' },
              ].map(({ label, field }) => (
                <div key={field}><label className="label-base">{label}</label><input type="number" step="0.1" value={form[field as keyof typeof form]} onChange={e => up(field, e.target.value)} className="input-base" placeholder="—" /></div>
              ))}
            </div>
          </div>

          <div className="card-base p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fotos de Progresso</h3>
            <div className="grid grid-cols-4 gap-2">
              {['Frente', 'Costas', 'Lat. E.', 'Lat. D.'].map(tipo => (
                <div key={tipo} className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary-400 transition-colors">
                  <Camera className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                  <p className="text-xs text-gray-400 text-center">{tipo}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base p-5">
            <label className="label-base">Observações</label>
            <textarea value={form.observacoes} onChange={e => up('observacoes', e.target.value)} className="input-base resize-none" rows={4} placeholder="Observações, metas, recomendações..." />
          </div>

          <button onClick={salvar} disabled={saving || !alunoSelecionado} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar Avaliação</>}
          </button>
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <div className="card-base p-4">
            <label className="label-base">Selecionar aluno</label>
            <select value={alunoSelecionado} onChange={e => setAlunoSelecionado(e.target.value)} className="input-base">
              <option value="">Selecionar...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{(a.usuario as unknown as { nome: string })?.nome}</option>)}
            </select>
          </div>

          {loading && <div className="card-base p-8 text-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}

          {!loading && alunoSelecionado && graficoPeso.length > 0 && (
            <div className="card-base p-5">
              <h3 className="section-title">Evolução de Peso e % Gordura</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={graficoPeso}>
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
          )}

          {!loading && alunoSelecionado && (
            <div className="card-base overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Histórico</h3>
                <button onClick={() => setActiveTab('nova')} className="btn-primary text-xs py-1.5 px-3">+ Nova</button>
              </div>
              {avaliacoes.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Nenhuma avaliação registrada.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {avaliacoes.map((av, i) => (
                    <div key={av.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            {i === 0 && <span className="badge-success text-xs">Mais recente</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {av.peso_kg && `Peso: ${av.peso_kg}kg`}
                            {av.imc && ` · IMC: ${av.imc}`}
                            {av.percentual_gordura && ` · Gordura: ${av.percentual_gordura}%`}
                          </p>
                          {av.observacoes && <p className="text-xs text-gray-500 italic mt-1">"{av.observacoes}"</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!alunoSelecionado && (
            <div className="card-base p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Selecione um aluno para ver o histórico</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
