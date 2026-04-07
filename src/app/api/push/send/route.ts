import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar se é admin ou professor
    const { data: usuarioRow } = await supabaseAdmin
      .from('usuarios').select('role, academia_id').eq('id', user.id).single()
    if (!usuarioRow || !['admin', 'professor'].includes(usuarioRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, body, url, usuario_id } = await req.json()

    // Busca subscriptions do(s) usuário(s) alvo
    let query = supabaseAdmin.from('push_subscriptions').select('*')
    if (usuario_id) {
      query = query.eq('usuario_id', usuario_id)
    } else {
      // Envia para todos da academia (apenas admin)
      if (usuarioRow.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { data: membros } = await supabaseAdmin
        .from('usuarios').select('id').eq('academia_id', usuarioRow.academia_id)
      const ids = (membros ?? []).map((m: { id: string }) => m.id)
      query = query.in('usuario_id', ids)
    }

    const { data: subs } = await query
    if (!subs || subs.length === 0) return NextResponse.json({ enviadas: 0 })

    const payload = JSON.stringify({ title, body, url: url ?? '/' })
    const resultados = await Promise.allSettled(
      subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        ).catch(async (err: { statusCode?: number }) => {
          // Subscription expirada — limpar do banco
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          }
          throw err
        })
      )
    )

    const enviadas = resultados.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ enviadas })
  } catch (err) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
