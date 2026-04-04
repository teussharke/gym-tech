/**
 * sync-exercises.ts
 *
 * Sincroniza os exercícios do mock local com a tabela 'exercicios' do Supabase.
 * - Insere exercícios que ainda não existem no banco
 * - Atualiza gif_url e metadados dos que já existem
 *
 * Uso: npx tsx scripts/sync-exercises.ts
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

// Mapeia os nomes de exibição do mock para os valores do enum muscle_group no banco
const grupoToEnum: Record<string, string> = {
  'Peito':    'peito',
  'Costas':   'costas',
  'Pernas':   'pernas',
  'Ombro':    'ombro',
  'Bíceps':   'biceps',
  'Tríceps':  'triceps',
  'Abdômen':  'abdomen',
  'Cardio':   'cardio',
  'Glúteos':  'gluteos',
}

const nivelToEnum: Record<string, string> = {
  'Iniciante':     'iniciante',
  'Intermediário': 'intermediario',
  'Avançado':      'avancado',
}

async function sync() {
  console.log('🔄 Syncronizando exercícios com a tabela do Supabase...\n')

  // Busca todos os exercícios existentes de uma vez (evita N+1)
  const { data: existentes, error: fetchErr } = await supabase
    .from('exercicios')
    .select('id, nome')

  if (fetchErr) {
    console.error('❌ Erro ao buscar exercícios do banco:', fetchErr.message)
    process.exit(1)
  }

  const existentesMap = new Map<string, string>(
    (existentes ?? []).map(e => [e.nome, e.id])
  )

  console.log(`📊 Banco atual: ${existentesMap.size} exercícios`)
  console.log(`📋 Mock local: ${mockExercicios.length} exercícios\n`)

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const ex of mockExercicios) {
    const existingId = existentesMap.get(ex.nome)
    const grupoEnum = grupoToEnum[ex.grupo] ?? ex.grupo.toLowerCase()
    const nivelEnum = nivelToEnum[ex.nivel] ?? ex.nivel.toLowerCase()

    if (existingId) {
      // ── ATUALIZAR ──────────────────────────────────────────────────────────
      const { error } = await supabase
        .from('exercicios')
        .update({
          gif_url: ex.gif_url ?? null,
          equipamento: ex.equipamento,
          grupo_muscular: grupoEnum,
          nivel: nivelEnum,
        })
        .eq('id', existingId)

      if (error) {
        console.error(`❌ Update falhou — ${ex.nome}: ${error.message}`)
        failed++
      } else {
        console.log(`✏️   Atualizado: ${ex.nome}`)
        updated++
      }
    } else {
      // ── INSERIR ────────────────────────────────────────────────────────────
      const { error } = await supabase
        .from('exercicios')
        .insert({
          nome: ex.nome,
          gif_url: ex.gif_url ?? null,
          equipamento: ex.equipamento,
          grupo_muscular: grupoEnum,
          nivel: nivelEnum,
        })

      if (error) {
        console.error(`❌ Insert falhou — ${ex.nome}: ${error.message}`)
        failed++
      } else {
        console.log(`✅ Inserido:   ${ex.nome}`)
        inserted++
      }
    }
  }

  console.log('\n────────────────────────────────────────────')
  console.log('🏁 Sync finalizado!')
  console.log(`   ✅ Inseridos:  ${inserted}`)
  console.log(`   ✏️   Atualizados: ${updated}`)
  console.log(`   ❌ Falhas:     ${failed}`)
}

sync().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
