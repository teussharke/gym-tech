'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock,
  Smartphone, Lock, History, Loader2,
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Pagamento {
  id: string
  valor: number
  valor_desconto: number
  forma_pagamento: string
  status: string
  data_vencimento: string
  data_pagamento: string | null
  plano: { nome: string } | null
}

const formaLabel: Record<string, string> = {
  pix: 'PIX', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  dinheiro: 'Dinheiro', boleto: 'Boleto', transferencia: 'Transferência',
}

function getStatusInfo(p: Pagamento) {
  if (p.status === 'pago') {
    return {
      label: 'Em dia', color: '#22c55e', bg: 'rgba(34,197,94,0.10)',
      icon: CheckCircle2,
      detail: p.data_pagamento
        ? `Pago em ${format(parseISO(p.data_pagamento), "dd 'de' MMMM", { locale: ptBR })}`
        : 'Pagamento confirmado',
    }
  }
  const dias = differenceInDays(parseISO(p.data_vencimento), new Date())
  if (dias < 0) return {
    label: `Vencida há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''}`,
    color: '#ef4444', bg: 'rgba(239,68,68,0.10)',
    icon: AlertTriangle,
    detail: `Venceu em ${format(parseISO(p.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}`,
  }
  if (dias === 0) return {
    label: 'Vence hoje!', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',
    icon: Clock, detail: 'Regularize hoje para não perder o acesso',
  }
  if (dias <= 7) return {
    label: `Vence em ${dias} dia${dias > 1 ? 's' : ''}`,
    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',
    icon: Clock,
    detail: `Vence em ${format(parseISO(p.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}`,
  }
  return {
    label: 'Em dia', color: '#22c55e', bg: 'rgba(34,197,94,0.10)',
    icon: CheckCircle2,
    detail: `Vence em ${format(parseISO(p.data_vencimento), "dd 'de' MMMM yyyy", { locale: ptBR })}`,
  }
}

export default function PagamentosAlunoPage() {
  const { usuario } = useAuth()
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!usuario?.id) return
      const { data: alunoRow } = await supabase
        .from('alunos').select('id').eq('usuario_id', usuario.id).maybeSingle()
      if (!alunoRow) { setLoading(false); return }

      const { data } = await supabase
        .from('pagamentos')
        .select('id, valor, valor_desconto, forma_pagamento, status, data_vencimento, data_pagamento, plano:planos (nome)')
        .eq('aluno_id', alunoRow.id)
        .order('data_vencimento', { ascending: false })
        .limit(20)

      setPagamentos((data as unknown as Pagamento[]) ?? [])
      setLoading(false)
    }
    load()
  }, [usuario?.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--neon)' }} />
    </div>
  )

  const current = pagamentos.find(p => p.status !== 'cancelado')
  const historico = pagamentos.filter(p => p !== current)

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Minha Mensalidade</h1>
        <p className="page-subtitle">Acompanhe sua situação financeira</p>
      </div>

      {/* ── Status atual ── */}
      {current ? (() => {
        const info = getStatusInfo(current)
        const Icon = info.icon
        const planoNome = (current.plano as unknown as { nome: string } | null)?.nome ?? 'Mensalidade'
        return (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${info.color}40` }}>
            {/* Topo colorido */}
            <div className="p-5 flex items-center gap-4" style={{ background: info.bg }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${info.color}20` }}>
                <Icon className="w-7 h-7" style={{ color: info.color }} />
              </div>
              <div>
                <p className="font-black text-lg leading-tight" style={{ color: info.color }}>
                  {info.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{info.detail}</p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="p-5 grid grid-cols-2 gap-4" style={{ background: 'var(--bg-surface)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Plano</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{planoNome}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Valor</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  R$ {(current.valor - (current.valor_desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Forma</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {formaLabel[current.forma_pagamento] ?? current.forma_pagamento}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Vencimento</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {format(parseISO(current.data_vencimento), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            {current.status !== 'pago' && (
              <div className="px-5 pb-4 pt-0" style={{ background: 'var(--bg-surface)' }}>
                <div className="p-3 rounded-xl text-xs text-center" style={{ background: 'var(--bg-chip)', color: 'var(--text-3)' }}>
                  Para pagar sua mensalidade, dirija-se à recepção da academia.
                </div>
              </div>
            )}
          </div>
        )
      })() : (
        <div className="p-10 rounded-2xl text-center space-y-2"
          style={{ background: 'var(--bg-chip)', border: '1px solid var(--border)' }}>
          <CreditCard className="w-10 h-10 mx-auto opacity-30" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Nenhum pagamento registrado</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Entre em contato com a recepção.</p>
        </div>
      )}

      {/* ── Em breve ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--bg-chip)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black" style={{ background: 'var(--neon)' }}>
            EM BREVE
          </span>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Pagamento pelo app</p>
        </div>
        <div className="space-y-2">
          {[
            { icon: Smartphone, label: 'PIX integrado com QR Code automático' },
            { icon: CreditCard, label: 'Cartão de crédito com tokenização segura' },
            { icon: Lock,       label: 'Transações 100% criptografadas' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--neon)' }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Histórico ── */}
      {historico.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <History className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Histórico
            </p>
          </div>
          {historico.map(p => {
            const info = getStatusInfo(p)
            const Icon = info.icon
            return (
              <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: info.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>
                    {(p.plano as unknown as { nome: string } | null)?.nome ?? 'Mensalidade'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {format(parseISO(p.data_vencimento), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>
                    R$ {(p.valor - (p.valor_desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-semibold" style={{ color: info.color }}>{info.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
