/**
 * migrate-images-to-storage.ts
 *
 * Migra os frames de exercício (0.jpg e 1.jpg) do raw.githubusercontent.com
 * para o Supabase Storage, criando o bucket automaticamente se não existir.
 *
 * Uso: npx tsx scripts/migrate-images-to-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import { mockExercicios } from '../src/lib/mock/exercicios'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const BUCKET = 'exercise-images'
const OLD_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

// ── Cria o bucket publicamente se não existir ──────────────────────────────
async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Erro ao listar buckets: ${error.message}`)

  const exists = buckets?.some(b => b.name === BUCKET)
  if (exists) {
    console.log(`ℹ️  Bucket '${BUCKET}' já existe — pulando criação\n`)
    return
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg'],
  })
  if (createErr) throw new Error(`Erro ao criar bucket: ${createErr.message}`)
  console.log(`✅ Bucket '${BUCKET}' criado com sucesso (público)\n`)
}

// ── Extrai o caminho do exercício a partir da gif_url ──────────────────────
function getExercisePath(gifUrl: string): string | null {
  const match = gifUrl.match(/exercises\/(.+?)\/\d+\.jpg$/)
  return match ? match[1] : null
}

// ── Baixa uma imagem e faz upload para o Storage ───────────────────────────
async function downloadAndUpload(exercisePath: string, frame: 0 | 1): Promise<boolean> {
  const downloadUrl = `${OLD_BASE}/${exercisePath}/${frame}.jpg`
  const storagePath = `${exercisePath}/${frame}.jpg`

  try {
    const response = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'gym-tech-migration-script/1.0' },
    })

    if (!response.ok) {
      if (response.status === 404) return true // Alguns exercícios só têm frame 0
      console.warn(`   ⚠️  Frame ${frame}: ${response.status} ${response.statusText}`)
      return false
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

    if (error) {
      console.warn(`   ⚠️  Upload frame ${frame} falhou: ${error.message}`)
      return false
    }

    return true
  } catch (err) {
    console.warn(`   ⚠️  Erro no frame ${frame}:`, err)
    return false
  }
}

// ── Script principal ───────────────────────────────────────────────────────
async function migrate() {
  console.log('🚀 Iniciando migração de imagens para Supabase Storage...\n')
  console.log(`Destino: ${supabaseUrl}/storage/v1/object/public/${BUCKET}\n`)

  await ensureBucket()

  let success = 0
  let failed = 0
  let skipped = 0
  const processed = new Set<string>()

  for (const ex of mockExercicios) {
    if (!ex.gif_url) {
      skipped++
      continue
    }

    const path = getExercisePath(ex.gif_url)
    if (!path) {
      skipped++
      continue
    }

    // Evitar processar o mesmo caminho duas vezes (ex: Rosca 21 compartilha frames com Rosca Direta)
    if (processed.has(path)) {
      continue
    }
    processed.add(path)

    process.stdout.write(`📦 [${String(success + failed + 1).padStart(2, '0')}] ${ex.nome.padEnd(40, ' ')} `)

    const [ok0, ok1] = await Promise.all([
      downloadAndUpload(path, 0),
      downloadAndUpload(path, 1),
    ])

    if (ok0) {
      success++
      console.log('✅')
    } else {
      failed++
      console.log('❌')
    }

    // Pequena pausa para não sobrecarregar o GitHub e o Supabase
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n────────────────────────────────────────────')
  console.log(`🏁 Migração finalizada!`)
  console.log(`   ✅ Sucesso:  ${success}`)
  console.log(`   ❌ Falha:    ${failed}`)
  console.log(`   ⏭️  Pulados:  ${skipped}`)

  const newBase = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`
  console.log('\n────────────────────────────────────────────')
  console.log('💡 Próximo passo: atualize a constante BASE em src/lib/mock/exercicios.ts para:')
  console.log(`\n   const BASE = '${newBase}'\n`)
}

migrate().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
