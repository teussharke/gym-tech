'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Camera, X, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

interface FotoPreview {
  file?: File
  url: string
  tipo: string
  existente?: boolean
}

const TIPOS_FOTO = [
  { value: 'frente',           label: 'Frente'     },
  { value: 'costas',           label: 'Costas'     },
  { value: 'lateral_esquerda', label: 'Lateral E.' },
  { value: 'lateral_direita',  label: 'Lateral D.' },
  { value: 'outro',            label: 'Outro'      },
]

export default function EditarAvaliacaoPage() {
  const router = useRouter()
  const params = useParams()
  const avaliacaoId = params.id as string
  const { usuario } = useAuth()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fotoTipo, setFotoTipo] = useState('frente')
  const [fotos, setFotos] = useState<FotoPreview[]>([])
  const [alunoId, setAlunoId] = useState('')
  const [alunoNome, setAlunoNome] = useState('')
  const [medidasId, setMedidasId] = useState<string | null>(null)

  const [form, setForm] = useState({
    data: '',
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

  const imc = peso > 0 && altura > 0 ? (peso / Math.pow(altura / 100, 2)).toFixed(1) : null
  const massaGorda = peso > 0 && gordura > 0 ? (peso * gordura / 100).toFixed(1) : null
  const massaMagra = peso > 0 && gordura > 0 ? (peso - peso * gordura / 100).toFixed(1) : null
  const metabolismoBasal = massaMagra ? Math.round(370 + 21.6 * Number(massaMagra)) : null
  const aguaCorporal = massaMagra ? (Number(massaMagra) * 0.73).toFixed(1) : null

  const fetchAvaliacao = useCallback(async () => {
    if (!avaliacaoId) return
    setLoading(true)
    try {
      const [{ data: aval }, { data: fotosDb }] = await Promise.all([
        supabase.from('avaliacoes_fisicas').select(`
          *, aluno:alunos (id, usuario:usuarios (nome)),
          medidas:medidas_corporais (
            id, braco_direito, braco_esquerdo, peito, cintura,
            abdomen, quadril, coxa_direita, coxa_esquerda,
            panturrilha_direita, panturrilha_esquerda, ombro
          )
        `).eq('id', avaliacaoId).single(),
        supabase.from('fotos_progresso').select('url, tipo').eq('avaliacao_id', avaliacaoId),
      ])

      if (!aval) { toast.error('Avaliação não encontrada'); router.back(); return }

      type AvalRow = typeof aval & {
        aluno: { id: string; usuario: { nome: string } | null } | null
        medidas: { id: string; braco_direito: number | null; braco_esquerdo: number | null; peito: number | null; cintura: number | null; abdomen: number | null; quadril: number | null; coxa_direita: number | null; coxa_esquerda: number | null; panturrilha_direita: number | null; panturrilha_esquerda: number | null; ombro: number | null } | null
      }
      const a = aval as AvalRow

      setAlunoId(a.aluno?.id ?? '')
      setAlunoNome((a.aluno?.usuario as { nome: string } | null)?.nome ?? 'Aluno')

      setForm({
        data: a.data_avaliacao ?? '',
        peso: a.peso_kg?.toString() ?? '',
        altura: a.altura_cm?.toString() ?? '',
        percentual_gordura: a.percentual_gordura?.toString() ?? '',
        braco_d: a.medidas?.braco_direito?.toString() ?? '',
        braco_e: a.medidas?.braco_esquerdo?.toString() ?? '',
        peito: a.medidas?.peito?.toString() ?? '',
        cintura: a.medidas?.cintura?.toString() ?? '',
        abdomen: a.medidas?.abdomen?.toString() ?? '',
        quadril: a.medidas?.quadril?.toString() ?? '',
        coxa_d: a.medidas?.coxa_direita?.toString() ?? '',
        coxa_e: a.medidas?.coxa_esquerda?.toString() ?? '',
        panturrilha_d: a.medidas?.panturrilha_direita?.toString() ?? '',
        panturrilha_e: a.medidas?.panturrilha_esquerda?.toString() ?? '',
        ombro: a.medidas?.ombro?.toString() ?? '',
        observacoes: a.observacoes ?? '',
      })

      if (a.medidas?.id) setMedidasId(a.medidas.id)

      if (fotosDb) {
        setFotos(fotosDb.map(f => ({ url: f.url, tipo: f.tipo, existente: true })))
      }
    } catch (e) {
      toast.error('Erro ao carregar avaliação')
    } finally {
      setLoading(false)
    }
  }, [avaliacaoId, router])

  useEffect(() => { fetchAvaliacao() }, [fetchAvaliacao])

  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size < 300_000) { resolve(file); return }
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file)
        }, 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

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
      if (foto && !foto.existente) URL.revokeObjectURL(foto.url)
      return prev.filter(f => f.tipo !== tipo)
    })
  }

  const salvar = async () => {
    if (!alunoId || !usuario?.academia_id) return
    setSaving(true)
    try {
      // 1. UPDATE avaliação física
      const { error: avalError } = await supabase
        .from('avaliacoes_fisicas')
        .update({
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
        .eq('id', avaliacaoId)

      if (avalError) throw avalError

      // 2. UPSERT medidas corporais
      const temMedidas = form.cintura || form.braco_d || form.coxa_d || form.abdomen ||
        form.quadril || form.braco_e || form.coxa_e || form.panturrilha_d ||
        form.panturrilha_e || form.peito || form.ombro

      if (temMedidas) {
        const payload = {
          aluno_id: alunoId,
          avaliacao_id: avaliacaoId,
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
        }
        if (medidasId) {
          await supabase.from('medidas_corporais').update(payload).eq('id', medidasId)
        } else {
          await supabase.from('medidas_corporais').insert(payload)
        }
      }

      // 3. Upload de novas fotos
      const novasFotos = fotos.filter(f => f.file)
      for (const foto of novasFotos) {
        const ext = foto.file!.name.split('.').pop() ?? 'jpg'
        const path = `${alunoId}/${avaliacaoId}/${foto.tipo}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('fotos-progresso')
          .upload(path, foto.file!, { upsert: true })
        if (uploadErr) { console.error('upload foto:', uploadErr); continue }
        const { data: urlData } = supabase.storage.from('fotos-progresso').getPublicUrl(path)
        await supabase.from('fotos_progresso').upsert({
          aluno_id: alunoId, avaliacao_id: avaliacaoId,
          url: urlData.publicUrl, tipo: foto.tipo, data_foto: form.data,
        }, { onConflict: 'avaliacao_id,tipo' })
      }

      toast.success('Avaliação atualizada!')
      router.push('/professor/avaliacoes')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Editar Avaliação</h1>
          <p className="page-subtitle">{alunoNome}</p>
        </div>
      </div>

      {/* Data */}
      <div className="card-base p-5">
        <label className="label-base">Data da avaliação *</label>
        <input type="date" value={form.data} onChange={e => up('data', e.target.value)} className="input-base" />
      </div>

      {/* Biometria */}
      <div className="card-base p-5 space-y-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Dados Biométricos</h3>
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

        {(imc || massaGorda) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Cálculos automáticos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imc && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold" style={{ color: 'var(--neon)' }}>{imc}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>IMC</p>
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
                </div>
              )}
              {aguaCorporal && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-chip)' }}>
                  <p className="text-xl font-bold text-cyan-400">{aguaCorporal}<span className="text-sm">kg</span></p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Água Corporal</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medidas */}
      <div className="card-base p-5 space-y-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Medidas Corporais (cm)</h3>
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

      {/* Fotos */}
      <div className="card-base p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Camera className="w-4 h-4 text-orange-500" />
          Fotos de Progresso
          <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>(opcional)</span>
        </h3>
        <div className="flex gap-2 flex-wrap">
          {TIPOS_FOTO.map(t => (
            <button key={t.value} type="button" onClick={() => setFotoTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                fotoTipo === t.value ? 'bg-orange-500 text-white' : 'bg-[var(--bg-chip)] text-[var(--text-2)]'
              }`}
            >
              {t.label}
              {fotos.some(f => f.tipo === t.value) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
              )}
            </button>
          ))}
        </div>
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoSelect} />
        <button type="button" onClick={() => fotoInputRef.current?.click()}
          className="w-full border-2 border-dashed border-[var(--border)] hover:border-orange-400 rounded-xl p-4 flex items-center justify-center gap-2 text-[var(--text-3)] hover:text-orange-500 transition-all">
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">
            {fotos.some(f => f.tipo === fotoTipo)
              ? `Substituir foto (${TIPOS_FOTO.find(t => t.value === fotoTipo)?.label})`
              : `Adicionar foto (${TIPOS_FOTO.find(t => t.value === fotoTipo)?.label})`}
          </span>
        </button>
        {fotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {fotos.map(foto => (
              <div key={foto.tipo} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removerFoto(foto.tipo)}
                    className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 text-white text-[10px] bg-black/60 px-1.5 py-0.5 rounded capitalize">
                  {TIPOS_FOTO.find(t => t.value === foto.tipo)?.label ?? foto.tipo}
                </span>
                {foto.existente && (
                  <span className="absolute top-1 right-1 text-[10px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded">salva</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="card-base p-5">
        <label className="label-base">Observações</label>
        <textarea value={form.observacoes} onChange={e => up('observacoes', e.target.value)}
          className="input-base resize-none" rows={4}
          placeholder="Observações, metas, recomendações..." />
      </div>

      {/* Ações */}
      <div className="flex gap-3 pb-4">
        <button onClick={() => router.back()} className="btn-secondary flex-1">Cancelar</button>
        <button onClick={salvar} disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
            : <><Save className="w-4 h-4" />Salvar Alterações</>
          }
        </button>
      </div>
    </div>
  )
}
