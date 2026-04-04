'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface Anamnese {
  id: string
  status: 'pendente' | 'respondida'
  objetivo: string | null
  nivel_atividade: string | null
  tem_lesoes: boolean | null
  descricao_lesoes: string | null
  doencas_preexistentes: string | null
  medicamentos: string | null
  cirurgias: string | null
  horas_sono: number | null
  nivel_stress: number | null
  consome_alcool: boolean | null
  fumante: boolean | null
  restricoes_alimentares: string | null
  observacoes: string | null
  respondida_em: string | null
  created_at: string
}

const OBJETIVO_OPTIONS = [
  'Perda de peso', 'Ganho de massa muscular', 'Condicionamento físico',
  'Saúde e bem-estar', 'Reabilitação', 'Esporte de performance', 'Outro'
]
const NIVEL_OPTIONS = [
  { value: 'sedentario', label: 'Sedentário (quase nunca me exercito)' },
  { value: 'leve', label: 'Leve (1-2x por semana)' },
  { value: 'moderado', label: 'Moderado (3-4x por semana)' },
  { value: 'intenso', label: 'Intenso (5 ou mais vezes por semana)' },
]

type FormData = {
  objetivo: string
  nivel_atividade: string
  tem_lesoes: string  // 'sim' | 'nao'
  descricao_lesoes: string
  doencas_preexistentes: string
  medicamentos: string
  cirurgias: string
  horas_sono: string
  nivel_stress: string
  consome_alcool: string
  fumante: string
  restricoes_alimentares: string
  observacoes: string
}

const INITIAL_FORM: FormData = {
  objetivo: '', nivel_atividade: '', tem_lesoes: 'nao', descricao_lesoes: '',
  doencas_preexistentes: '', medicamentos: '', cirurgias: '', horas_sono: '',
  nivel_stress: '', consome_alcool: 'nao', fumante: 'nao', restricoes_alimentares: '', observacoes: '',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-gray-600 dark:text-gray-400">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SimNao({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {['nao', 'sim'].map(v => (
        <button key={v} onClick={() => onChange(v)}
          className={clsx(
            'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
            value === v
              ? v === 'sim'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
          )}>
          {v === 'sim' ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )
}

