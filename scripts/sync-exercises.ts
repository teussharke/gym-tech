import { createClient } from '@supabase/supabase-js'
import { mockExercicios } from '../src/lib/mock/exercicios'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function sync() {
  console.log('🔄 Starting sync of exercises...')
  
  for (const ex of mockExercicios) {
    if (!ex.gif_url) continue

    console.log(`Updating: ${ex.nome}...`)
    
    // Attempt to upsert based on name
    const { data, error } = await supabase
      .from('exercicios')
      .upsert({ 
        nome: ex.nome,
        gif_url: ex.gif_url, 
        equipamento: ex.equipamento, 
        grupo_muscular: ex.grupo,
        nivel: ex.nivel
      }, { onConflict: 'nome' })
      .select()

    if (error) {
      console.error(`❌ Error updating ${ex.nome}:`, error.message)
    } else if (data && data.length > 0) {
      console.log(`✅ ${ex.nome} updated.`)
    } else {
      console.warn(`⚠️ ${ex.nome} not found in database.`)
    }
  }

  console.log('🏁 Sync finished!')
}

sync()
