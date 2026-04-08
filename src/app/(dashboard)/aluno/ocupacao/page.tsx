'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, RefreshCw, Wifi } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

interface Registro { hora: number; dia_semana: number; quantidade: number; created_at: string }

const DIAS      = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORAS     = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]
const CAP       = 50

type NivelOcupacao = 'tranquilo' | 'movimentado' | 'lotado'

function nivel(pct: number): NivelOcupacao {
  if (pct >= 0.8) return 'lotado'
  if (pct >= 0.5) return 'movimentado'
  return 'tranquilo'
}

const NIVEL_CONFIG: Record<NivelOcupacao, { label: string; color: string; bg: string; bar: string }> = {
  tranquilo:   { label: 'Tranquilo',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   bar: '#22c55e' },
  movimentado: { label: 'Movimentado', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  bar: '#f59e0b' },
  lotado:      { label: 'Lotado',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   bar: '#ef4444' },
}

export default function OcupacaoAlunoPage() {
  const { usuario } = useAuth()
  const [registros, setRegistros]     = useState<Registro[]>([])
  const [loading, setLoading]         = useState(true)
  const [diaVer, setDiaVer]           = useState(new Date().getDay())
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [aoVivo, setAoVivo]           = useState(false)

  const now       = new Date()
  const horaAtual = now.getHours()
  const diaAtual  = now.getDay()

  const fetchDados = useCallback(async () => {
    if (!usuario?.academia_id) { setLoading(false); return }
    setLoading(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - 14)

      const { data } = await supabase
        .from('ocupacao_academia')
        .select('hora, dia_semana, quantidade, created_at')
        .eq('academia_id', usuario.academia_id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      setRegistros((data ?? []) as Registro[])
      setUltimaAtualizacao(new Date())
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [usuario?.academia_id])

  // ── Carga inicial ──────────────────────────────────────────────
  useEffect(() => { fetchDados() }, [fetchDados])

  // ── Real-time: ouve novos registros da academia ────────────────
  useEffect(() => {
    if (!usuario?.academia_id) return

    const channel = supabase
      .channel(`ocupacao-aluno-${usuario.academia_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ocupacao_academia',
          filter: `academia_id=eq.${usuario.academia_id}`,
        },
        (payload) => {
          setRegistros(prev => [payload.new as Registro, ...prev])
          setUltimaAtualizacao(new Date())
        }
      )
      .subscribe((status) => {
        setAoVivo(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [usuario?.academia_id])

  // ── Computados ─────────────────────────────────────────────────
  const ultimoReg      = registros[0]
  const ocupacaoAgora  = ultimoReg?.quantidade ?? null
  const pctAgora       = ocupacaoAgora !== null ? ocupacaoAgora / CAP : null

  const mediaHora = (dia: number, hora: number) => {
    const rs = registros.filter(r => r.dia_semana === dia && r.hora === hora)
    if (!rs.length) return null
    return Math.round(rs.reduce((s, r) => s + r.quantidade, 0) / rs.length)
  }

  const mediasNoDia = HORAS
    .map(h => ({ h, med: mediaHora(diaVer, h) }))
    .filter(x => x.med !== null)

  const melhorHora = mediasNoDia.length > 0
    ? mediasNoDia.reduce((a, b) => (a.med ?? 999) < (b.med ?? 999) ? a : b)
    : null

  const maxMedia = Math.max(...mediasNoDia.map(x => x.med ?? 0), 1)

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Ocupação da Academia</h1>
          <p className="page-subtitle">Escolha o melhor horário para treinar</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador ao vivo */}
          {aoVivo && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Ao vivo
            </div>
          )}
          <button onClick={fetchDados} disabled={loading}
            className="btn-ghost p-2 rounded-xl">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')}
              style={{ color: 'var(--text-3)' }} />
          </button>
        </div>
      </div>

      {/* Status agora */}
      {pctAgora !== null ? (() => {
        const n = nivel(pctAgora)
        const cfg = NIVEL_CONFIG[n]
        return (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${cfg.color}40` }}>
            {/* Barra de progresso no topo */}
            <div className="h-1.5 w-full" style={{ background: 'var(--bg-chip)' }}>
              <div className="h-1.5 transition-all duration-700"
                style={{ width: `${Math.min(pctAgora * 100, 100)}%`, background: cfg.bar }} />
            </div>

            <div className="p-5 text-center space-y-1" style={{ background: cfg.bg }}>
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Agora · {String(ultimoReg.hora).padStart(2, '0')}h
              </p>
              <p className="text-6xl font-black leading-none" style={{ color: cfg.color }}>
                {ocupacaoAgora}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>pessoas na academia</p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mt-2"
                style={{ background: cfg.color + '20' }}>
                <Users className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                <span className="text-sm font-bold" style={{ color: cfg.color }}>
                  {cfg.label} · {Math.round(pctAgora * 100)}% da capacidade
                </span>
              </div>
            </div>

            {ultimaAtualizacao && (
              <div className="px-4 py-2 text-center" style={{ background: 'var(--bg-surface)', borderTop: `1px solid ${cfg.color}20` }}>
                <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  Atualizado às {format(ultimaAtualizacao, 'HH:mm', { locale: ptBR })}
                  {aoVivo && <span className="ml-1" style={{ color: '#22c55e' }}>· em tempo real</span>}
                </p>
              </div>
            )}
          </div>
        )
      })() : (
        <div className="p-10 rounded-2xl text-center space-y-3"
          style={{ background: 'var(--bg-chip)', border: '1px solid var(--border)' }}>
          <Users className="w-10 h-10 mx-auto opacity-25" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Nenhum dado disponível agora</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>A academia registrará a ocupação em breve.</p>
        </div>
      )}

      {/* Seletor de dia + gráfico por hora */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {/* Tabs de dia */}
        <div className="flex p-3 gap-1">
          {DIAS_SHORT.map((d, i) => (
            <button key={i} onClick={() => setDiaVer(i)}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={diaVer === i
                ? { background: 'var(--neon)', color: '#000' }
                : i === diaAtual
                  ? { background: 'var(--bg-chip)', color: 'var(--neon)', border: '1px solid var(--neon)' }
                  : { background: 'var(--bg-chip)', color: 'var(--text-3)' }
              }>
              {d}
            </button>
          ))}
        </div>

        {/* Melhor horário */}
        {melhorHora && (
          <div className="mx-3 mb-3 p-3 rounded-xl text-center"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-[11px] font-semibold text-green-500 mb-0.5">
              Melhor horário em {DIAS[diaVer]}
            </p>
            <p className="text-2xl font-black text-green-500">
              {String(melhorHora.h).padStart(2, '0')}h
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              média de {melhorHora.med} pessoa{melhorHora.med !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Barras por hora */}
        <div className="px-3 pb-3 space-y-1.5">
          {HORAS.map(h => {
            const med  = mediaHora(diaVer, h)
            const pct  = med !== null ? Math.min(med / CAP, 1) : 0
            const n    = nivel(pct)
            const cfg  = NIVEL_CONFIG[n]
            const isNow = h === horaAtual && diaVer === diaAtual
            return (
              <div key={h} className="flex items-center gap-3 py-0.5 px-2 rounded-lg"
                style={isNow
                  ? { background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }
                  : undefined
                }>
                <span className="text-[11px] font-mono w-7 text-right font-bold flex-shrink-0"
                  style={{ color: isNow ? 'var(--neon)' : 'var(--text-3)' }}>
                  {String(h).padStart(2, '0')}h
                </span>
                <div className="flex-1 rounded-full h-3.5 overflow-hidden"
                  style={{ background: 'var(--bg-chip)' }}>
                  {med !== null && (
                    <div className="h-3.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((med / maxMedia) * 100, 3)}%`, background: cfg.bar }} />
                  )}
                </div>
                <span className="text-[11px] font-semibold w-20 text-right flex-shrink-0"
                  style={{ color: med !== null ? cfg.color : 'var(--text-3)' }}>
                  {med !== null ? `${cfg.label}` : 'sem dados'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="px-4 pb-4 flex items-center justify-center gap-4">
          {(Object.entries(NIVEL_CONFIG) as [NivelOcupacao, typeof NIVEL_CONFIG.tranquilo][]).map(([, cfg]) => (
            <div key={cfg.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bar }} />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px]" style={{ color: 'var(--text-3)' }}>
        Baseado nos últimos 14 dias · capacidade: {CAP} pessoas
      </p>
    </div>
  )
}