export default function AnamnesePage() {
  const { usuario } = useAuth()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0) // 0=saude, 1=habitos, 2=observacoes

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const fetchDados = useCallback(async () => {
    if (!usuario?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: alunoData } = await supabase
        .from('alunos').select('id').eq('usuario_id', usuario.id).single()
      if (!alunoData) { setLoading(false); return }
      setAlunoId(alunoData.id)

      const { data } = await supabase
        .from('anamneses')
        .select('*')
        .eq('aluno_id', alunoData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setAnamnese(data as Anamnese)
        // Pré-popular form se já respondida
        if (data.status === 'respondida') {
          setForm({
            objetivo: data.objetivo ?? '',
            nivel_atividade: data.nivel_atividade ?? '',
            tem_lesoes: data.tem_lesoes ? 'sim' : 'nao',
            descricao_lesoes: data.descricao_lesoes ?? '',
            doencas_preexistentes: data.doencas_preexistentes ?? '',
            medicamentos: data.medicamentos ?? '',
            cirurgias: data.cirurgias ?? '',
            horas_sono: data.horas_sono?.toString() ?? '',
            nivel_stress: data.nivel_stress?.toString() ?? '',
            consome_alcool: data.consome_alcool ? 'sim' : 'nao',
            fumante: data.fumante ? 'sim' : 'nao',
            restricoes_alimentares: data.restricoes_alimentares ?? '',
            observacoes: data.observacoes ?? '',
          })
        }
      }
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.id])

  useEffect(() => { fetchDados() }, [fetchDados])

  const salvar = async () => {
    if (!anamnese?.id) return
    if (!form.objetivo || !form.nivel_atividade) {
      toast.error('Preencha objetivo e nível de atividade')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('anamneses').update({
        objetivo: form.objetivo,
        nivel_atividade: form.nivel_atividade,
        tem_lesoes: form.tem_lesoes === 'sim',
        descricao_lesoes: form.tem_lesoes === 'sim' ? (form.descricao_lesoes || null) : null,
        doencas_preexistentes: form.doencas_preexistentes || null,
        medicamentos: form.medicamentos || null,
        cirurgias: form.cirurgias || null,
        horas_sono: form.horas_sono ? Number(form.horas_sono) : null,
        nivel_stress: form.nivel_stress ? Number(form.nivel_stress) : null,
        consome_alcool: form.consome_alcool === 'sim',
        fumante: form.fumante === 'sim',
        restricoes_alimentares: form.restricoes_alimentares || null,
        observacoes: form.observacoes || null,
        status: 'respondida',
        respondida_em: new Date().toISOString(),
      }).eq('id', anamnese.id)
      if (error) throw error
      toast.success('Anamnese enviada! Seu professor já pode visualizar. 🎉')
      fetchDados()
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center animate-float">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    </div>
  )

  if (!anamnese) return (
    <div className="max-w-lg mx-auto card-base p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4 animate-float">📋</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhuma anamnese solicitada</h2>
      <p className="text-gray-500 text-sm">Seu professor irá solicitar o questionário de saúde quando necessário.</p>
    </div>
  )

  // Já respondida
  if (anamnese.status === 'respondida') return (
    <div className="max-w-lg mx-auto space-y-6 page-enter">
      <div className="card-base p-6 text-center border-2 border-green-300 dark:border-green-700">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-1">Anamnese respondida!</h2>
        <p className="text-gray-500 text-sm">
          Respondida em {anamnese.respondida_em
            ? new Date(anamnese.respondida_em).toLocaleDateString('pt-BR')
            : '—'}
        </p>
      </div>

      <div className="card-base p-5 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">Suas respostas</h3>
        {[
          ['Objetivo', form.objetivo],
          ['Nível de atividade', NIVEL_OPTIONS.find(o => o.value === form.nivel_atividade)?.label ?? form.nivel_atividade],
          ['Possui lesões', form.tem_lesoes === 'sim' ? `Sim${form.descricao_lesoes ? ': ' + form.descricao_lesoes : ''}` : 'Não'],
          ['Doenças preexistentes', form.doencas_preexistentes],
          ['Medicamentos', form.medicamentos],
          ['Horas de sono', form.horas_sono ? `${form.horas_sono}h/noite` : ''],
          ['Nível de estresse', form.nivel_stress ? `${form.nivel_stress}/5` : ''],
          ['Consome álcool', form.consome_alcool === 'sim' ? 'Sim' : 'Não'],
          ['Fumante', form.fumante === 'sim' ? 'Sim' : 'Não'],
          ['Restrições alimentares', form.restricoes_alimentares],
          ['Observações', form.observacoes],
        ].filter(([, v]) => v).map(([l, v]) => (
          <div key={l} className="grid grid-cols-2 gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-xs text-gray-500">{l}</span>
            <span className="text-xs text-gray-900 dark:text-gray-100 font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // Formulário para preencher
  const steps = [
    {
      title: 'Saúde',
      content: (
        <Section title="Informações de saúde">
          <Field label="Qual é o seu objetivo principal?" required>
            <div className="grid grid-cols-2 gap-2">
              {OBJETIVO_OPTIONS.map(o => (
                <button key={o} onClick={() => set('objetivo', o)}
                  className={clsx(
                    'py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all',
                    form.objetivo === o
                      ? 'gradient-orange text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  )}>
                  {o}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Possui lesões ou dores?" required>
            <SimNao value={form.tem_lesoes} onChange={v => set('tem_lesoes', v)} />
          </Field>
          {form.tem_lesoes === 'sim' && (
            <Field label="Descreva as lesões/dores">
              <textarea rows={2} value={form.descricao_lesoes}
                onChange={e => set('descricao_lesoes', e.target.value)}
                placeholder="Ex: dor no joelho esquerdo, hérnia de disco L4-L5..."
                className="input-base w-full resize-none" />
            </Field>
          )}
          <Field label="Doenças preexistentes">
            <input value={form.doencas_preexistentes}
              onChange={e => set('doencas_preexistentes', e.target.value)}
              placeholder="Ex: hipertensão, diabetes, asma... (deixe em branco se não tiver)"
              className="input-base w-full" />
          </Field>
          <Field label="Medicamentos em uso">
            <input value={form.medicamentos}
              onChange={e => set('medicamentos', e.target.value)}
              placeholder="Ex: losartana, metformina... (deixe em branco se não usar)"
              className="input-base w-full" />
          </Field>
          <Field label="Cirurgias realizadas">
            <input value={form.cirurgias}
              onChange={e => set('cirurgias', e.target.value)}
              placeholder="Ex: menisco, apendicite... (deixe em branco se nenhuma)"
              className="input-base w-full" />
          </Field>
        </Section>
      )
    },
    {
      title: 'Hábitos',
      content: (
        <Section title="Hábitos e estilo de vida">
          <Field label="Nível atual de atividade física" required>
            <div className="space-y-2">
              {NIVEL_OPTIONS.map(o => (
                <button key={o.value} onClick={() => set('nivel_atividade', o.value)}
                  className={clsx(
                    'w-full py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all',
                    form.nivel_atividade === o.value
                      ? 'gradient-orange text-white shadow-sm shadow-orange-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Quantas horas dorme por noite?">
            <div className="flex gap-2 flex-wrap">
              {['4', '5', '6', '7', '8', '9', '10+'].map(h => (
                <button key={h} onClick={() => set('horas_sono', h)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                    form.horas_sono === h
                      ? 'gradient-orange text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}>
                  {h}h
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nível de estresse no dia a dia (1=baixo, 5=muito alto)">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set('nivel_stress', String(n))}
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl text-sm font-black transition-all',
                    form.nivel_stress === String(n)
                      ? 'gradient-orange text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Baixo</span><span>Muito alto</span>
            </div>
          </Field>
          <Field label="Consome bebidas alcoólicas?">
            <SimNao value={form.consome_alcool} onChange={v => set('consome_alcool', v)} />
          </Field>
          <Field label="Fumante?">
            <SimNao value={form.fumante} onChange={v => set('fumante', v)} />
          </Field>
        </Section>
      )
    },
    {
      title: 'Observações',
      content: (
        <Section title="Informações adicionais">
          <Field label="Restrições alimentares ou alergias">
            <textarea rows={2} value={form.restricoes_alimentares}
              onChange={e => set('restricoes_alimentares', e.target.value)}
              placeholder="Ex: lactose, glúten, amendoim... (deixe em branco se não tiver)"
              className="input-base w-full resize-none" />
          </Field>
          <Field label="Alguma observação adicional para o professor?">
            <textarea rows={3} value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              placeholder="Conte o que mais achar relevante sobre sua saúde, rotina ou expectativas..."
              className="input-base w-full resize-none" />
          </Field>
        </Section>
      )
    }
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Anamnese pendente!</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">Seu professor solicitou seu questionário de saúde.</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
              step === i
                ? 'gradient-orange text-white'
                : i < step
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            )}>
            {i < step ? '✓' : `${i + 1}.`} {s.title}
          </button>
        ))}
      </div>

      {/* Form step */}
      <div className="card-base p-5">
        {steps[step].content}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1 py-3 rounded-xl font-bold">
            Anterior
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="btn-primary flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={salvar} disabled={saving || !form.objetivo || !form.nivel_atividade}
            className="btn-primary flex-1 py-3 rounded-xl font-bold disabled:opacity-40">
            {saving ? 'Enviando...' : '✓ Enviar anamnese'}
          </button>
        )}
      </div>
      <p className="text-center text-xs text-gray-400">
        Suas informações são confidenciais e visíveis apenas ao seu professor
      </p>
    </div>
  )
}
