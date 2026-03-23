import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const role = searchParams.get('role')
    const academiaId = searchParams.get('academia_id')
    const status = searchParams.get('status')
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 20)
    const offset = (page - 1) * limit

    let query = supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role) query = query.eq('role', role)
    if (academiaId) query = query.eq('academia_id', academiaId)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    
    const { email, password, nome, telefone, role, academia_id, ...rest } = body

    if (!email || !password || !nome || !role) {
      return NextResponse.json(
        { error: 'email, password, nome e role são obrigatórios' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create user profile
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome,
        email,
        telefone,
        role,
        academia_id,
        ...rest,
      })
      .select()
      .single()

    if (usuarioError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: usuarioError.message }, { status: 400 })
    }

    // Create role-specific record
    if (role === 'aluno' && academia_id) {
      await supabase.from('alunos').insert({
        usuario_id: authData.user.id,
        academia_id,
        professor_id: body.professor_id,
        plano_id: body.plano_id,
      })
    } else if (role === 'professor' && academia_id) {
      await supabase.from('professores').insert({
        usuario_id: authData.user.id,
        academia_id,
        cref: body.cref,
        especialidades: body.especialidades,
      })
    }

    // Log the action
    await supabase.from('logs_sistema').insert({
      academia_id,
      acao: 'CREATE_USER',
      tabela_afetada: 'usuarios',
      registro_id: authData.user.id,
      dados_novos: { nome, email, role },
    })

    return NextResponse.json({ data: usuarioData }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
