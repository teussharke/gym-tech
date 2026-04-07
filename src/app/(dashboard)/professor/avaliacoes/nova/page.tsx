'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Save, Loader2, Camera, X, Upload, Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface AlunoSimples {
  id: string
  nome: string
  objetivo: string | null
}

interface FotoPreview {
  file: File
  url: string
  tipo: string
}

const TIPOS_FOTO = [
  { value: 'frente',           label: 'Frente'      },
  { value: 'costas',           label: 'Costas'      },
  { value: 'lateral_esquerda', label: 'Lateral E.'  },
  { value: 'lateral_direita',  label: 'Lateral D.'  },
  { value: 'outro',            label: 'Outro'       },
]

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { usuario } = useAuth()

  const [alunos, setAlunos] = useState<AlunoSimples[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fotoTipo, setFotoTipo] = useState('frente')
  const [fotos, setFotos] = useState<FotoPreview[]>([])
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    aluno_id: '',
    data: new Date().toISOString().split('T')[0],
    peso: '', altura: '', percentual_gordura: '',
    braco_d: '', braco_e: '', peito: '', cintura: '',
    abdomen: '', quadril: '', coxa_d: '', coxa_e: '',
    panturrilha_d: '', panturrilha_e: '', ombro: '',
    observacoes: '',
  })

  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const peso = Number(form.peso) || 0
  const altura = Number(form.altura) || 0
  const gordura = Number(form.percentual_gordura) || 0

  const imc = peso > 0 && altura > 0
    ? (peso / Math.pow(altura / 100, 2)).toFixed(1)
    : null

  const massaGorda = peso > 0 && gordura > 0
    ? (peso * gordura / 100).toFixed(1)
    : null

  const massaMagra = peso > 0 && gordura > 0
    ? (peso - peso * gordura / 100).toFixed(1)
    : null

  // Katch-McArdle: TMB = 370 + (21.6 × massa magra em kg)
  const metabolismoBasal = massaMagra
    ? Math.round(370 + 21.6 * Number(massaMagra))
    : null

  // Água corporal estimada (~73% da massa magra)
  const aguaCorporal = massaMagra
    ? (Number(massaMagra) * 0.73).toFixed(1)
    : null

  // Pré-seleciona aluno vindo da URL (?aluno=uuid)
  useEffect(() => {
    const alunoParam = searchParams.get('aluno')
    if (alunoParam) setForm(p => ({ ...p, aluno_id: alunoParam }))
  }, [searchParams])

  const fetchAlunos = useCallback(async () => {
    if (!usuario?.academia_id) { setLoadingAlunos(false); return }
    setLoadingAlunos(true)
    try {
      const { data } = await supabase
        .from('alunos')
        .select('id, objetivos, usuario:usuarios!inner (id, nome, status)')
        .eq('academia_id', usuario.academia_id)
        .eq('usuarios.status', 'ativo')

      type Row = { id: string; objetivos: string | null; usuario: { id: string; nome: string; status: string } }

      setAlunos(((data ?? []) as unknown as Row[])
        .filter(a => a.usuario?.status === 'ativo')
        .map(a => ({ id: a.id, nome: a.usuario?.nome ?? 'Sem nome', objetivo: a.objetivos ?? null }))
        .sort((a, b) => a.nome.localeCompare(b.nome)))
    } finally {
      setLoadingAlunos(false)
    }
  }, [usuario?.academia_id])

  useEffect(() => { fetchAlunos() }, [fetchAlunos])

  // Comprime imagem no frontend antes do upload (max 1200px, JPEG 70%)
  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      // Se já é pequena (<300KB), não comprimir
      if (file.size < 300_000) { resolve(file); return }

      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
              resolve(compressed)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  // Adiciona foto ao preview local (substitui se mesmo tipo)
  const handleFotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setFotos(prev => {
      const semEsseTipo = prev.filter(f => f.tipo !== fotoTipo)
      return [...semEsseTipo, { file: compressed, url: URL.createObjectURL(compressed), tipo: fotoTipo }]
    })
    e.target.value = ''
  }

  const removerFoto = (tipo: string) => {
    setFotos(prev => {
      const foto = prev.find(f => f.tipo === tipo)
      if (foto) URL.revokeObjectURL(foto.url)
      return prev.filter(f => f.tipo !== tipo)
    })
  }

  const salvar = async () => {
    if (!form.aluno_id) { toast.error('Selecione um aluno'); return }
    if (!usuario?.academia_id) return
    setSaving(true)

    try {
      const { data: prof } = await supabase
        .from('professores').select('id').eq('usuario_id', usuario.id).single()

      // 1. Criar avaliação física
      const { data: aval, error: avalError } = await supabase
        .from('avaliacoes_fisicas')
        .insert({
          aluno_id: form.aluno_id,
          academia_id: usuario.academia_id,
          professor_id: prof?.id ?? null,
          data_avaliacao: form.data,
          peso_kg: form.peso ? Number(form.peso) : null,
          altura_cm: form.altura ? Number(form.altura) : null,
          imc: imc ? Number(imc) : null,
          percentual_gordura: form.percentual_gordura ? Number(form.percentual_gordura) : null,
          massa_magra_kg: massaMagra ? Number(massaMagra) : null,
          massa_gorda_kg: massaGorda ? Number(massaGorda) : null,
          metabolismo_basal: metabolismoBasal ?? null,
          agua_corporal: aguaCorporal ? Number(aguaCorporal) : null,
          observacoes: form.observacoes || null,
        })
        .select().single()

      if (avalError) throw avalError

      // 2. Salvar medidas corporais se preenchidas
      const temMedidas = form.cintura || form.braco_d || form.coxa_d || form.abdomen ||
        form.quadril || form.braco_e || form.coxa_e || form.panturrilha_d ||
        form.panturrilha_e || form.peito || form.ombro

      if (temMedidas && aval) {
        await supabase.from('medidas_corporais').insert({
          aluno_id: form.aluno_id,
          avaliacao_id: aval.id,
          data_medicao: form.data,
          braco_direito:        form.braco_d       ? Number(form.braco_d)       : null,
          braco_esquerdo:       form.braco_e       ? Number(form.braco_e)       : null,
          peito:                form.peito         ? Number(form.peito)         : null,
          cintura:              form.cintura       ? Number(form.cintura)       : null,
          abdomen:              form.abdomen       ? Number(form.abdomen)       : null,
          quadril:              form.quadril       ? Number(form.quadril)       : null,
          coxa_direita:         form.coxa_d        ? Number(form.coxa_d)        : null,
          coxa_esquerda:        form.coxa_e        ? Number(form.coxa_e)        : null,
          panturrilha_direita:  form.panturrilha_d ? Number(form.panturrilha_d) : null,
          panturrilha_esquerda: form.panturrilha_e ? Number(form.panturrilha_e) : null,
          ombro:                form.ombro         ? Number(form.ombro)         : null,
        })
      }

      // 3. Upload das fotos de progresso
      if (fotos.length > 0 && aval) {
        for (const foto of fotos) {
          const ext = foto.file.name.split('.').pop() ?? 'jpg'
          const path = `${form.aluno_id}/${aval.id}/${foto.tipo}.${ext}`

          const { error: uploadErr } = await supabase.storage
            .from('fotos-progresso')
            .upload(path, foto.file, { upsert: true })

          if (uploadErr) {
            console.error('Erro upload foto:', uploadErr)
            continue
          }

          const { data: urlData } = supabase.storage
            .from('fotos-progresso')
            .getPublicUrl(path)

          await supabase.from('fotos_progresso').insert({
            aluno_id: form.aluno_id,
            avaliacao_id: aval.id,
            url: urlData.publicUrl,
            tipo: foto.tipo,
            data_foto: form.data,
          })
        }
      }

      toast.success('Avaliação salva com sucesso!')
      router.push('/professor/avaliacoes')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar avaliação')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Nova Avaliação</h1>
          <p className="page-subtitle">Registrar dados físicos do aluno</p>
        </div>
      </div>

      {/* Seletor de aluno */}
      <div className="card-base p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aluno *</h3>
        {loadingAlunos ? (
          <div className="input-base flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />Carregando alunos...
          </div>
        ) : alunos.length === 0 ? (
          <p className="text-sm text-amber-500">Nenhum aluno ativo encontrado.</p>
        ) : (
          <select value={form.aluno_id} onChange={e => up('aluno_id', e.target.value)} className="input-base">
            <option value="">Selecionar... ({alunos.length} alunos)</option>
            {alunos.map(a => (
              <option key={a.id} value={a.id}>
                {a.nome}{a.objetivo ? ` — ${a.objetivo}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Data */}
      <div className="card-base p-5">
        <label className="label-base">Data da avaliação *</label>
        <input type="date" value={form.data} onChange={e => up('data', e.target.value)} className="input-base" />
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
        {/* Cálculos automáticos */}
        {(imc || massaGorda) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cálculos automáticos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imc && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold" style={{ color: 'var(--neon)' }}>{imc}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>IMC</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {Number(imc) < 18.5 ? 'Abaixo' : Number(imc) < 25 ? 'Normal' : Number(imc) < 30 ? 'Sobrepeso' : 'Obesidade'}
                  </p>
                </div>
              )}
              {massaMagra && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold text-green-500">{massaMagra}<span className="text-sm">kg</span></p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Massa Magra</p>
                </div>
              )}
              {massaGorda && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold text-red-400">{massaGorda}<span className="text-sm">kg</span></p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Massa Gorda</p>
                </div>
              )}
              {metabolismoBasal && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold text-blue-400">{metabolismoBasal}<span className="text-sm">kcal</span></p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>TMB</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>Katch-McArdle</p>
                </div>
              )}
              {aguaCorporal && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold text-cyan-400">{aguaCorporal}<span className="text-sm">kg</span></p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Água Corporal</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>~73% massa magra</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medidas corporais */}
      <div className="card-base p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Medidas Corporais (cm)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Braço D.',        field: 'braco_d'       },
            { label: 'Braço E.',        field: 'braco_e'       },
            { label: 'Peito',           field: 'peito'         },
            { label: 'Cintura',         field: 'cintura'       },
            { label: 'Abdômen',         field: 'abdomen'       },
            { label: 'Quadril',         field: 'quadril'       },
            { label: 'Coxa D.',         field: 'coxa_d'        },
            { label: 'Coxa E.',         field: 'coxa_e'        },
            { label: 'Panturrilha D.',  field: 'panturrilha_d' },
            { label: 'Panturrilha E.',  field: 'panturrilha_e' },
            { label: 'Ombro',           field: 'ombro'         },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="label-base">{label}</label>
              <input
                type="number" step="0.1"
                value={form[field as keyof typeof form]}
                onChange={e => up(field, e.target.value)}
                className="input-base" placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fotos de progresso */}
      <div className="card-base p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-orange-500" />
          Fotos de Progresso
          <span className="text-xs text-gray-400 font-normal">(opcional)</span>
        </h3>

        {/* Seletor de tipo com indicador de foto já adicionada */}
        <div className="flex gap-2 flex-wrap">
          {TIPOS_FOTO.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFotoTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                fotoTipo === t.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t.label}
              {fotos.some(f => f.tipo === t.value) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
              )}
            </button>
          ))}
        </div>

        {/* Botão de captura */}
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoSelect} />
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-400 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-orange-500 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">
            {fotos.some(f => f.tipo === fotoTipo)
              ? `Substituir foto (${TIPOS_FOTO.find(t => t.value === fotoTipo)?.label})`
              : `Adicionar foto (${TIPOS_FOTO.find(t => t.value === fotoTipo)?.label})`}
          </span>
        </button>

        {/* Grid de preview */}
        {fotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {fotos.map(foto => (
              <div key={foto.tipo} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removerFoto(foto.tipo)}
                    className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 text-white text-[10px] bg-black/60 px-1.5 py-0.5 rounded capitalize">
                  {TIPOS_FOTO.find(t => t.value === foto.tipo)?.label ?? foto.tipo}
                </span>
              </div>
            ))}
          </div>
        )}

        {fotos.length > 0 && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''} pronta{fotos.length !== 1 ? 's' : ''} para envio
          </p>
        )}
      </div>

      {/* Observações */}
      <div className="card-base p-5">
        <label className="label-base">Observações</label>
        <textarea
          value={form.observacoes}
          onChange={e => up('observacoes', e.target.value)}
          className="input-base resize-none" rows={4}
          placeholder="Observações, metas, recomendações para o aluno..."
        />
      </div>

      {/* Ações */}
      <div className="flex gap-3 pb-4">
        <button onClick={() => router.back()} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={saving || !form.aluno_id}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
            : <><Save className="w-4 h-4" />Salvar Avaliação</>
          }
        </button>
      </div>
    </div>
  )
}
