import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = getAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = getAdminClient()

  try {
    // Registra a solicitação de exclusão antes de deletar
    await supabase.from('consent_records').insert({
      usuario_id: user.id,
      tipo: 'termos',
      versao: '1.0',
      consentido: false, // false = revogação / exclusão
    })

    // Anonimiza dados que precisam ser retidos por obrigação legal (financeiro)
    // antes de deletar o usuário
    await supabase
      .from('pagamentos')
      .update({ observacoes: '[CONTA EXCLUÍDA]' })
      .eq('aluno_id',
        supabase.from('alunos').select('id').eq('usuario_id', user.id)
      )

    // Deleta o usuário do Auth — o CASCADE cuida das tabelas relacionadas
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) throw error

    return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' })
  } catch (err) {
    console.error('[delete-account] erro:', err)
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 })
  }
}
