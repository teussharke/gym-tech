import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, dados } = body

    // Monta o prompt baseado no tipo de solicitação
    let prompt = ''

    if (tipo === 'sugerir_treino') {
      const { aluno } = dados
      prompt = `Você é um personal trainer especialista com 15 anos de experiência em academias.

Crie uma ficha de treino completa para o seguinte aluno:

Nome: ${aluno.nome}
Objetivo: ${aluno.objetivo || 'Não informado'}
Nível: ${aluno.nivel || 'Iniciante'}
Observações/Restrições: ${aluno.observacoes || 'Nenhuma'}
Divisão de treino: ${aluno.divisao || 'ABC'}

Retorne APENAS um JSON válido com esta estrutura exata, sem texto antes ou depois:
{
  "treinos": [
    {
      "nome": "Treino A - Peito e Tríceps",
      "dia": "A",
      "objetivo": "Hipertrofia de peito e tríceps",
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "series": 4,
          "repeticoes": "8-12",
          "carga_sugerida": 60,
          "descanso": 90,
          "observacoes": "Manter escápulas retraídas"
        }
      ]
    }
  ],
  "observacoes_gerais": "Dicas importantes para o aluno",
  "progressao": "Como deve progredir nas próximas semanas"
}`
    }

    if (tipo === 'analisar_evolucao') {
      const { aluno, avaliacoes, historico } = dados
      prompt = `Você é um personal trainer especialista. Analise a evolução deste aluno e forneça feedback detalhado.

Aluno: ${aluno.nome}
Objetivo: ${aluno.objetivo || 'Não informado'}

Histórico de avaliações físicas:
${JSON.stringify(avaliacoes, null, 2)}

Histórico de treinos (últimos ${historico.length}):
${JSON.stringify(historico, null, 2)}

Retorne APENAS um JSON válido com esta estrutura, sem texto antes ou depois:
{
  "resumo": "Análise geral em 2-3 frases",
  "pontos_positivos": ["ponto 1", "ponto 2"],
  "pontos_atencao": ["ponto 1", "ponto 2"],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "ajustes_treino": "Sugestões de ajuste no treino atual",
  "meta_proximos_30_dias": "O que focar nos próximos 30 dias",
  "nota_evolucao": 8
}`
    }

    if (tipo === 'variacoes_exercicio') {
      const { exercicio, nivel, equipamentos_disponiveis } = dados
      prompt = `Você é um personal trainer especialista. Sugira variações para o exercício abaixo.

Exercício original: ${exercicio}
Nível do aluno: ${nivel || 'Intermediário'}
Equipamentos disponíveis: ${equipamentos_disponiveis || 'Halteres, barras, máquinas, polias'}

Retorne APENAS um JSON válido com esta estrutura, sem texto antes ou depois:
{
  "variacoes": [
    {
      "nome": "Nome da variação",
      "dificuldade": "Mais fácil / Similar / Mais difícil",
      "equipamento": "Equipamento necessário",
      "beneficio": "Por que fazer esta variação",
      "dica": "Dica de execução"
    }
  ],
  "quando_usar_cada": "Orientação sobre quando usar cada variação"
}`
    }

    if (tipo === 'assistente_treino') {
      const { mensagem, contexto } = dados
      prompt = `Você é um assistente de personal trainer especialista em musculação e condicionamento físico.
Você está ajudando o professor a criar uma ficha de treino.

Contexto atual:
${contexto || 'Sem contexto específico'}

Pergunta/solicitação do professor:
${mensagem}

Responda de forma direta, prática e profissional em português brasileiro.
Se for sugerir exercícios, inclua séries, repetições e observações.
Máximo 300 palavras.`
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Tipo de solicitação inválido' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY não configurada na Vercel. Vá em Settings → Environment Variables, adicione a chave e faça Redeploy.' },
        { status: 503 }
      )
    }

    // Chamar API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Rápido e barato para uso frequente
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message ?? 'Erro na API' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.content[0]?.text ?? ''

    // Para tipos que retornam JSON, fazer parse
    if (['sugerir_treino', 'analisar_evolucao', 'variacoes_exercicio'].includes(tipo)) {
      try {
        const clean = content.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        return NextResponse.json({ data: parsed })
      } catch {
        return NextResponse.json({ data: content }) // retorna texto se não for JSON
      }
    }

    return NextResponse.json({ data: content })
  } catch (err: unknown) {
    console.error('Erro IA:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
  }
}
