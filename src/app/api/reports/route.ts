import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const tipo = searchParams.get('tipo') // financeiro, presenca, alunos, retencao
    const academiaId = searchParams.get('academia_id')
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano') ?? new Date().getFullYear().toString()

    if (!academiaId) {
      return NextResponse.json({ error: 'academia_id é obrigatório' }, { status: 400 })
    }

    const currentDate = new Date()
    const startDate = mes
      ? `${ano}-${String(mes).padStart(2, '0')}-01`
      : `${ano}-01-01`
    const endDate = mes
      ? new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0]
      : `${ano}-12-31`

    switch (tipo) {
      case 'financeiro': {
        const { data: pagamentos } = await supabase
          .from('pagamentos')
          .select(`*, alunos(matricula, usuarios(nome)), planos(nome)`)
          .eq('academia_id', academiaId)
          .gte('data_vencimento', startDate)
          .lte('data_vencimento', endDate)
          .order('data_vencimento', { ascending: false })

        const summary = {
          total_faturado: pagamentos?.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor - (p.valor_desconto || 0)), 0) ?? 0,
          total_pendente: pagamentos?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0) ?? 0,
          total_vencido: pagamentos?.filter(p => p.status === 'vencido').reduce((sum, p) => sum + p.valor, 0) ?? 0,
          count_pago: pagamentos?.filter(p => p.status === 'pago').length ?? 0,
          count_pendente: pagamentos?.filter(p => p.status === 'pendente').length ?? 0,
          count_vencido: pagamentos?.filter(p => p.status === 'vencido').length ?? 0,
        }

        return NextResponse.json({ data: pagamentos, summary })
      }

      case 'presenca': {
        const { data: presencas } = await supabase
          .from('presencas')
          .select(`*, alunos(matricula, usuarios(nome, foto_url))`)
          .eq('academia_id', academiaId)
          .gte('data_checkin', `${startDate}T00:00:00`)
          .lte('data_checkin', `${endDate}T23:59:59`)
          .order('data_checkin', { ascending: false })

        // Aggregate by aluno
        const byAluno = presencas?.reduce((acc: Record<string, { nome: string; count: number; ultimo: string }>, p) => {
          const nome = (p.alunos as { usuarios: { nome: string } }).usuarios?.nome ?? 'Desconhecido'
          if (!acc[p.aluno_id]) {
            acc[p.aluno_id] = { nome, count: 0, ultimo: p.data_checkin }
          }
          acc[p.aluno_id].count++
          return acc
        }, {}) ?? {}

        const ranking = Object.entries(byAluno)
          .map(([id, d]) => ({ aluno_id: id, ...d }))
          .sort((a, b) => b.count - a.count)

        return NextResponse.json({
          data: presencas,
          ranking,
          total_checkins: presencas?.length ?? 0,
        })
      }

      case 'alunos': {
        const { data: alunos, count } = await supabase
          .from('alunos')
          .select(`*, usuarios(nome, email, status, created_at), planos(nome, valor)`, { count: 'exact' })
          .eq('academia_id', academiaId)

        const { data: novosAlunos } = await supabase
          .from('alunos')
          .select('id')
          .eq('academia_id', academiaId)
          .gte('data_matricula', startDate)
          .lte('data_matricula', endDate)

        const ativos = alunos?.filter(a => (a.usuarios as { status: string }).status === 'ativo').length ?? 0
        const inadimplentes = alunos?.filter(a => a.status_pagamento === 'vencido').length ?? 0

        return NextResponse.json({
          data: alunos,
          summary: {
            total: count ?? 0,
            ativos,
            inadimplentes,
            novos_periodo: novosAlunos?.length ?? 0,
            taxa_inadimplencia: count ? (inadimplentes / count * 100).toFixed(1) : 0,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
