'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Trash2, CreditCard, Dumbbell, Activity, CheckSquare, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Notificacao {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  created_at: string
}

const tipoConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pagamento: { icon: CreditCard, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  treino:    { icon: Dumbbell,   color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  avaliacao: { icon: Activity,   color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  checkin:   { icon: CheckSquare,color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  info:      { icon: Info,       color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  aviso:     { icon: Bell,       color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
}

export default function NotificacoesPage() {
  const { usuario } = useAuth()
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas')

  const fetchNotifs = useCallback(async () => {
    if (!usuario?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data ?? [])
    setLoading(false)
  }, [usuario?.id])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const marcarLida = async (id: string) => {
    await supabase.from('notificacoes').update({ lida: true, data_leitura: new Date().toISOString() }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const marcarTodasLidas = async () => {
    if (!usuario?.id) return
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', usuario.id).eq('lida', false)
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
    toast.success('Todas marcadas como lidas')
  }

  const excluir = async (id: string) => {
    await supabase.from('notificacoes').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const naoLidas = notifs.filter(n => !n.lida).length
  const filtradas = filtro === 'nao_lidas' ? notifs.filter(n => !n.lida) : notifs

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notificações</h1>
          <p className="page-subtitle">{naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia!'}</p>
        </div>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Marcar todas lidas</span>
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {[{ key: 'todas', label: `Todas (${notifs.length})` }, { key: 'nao_lidas', label: `Não lidas (${naoLidas})` }].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key as typeof filtro)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtro === f.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card-base p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtradas.length > 0 ? (
        <div className="space-y-2">
          {filtradas.map(notif => {
            const config = tipoConfig[notif.tipo] ?? tipoConfig.info
            const Icon = config.icon
            return (
              <div key={notif.id} className={`card-base p-4 flex gap-3 ${!notif.lida ? 'border-l-4 border-l-primary-500' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${notif.lida ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {notif.titulo}
                        {!notif.lida && <span className="inline-block w-2 h-2 bg-primary-500 rounded-full ml-2 mb-0.5" />}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.mensagem}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notif.lida && (
                        <button onClick={() => marcarLida(notif.id)} className="btn-ghost p-1.5 text-primary-500" title="Marcar como lida">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => excluir(notif.id)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {notif.link && !notif.lida && (
                    <a href={notif.link} onClick={() => marcarLida(notif.id)} className="inline-block mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                      Ver detalhes →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card-base p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          <p className="text-gray-400 text-sm mt-1">
            {filtro === 'nao_lidas' ? 'Todas as notificações foram lidas!' : 'Você não tem notificações.'}
          </p>
        </div>
      )}
    </div>
  )
}
