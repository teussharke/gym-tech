import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { requireAuth } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const [, authErr] = await requireAuth(request)
  if (authErr) return authErr

  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { aluno_id, academia_id } = body

    if (!aluno_id || !academia_id) {
      return NextResponse.json({ error: 'aluno_id e academia_id são obrigatórios' }, { status: 400 })
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingCheckin } = await supabase
      .from('presencas')
      .select('id')
      .eq('aluno_id', aluno_id)
      .gte('data_checkin', `${today}T00:00:00`)
      .lte('data_checkin', `${today}T23:59:59`)
      .maybeSingle()

    if (existingCheckin) {
      return NextResponse.json(
        { error: 'Check-in já realizado hoje', existing: existingCheckin },
        { status: 409 }
      )
    }

    // Check if aluno is active and plan is valid
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('id, status_pagamento, data_vencimento')
      .eq('id', aluno_id)
      .single()

    if (alunoError || !aluno) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    if (aluno.data_vencimento && new Date(aluno.data_vencimento) < new Date()) {
      return NextResponse.json({ error: 'Plano vencido. Regularize seu pagamento.' }, { status: 403 })
    }

    // Create check-in
    const { data: presenca, error } = await supabase
      .from('presencas')
      .insert({
        aluno_id,
        academia_id,
        data_checkin: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create notification
    const { data: alunoUsuario } = await supabase
      .from('alunos')
      .select('usuario_id')
      .eq('id', aluno_id)
      .single()

    if (alunoUsuario) {
      await supabase.from('notificacoes').insert({
        usuario_id: alunoUsuario.usuario_id,
        academia_id,
        tipo: 'checkin',
        titulo: 'Check-in realizado!',
        mensagem: `Check-in realizado com sucesso às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
      })
    }

    return NextResponse.json({ data: presenca }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const [, authErr] = await requireAuth(request)
  if (authErr) return authErr

  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const alunoId = searchParams.get('aluno_id')
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')

    let query = supabase
      .from('presencas')
      .select(`
        *,
        alunos (
          matricula,
          usuarios (nome, foto_url)
        )
      `)
      .order('data_checkin', { ascending: false })

    if (alunoId) query = query.eq('aluno_id', alunoId)
    
    if (mes && ano) {
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01T00:00:00`
      const endDate = new Date(Number(ano), Number(mes), 0).toISOString()
      query = query.gte('data_checkin', startDate).lte('data_checkin', endDate)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
