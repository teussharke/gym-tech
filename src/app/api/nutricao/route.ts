import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rateLimit'

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AlunoContexto {
  nome?: string
  objetivo?: string
  nivel?: string
  peso?: number
  altura?: number
  tem_lesoes?: boolean
  lesoes_descricao?: string
  doencas_preexistentes?: string
  medicamentos?: string
  horas_sono?: number
  nivel_estresse?: string
  consome_alcool?: boolean
  fumante?: boolean
  refeicoes_por_dia?: number
  intolerancia_alimentar?: string
  historico_dieta?: string
}

export async function POST(request: NextRequest) {
  const [auth, authErr] = await requireAuth(request)
  if (authErr) return authErr

  // Rate limit: 60 req/hora por usuário
  const rl = checkRateLimit(`nutricao:${auth.userId}`, 60, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Limite de requisições atingido. Tente novamente em ${Math.ceil(rl.resetIn / 60000)} minutos.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { messages, contexto }: { messages: Message[]; contexto: AlunoContexto } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada na Vercel. Vá em Settings → Environment Variables, adicione a chave e faça Redeploy.' },
        { status: 503 }
      )
    }

    // Monta o system prompt com contexto do aluno
    const perfilLinhas: string[] = []
    if (contexto?.nome)                    perfilLinhas.push(`- Nome: ${contexto.nome}`)
    if (contexto?.objetivo)                perfilLinhas.push(`- Objetivo fitness: ${contexto.objetivo}`)
    if (contexto?.nivel)                   perfilLinhas.push(`- Nível de atividade: ${contexto.nivel}`)
    if (contexto?.peso)                    perfilLinhas.push(`- Peso: ${contexto.peso}kg`)
    if (contexto?.altura)                  perfilLinhas.push(`- Altura: ${contexto.altura}cm`)
    if (contexto?.tem_lesoes)              perfilLinhas.push(`- Lesões: ${contexto.lesoes_descricao || 'Sim, sem detalhes'}`)
    if (contexto?.doencas_preexistentes)   perfilLinhas.push(`- Condições de saúde: ${contexto.doencas_preexistentes}`)
    if (contexto?.medicamentos)            perfilLinhas.push(`- Medicamentos: ${contexto.medicamentos}`)
    if (contexto?.horas_sono)              perfilLinhas.push(`- Sono: ${contexto.horas_sono}h/noite`)
    if (contexto?.nivel_estresse)          perfilLinhas.push(`- Nível de estresse: ${contexto.nivel_estresse}`)
    if (contexto?.consome_alcool)          perfilLinhas.push(`- Consome álcool: Sim`)
    if (contexto?.intolerancia_alimentar)  perfilLinhas.push(`- Intolerâncias: ${contexto.intolerancia_alimentar}`)
    if (contexto?.historico_dieta)         perfilLinhas.push(`- Histórico de dieta: ${contexto.historico_dieta}`)
    if (contexto?.refeicoes_por_dia)       perfilLinhas.push(`- Refeições por dia: ${contexto.refeicoes_por_dia}`)

    const perfil = perfilLinhas.length > 0
      ? `\n\nPERFIL DO ALUNO:\n${perfilLinhas.join('\n')}`
      : ''

    const systemPrompt = `Você é a NutriIA, nutricionista virtual especializada em nutrição esportiva e emagrecimento saudável.
Você atende alunos de academia e fornece orientações nutricionais personalizadas de forma prática e acessível.${perfil}

SUAS DIRETRIZES:
- Responda sempre em português brasileiro, de forma direta, empática e motivadora.
- Adapte todas as sugestões ao perfil e objetivo do aluno.
- Seja específica: mencione alimentos, quantidades e horários quando pertinente.
- Prefira refeições simples, acessíveis e com ingredientes comuns no Brasil.
- Para objetivos de ganho de massa: enfatize proteínas, calorias e timing de refeições.
- Para objetivos de emagrecimento: deficit calórico saudável, saciedade e qualidade nutricional.
- Sempre oriente a procurar um nutricionista humano para planos personalizados e acompanhamento.
- Use emojis com moderação para tornar a resposta mais amigável.
- Máximo 400 palavras por resposta, a menos que seja um plano alimentar completo.
- Nunca diagnostique doenças nem substitua consulta médica.

EXEMPLOS DE PERGUNTAS QUE VOCÊ RESPONDE:
- Sugestão de cardápio semanal
- O que comer antes e depois do treino
- Fontes de proteína baratas e acessíveis
- Como calcular proteína necessária
- Receitas fitness simples
- Suplementação básica (whey, creatina, etc.)
- Como perder gordura e ganhar músculo`

    // Chamar API da Anthropic
    let response: Response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
    } catch (fetchErr) {
      console.error('Fetch error (rede):', fetchErr)
      return NextResponse.json(
        { error: 'Não foi possível conectar à Anthropic. Verifique a conexão do servidor.' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const status = response.status
      console.error(`Anthropic API ${status}:`, JSON.stringify(err))
      // Mensagem amigável por código HTTP
      const msg =
        status === 401 ? 'ANTHROPIC_API_KEY inválida ou expirada. Gere uma nova chave em console.anthropic.com.' :
        status === 403 ? 'Sem permissão para usar este modelo. Verifique o plano da sua conta Anthropic.' :
        status === 429 ? 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.' :
        err.error?.message ?? `Erro ${status} na API da Anthropic.`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    return NextResponse.json({ message: text })

  } catch (err) {
    console.error('Nutrição API error:', err)
    return NextResponse.json(
      { error: `Erro interno: ${err instanceof Error ? err.message : 'desconhecido'}` },
      { status: 500 }
    )
  }
}
