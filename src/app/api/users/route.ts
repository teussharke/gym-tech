import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cria cliente admin com service role
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()

    const {
      email, password, nome, telefone, role,
      academia_id, data_nascimento, cpf,
      // professor
      cref, especialidades,
      // aluno
      professor_id, plano_id, data_vencimento, objetivos, observacoes,
    } = body

    if (!email || !password || !nome || !role || !academia_id) {
      return NextResponse.json(
        { error: 'email, password, nome, role e academia_id são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirma automaticamente
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Criar perfil na tabela usuarios
    const { error: usuarioError } = await supabase.from('usuarios').insert({
      id: userId,
      nome,
      email,
      telefone: telefone || null,
      role,
      status: 'ativo',
      academia_id,
      data_nascimento: data_nascimento || null,
      cpf: cpf || null,
    })

    if (usuarioError) {
      // Rollback: remove o usuário auth criado
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: usuarioError.message }, { status: 400 })
    }

    // 3. Criar registro específico por role
    if (role === 'professor') {
      const { error: profError } = await supabase.from('professores').insert({
        usuario_id: userId,
        academia_id,
        cref: cref || null,
        especialidades: especialidades?.length ? especialidades : null,
      })
      if (profError) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: profError.message }, { status: 400 })
      }
    }

    if (role === 'aluno') {
      const { error: alunoError } = await supabase.from('alunos').insert({
        usuario_id: userId,
        academia_id,
        professor_id: professor_id || null,
        plano_id: plano_id || null,
        data_vencimento: data_vencimento || null,
        status_pagamento: 'pendente',
        objetivos: objetivos || null,
        observacoes: observacoes || null,
      })
      if (alunoError) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: alunoError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ data: { id: userId, email, nome, role } }, { status: 201 })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const academiaId = searchParams.get('academia_id')

    let query = supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (role) query = query.eq('role', role)
    if (academiaId) query = query.eq('academia_id', academiaId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
