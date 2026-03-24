'use client'

import { useState } from 'react'
import { Bell, CheckCheck, Trash2, CreditCard, Dumbbell, Activity, CheckSquare, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type NotifType = 'pagamento' | 'treino' | 'avaliacao' | 'checkin' | 'info' | 'aviso'

interface Notificacao {
  id: string
  tipo: NotifType
  titulo: string
  mensagem: string
  lida: boolean
  created_at: string
  link?: string
}

const mockNotificacoes: Notificacao[] = [
  { id: '1', tipo: 'treino',    titulo: 'Novo treino disponível',        mensagem: 'Prof. Carlos adicionou o Treino B - Costas e Bíceps para você.',  lida: false, created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),  link: '/aluno/treino' },
  { id: '2', tipo: 'pagamento', titulo: 'Mensalidade vencendo',          mensagem: 'Sua mensalidade vence em 3 dias (28/01). Regularize para continuar.',lida: false, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),    link: '/aluno/treino' },
  { id: '3', tipo: 'avaliacao', titulo: 'Avaliação física agendada',     mensagem: 'Você tem uma avaliação física agendada para amanhã às 09:00.',      lida: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),  link: '/aluno/avaliacoes' },
  { id: '4', tipo: 'checkin',   titulo: 'Check-in realizado',            mensagem: 'Seu check-in foi registrado às 07:32. Bom treino!',                  lida: true,  created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: '5', tipo: 'info',      titulo: 'Bem-vindo ao GymFlow!',         mensagem: 'Seu cadastro foi realizado com sucesso. Explore o sistema!',          lida: true,  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '6', tipo: 'treino',    titulo: 'Meta de frequência atingida!',  mensagem: 'Parabéns! Você atingiu 20 check-ins esse mês. Continue assim! 🏆',   lida: true,  created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: '7', tipo: 'aviso',     titulo: 'Academia fechada amanhã',       mensagem: 'A academia estará fechada amanhã devido a feriado municipal.',        lida: true,  created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
]

const tipoConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  pagamento: { icon: CreditCard,  color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  treino:    { icon: Dumbbell,    color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  avaliacao: { icon: Activity,    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  checkin:   { icon: CheckSquare, color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-900/30' },
  info:      { icon: Info,        color: 'text-gray-600 dark:text-gray-400',    bg: 'bg-gray-100 dark:bg-gray-700' },
  aviso:     { icon: Bell,        color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-100 dark:bg-red-900/30' },
}

export default function NotificacoesPage() {
  const [notifs, setNotifs] = useState(mockNotificacoes)
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas')

  const naoLidas = notifs.filter(n => !n.lida).length

  const marcarTodasLidas = () => {
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
  }

  const marcarLida = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const excluir = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const filtradas = filtro === 'nao_lidas'
    ? notifs.filter(n => !n.lida)
    : notifs

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notificações</h1>
          <p className="page-subtitle">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia!'}
          </p>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Ler todas</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'todas',     label: `Todas (${notifs.length})` },
          { key: 'nao_lidas', label: `Não lidas (${naoLidas})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as typeof filtro)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtro === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length > 0 ? (
        <div className="space-y-2">
          {filtradas.map(notif => {
            const config = tipoConfig[notif.tipo]
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={`card-base p-4 flex gap-3 transition-all ${
                  !notif.lida ? 'border-l-4 border-l-primary-500' : ''
                }`}
              >
                {/* Ícone */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${
                        notif.lida ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {notif.titulo}
                        {!notif.lida && (
                          <span className="inline-block w-2 h-2 bg-primary-500 rounded-full ml-2 mb-0.5" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {notif.mensagem}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      {!notif.lida && (
                        <button
                          onClick={() => marcarLida(notif.id)}
                          className="btn-ghost p-1.5 text-primary-500"
                          title="Marcar como lida"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => excluir(notif.id)}
                        className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Link de ação */}
                  {notif.link && !notif.lida && (
                    <a
                      href={notif.link}
                      onClick={() => marcarLida(notif.id)}
                      className="inline-block mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
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
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma notificação</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {filtro === 'nao_lidas' ? 'Todas as notificações foram lidas!' : 'Você não tem notificações.'}
          </p>
        </div>
      )}
    </div>
  )
}
