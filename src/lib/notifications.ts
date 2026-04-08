import { supabase } from './supabase/client'

export interface NotifResult {
  criadas: number
  erros: number
}

/**
 * Verifica vencimentos de planos e cria notificações automáticas.
 * Deve ser chamada pelo admin. Não duplica notificações do mesmo dia.
 */
export async function gerarNotificacoesVencimento(
  academiaId: string,
  adminUsuarioId: string
): Promise<NotifResult> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split('T')[0]

  // Buscar alunos com data_vencimento definida
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, usuario_id, data_vencimento, status_pagamento')
    .eq('academia_id', academiaId)
    .not('data_vencimento', 'is', null)

  if (!alunos?.length) return { criadas: 0, erros: 0 }

  // Buscar nomes dos alunos
  const usuarioIds = alunos.map(a => a.usuario_id).filter(Boolean)
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome, status')
    .in('id', usuarioIds)
    .eq('status', 'ativo')

  const usuariosMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, u]))

  // Buscar notificações já criadas hoje (evitar duplicatas)
  const { data: notifHoje } = await supabase
    .from('notificacoes')
    .select('titulo, usuario_id')
    .eq('academia_id', academiaId)
    .gte('created_at', `${hojeStr}T00:00:00`)

  const notifSet = new Set((notifHoje ?? []).map(n => `${n.usuario_id}:${n.titulo}`))

  let criadas = 0
  let erros = 0

  for (const aluno of alunos) {
    const u = usuariosMap[aluno.usuario_id]
    if (!u) continue

    const venc = new Date(aluno.data_vencimento + 'T00:00:00')
    const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    let titulo = ''
    let mensagem = ''
    let tipo = 'info'

    if (diffDias < 0) {
      // Vencido
      const diasVencido = Math.abs(diffDias)
      titulo = `Pagamento vencido há ${diasVencido} dia${diasVencido > 1 ? 's' : ''}`
      mensagem = `Seu plano venceu em ${venc.toLocaleDateString('pt-BR')}. Regularize para continuar acessando a academia.`
      tipo = 'erro'
    } else if (diffDias <= 3) {
      // Vencendo em até 3 dias
      titulo = diffDias === 0
        ? 'Seu plano vence hoje!'
        : `Plano vence em ${diffDias} dia${diffDias > 1 ? 's' : ''}`
      mensagem = `Renove seu plano antes de ${venc.toLocaleDateString('pt-BR')} para não ter o acesso suspenso.`
      tipo = 'alerta'
    } else {
      continue // Sem notificação para vencimentos distantes
    }

    // Notificação para o aluno
    const keyAluno = `${aluno.usuario_id}:${titulo}`
    if (!notifSet.has(keyAluno)) {
      const { error } = await supabase.from('notificacoes').insert({
        usuario_id: aluno.usuario_id,
        academia_id: academiaId,
        titulo,
        mensagem,
        tipo,
        link: '/aluno/pagamentos',
      })
      if (error) erros++
      else { criadas++; notifSet.add(keyAluno) }
    }

    // Notificação para o admin (resumo)
    const tituloAdmin = `${u.nome}: ${titulo.toLowerCase()}`
    const keyAdmin = `${adminUsuarioId}:${tituloAdmin}`
    if (!notifSet.has(keyAdmin)) {
      const { error } = await supabase.from('notificacoes').insert({
        usuario_id: adminUsuarioId,
        academia_id: academiaId,
        titulo: tituloAdmin,
        mensagem: `Aluno ${u.nome} — ${mensagem}`,
        tipo,
        link: '/admin/alunos',
      })
      if (error) erros++
      else { criadas++; notifSet.add(keyAdmin) }
    }
  }

  return { criadas, erros }
}
