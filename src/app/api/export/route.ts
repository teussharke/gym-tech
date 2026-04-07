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

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = getAdminClient()

  try {
    // 1. Busca perfil e aluno_id primeiro
    const [
      { data: usuario },
      { data: alunoRow },
      { data: professor },
      { data: anamnese },
      { data: consentimentos },
    ] = await Promise.all([
      supabase.from('usuarios').select('id, nome, email, telefone, data_nascimento, role, status, foto_url, created_at, updated_at').eq('id', user.id).single(),
      supabase.from('alunos').select('id, matricula, data_matricula, data_vencimento, status_pagamento, objetivos, observacoes, created_at').eq('usuario_id', user.id).single(),
      supabase.from('professores').select('id, cref, especialidades, bio, created_at').eq('usuario_id', user.id).single(),
      supabase.from('anamneses').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }),
      supabase.from('consent_records').select('tipo, versao, consentido, created_at').eq('usuario_id', user.id),
    ])

    const alunoId = alunoRow?.id ?? null

    // 2. Busca dados que dependem do aluno_id
    const [
      { data: avaliacoes },
      { data: medidas },
      { data: fotos },
      { data: treinos },
      { data: historico },
      { data: cargas },
      { data: presencas },
      { data: pagamentos },
    ] = await Promise.all(
      alunoId
        ? [
          supabase.from('avaliacoes_fisicas').select('id, data_avaliacao, peso_kg, altura_cm, imc, percentual_gordura, massa_magra_kg, massa_gorda_kg, metabolismo_basal, agua_corporal, observacoes, created_at').eq('aluno_id', alunoId),
          supabase.from('medidas_corporais').select('*').eq('aluno_id', alunoId),
          supabase.from('fotos_progresso').select('id, url, tipo, data_foto, observacoes, created_at').eq('aluno_id', alunoId),
          supabase.from('treinos').select('id, nome, descricao, objetivo, dia_semana, ativo, created_at').eq('aluno_id', alunoId),
          supabase.from('historico_treinos').select('id, data_treino, hora_inicio, hora_fim, duracao_min, exercicios_realizados, observacoes, status, created_at').eq('aluno_id', alunoId).order('data_treino', { ascending: false }).limit(200),
          supabase.from('registro_cargas').select('id, data_registro, exercicio_id, series_realizadas, repeticoes_realizadas, carga_utilizada, observacoes, created_at').eq('aluno_id', alunoId).order('created_at', { ascending: false }).limit(500),
          supabase.from('presencas').select('id, data_checkin, data_checkout, duracao_min, tipo, created_at').eq('aluno_id', alunoId).order('data_checkin', { ascending: false }).limit(200),
          supabase.from('pagamentos').select('id, valor, forma_pagamento, status, data_vencimento, data_pagamento, referencia_mes, referencia_ano, created_at').eq('aluno_id', alunoId).order('created_at', { ascending: false }),
        ]
        : Array(8).fill(Promise.resolve({ data: [] }))
    )

    const exportData = {
      exportado_em: new Date().toISOString(),
      versao_politica: '1.0',
      titular: { id: user.id, ...usuario },
      perfil_aluno: alunoRow ?? null,
      perfil_professor: professor ?? null,
      saude: {
        anamnese: anamnese ?? [],
        avaliacoes_fisicas: avaliacoes ?? [],
        medidas_corporais: medidas ?? [],
        fotos_progresso: (fotos ?? []).map((f: Record<string, unknown>) => ({ ...f, nota: 'URL pode expirar — solicite nova URL ao administrador se necessário' })),
      },
      atividade: {
        treinos: treinos ?? [],
        historico_treinos: historico ?? [],
        registro_cargas: cargas ?? [],
        checkins: presencas ?? [],
      },
      financeiro: { pagamentos: pagamentos ?? [] },
      consentimentos: consentimentos ?? [],
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `meus-dados-i9fitness-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export] erro:', err)
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
  }
}
