import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const alunoId = searchParams.get('aluno_id')
    const treinoId = searchParams.get('treino_id')
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 20)
    const offset = (page - 1) * limit

    let query = supabase
      .from('historico_treinos')
      .select(`
        *,
        treinos (nome, dia_semana)
      `, { count: 'exact' })
      .order('data_treino', { ascending: false })
      .range(offset, offset + limit - 1)

    if (alunoId) query = query.eq('aluno_id', alunoId)
    if (treinoId) query = query.eq('treino_id', treinoId)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: { total: count ?? 0, page, limit },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { aluno_id, treino_id, academia_id, exercicios_realizados, observacoes, duracao_min } = body

    const { data: historico, error } = await supabase
      .from('historico_treinos')
      .insert({
        aluno_id,
        treino_id,
        academia_id,
        data_treino: new Date().toISOString().split('T')[0],
        duracao_min,
        exercicios_realizados,
        observacoes,
        status: 'concluido',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Register loads for each exercise
    if (exercicios_realizados && historico) {
      const cargas = exercicios_realizados
        .filter((e: { carga: number }) => e.carga)
        .map((e: { exercicio_id: string; series: number; repeticoes: string; carga: number }) => ({
          aluno_id,
          exercicio_id: e.exercicio_id,
          historico_treino_id: historico.id,
          data_registro: new Date().toISOString().split('T')[0],
          series_realizadas: e.series,
          repeticoes_realizadas: e.repeticoes,
          carga_utilizada: e.carga,
        }))

      if (cargas.length > 0) {
        await supabase.from('registro_cargas').insert(cargas)
      }
    }

    return NextResponse.json({ data: historico }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
