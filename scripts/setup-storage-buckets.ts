/**
 * setup-storage-buckets.ts
 *
 * Cria os buckets necessários no Supabase Storage se ainda não existirem.
 * - exercise-images: imagens dos exercícios (público)
 * - fotos-progresso: fotos de progresso dos alunos (público com RLS no banco)
 *
 * Uso: npx tsx scripts/setup-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKETS = [
  {
    name: 'exercise-images',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    name: 'fotos-progresso',
    public: true,
    fileSizeLimit: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
  },
]

async function setup() {
  console.log('🪣 Configurando buckets do Supabase Storage...\n')

  const { data: existing } = await supabase.storage.listBuckets()
  const existingNames = new Set(existing?.map(b => b.name) ?? [])

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`ℹ️  Bucket '${bucket.name}' já existe — pulando`)
      continue
    }

    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    })

    if (error) {
      console.error(`❌ Falha ao criar '${bucket.name}': ${error.message}`)
    } else {
      console.log(`✅ Bucket '${bucket.name}' criado com sucesso (público: ${bucket.public})`)
    }
  }

  console.log('\n🏁 Setup finalizado!')
  console.log('\n💡 Não esqueça de configurar as RLS policies no painel do Supabase:')
  console.log('   fotos-progresso: INSERT apenas para alunos autenticados que possuem o aluno_id correspondente')
}

setup().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
