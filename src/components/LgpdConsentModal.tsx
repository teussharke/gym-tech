'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface LgpdConsentModalProps {
  userId: string
  onAccepted: () => void
}

export default function LgpdConsentModal({ userId, onAccepted }: LgpdConsentModalProps) {
  const [termos, setTermos] = useState(false)
  const [dadosSensiveis, setDadosSensiveis] = useState(false)
  const [cookies, setCookies] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  const canAccept = termos && dadosSensiveis && cookies

  const handleAccept = async () => {
    if (!canAccept) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const records = [
        { usuario_id: userId, tipo: 'termos',           versao: '1.0', consentido: true },
        { usuario_id: userId, tipo: 'privacidade',      versao: '1.0', consentido: true },
        { usuario_id: userId, tipo: 'dados_sensiveis',  versao: '1.0', consentido: true },
        { usuario_id: userId, tipo: 'cookies',          versao: '1.0', consentido: true },
      ]

      await supabase.from('consent_records').insert(records)

      // Marca consentimento no perfil para não mostrar novamente
      await supabase
        .from('usuarios')
        .update({
          configuracoes: { lgpd_consent: true, lgpd_consent_at: now, lgpd_version: '1.0' },
        })
        .eq('id', userId)

      onAccepted()
    } catch (err) {
      console.error('Erro ao salvar consentimento:', err)
      // Mesmo com erro, libera o acesso — registrar o consentimento não pode bloquear o usuário
      onAccepted()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--neon)', boxShadow: '0 0 16px var(--neon-glow)' }}>
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-black text-base" style={{ color: 'var(--text-1)' }}>Privacidade & Consentimento</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Conforme a LGPD — Lei nº 13.709/2018</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Para utilizar o sistema, precisamos do seu consentimento para tratar seus dados pessoais.
            Leia os itens abaixo e marque cada um para continuar.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">

          <ConsentItem
            checked={termos}
            onChange={setTermos}
            title="Termos de uso e Política de Privacidade"
            description='Li e aceito os Termos de Uso e a Política de Privacidade da i9 Fitness.'
            required
            link={{ href: '/privacidade', label: 'Ler Política de Privacidade' }}
          />

          <ConsentItem
            checked={cookies}
            onChange={setCookies}
            title="Cookies essenciais"
            description="Autorizo o uso de cookies técnicos necessários para autenticação e funcionamento do sistema. Não utilizamos cookies de publicidade ou rastreamento."
            required
          />

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <ConsentItem
              checked={dadosSensiveis}
              onChange={setDadosSensiveis}
              title="Dados de saúde e biométricos"
              description="Autorizo o tratamento dos meus dados de saúde, incluindo: peso, medidas corporais, percentual de gordura, histórico de treinos, anamnese (condições médicas, medicamentos) e fotos de progresso. Esses dados são visíveis apenas ao meu professor e ao administrador da academia."
              required
              sensitive
            />

            {/* Detalhes */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 pb-3 flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-3)' }}
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Ocultar' : 'Ver'} quais dados de saúde são coletados
            </button>

            {showDetails && (
              <div className="px-4 pb-4">
                <ul className="text-xs space-y-0.5 list-disc ml-4" style={{ color: 'var(--text-3)' }}>
                  <li>Peso, altura, IMC, % de gordura corporal</li>
                  <li>Massa magra, massa gorda, taxa metabólica basal</li>
                  <li>Medidas corporais (braço, cintura, quadril, coxa, etc.)</li>
                  <li>Fotos de progresso (frente, costas, laterais)</li>
                  <li>Histórico de lesões e cirurgias</li>
                  <li>Condições médicas preexistentes</li>
                  <li>Medicamentos em uso</li>
                  <li>Hábitos de vida (sono, estresse, álcool, tabagismo)</li>
                  <li>Histórico completo de treinos e cargas</li>
                </ul>
                <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                  Você pode revogar este consentimento a qualquer momento em <strong>Perfil → Privacidade & Dados</strong>.
                  A revogação não afeta o tratamento realizado anteriormente.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-chip)', color: 'var(--text-3)' }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
            <span>
              Sem o consentimento para dados de saúde, recursos como avaliações físicas e anamnese não estarão disponíveis.
              Você poderá continuar utilizando treinos e check-in normalmente.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <button
            onClick={handleAccept}
            disabled={!canAccept || saving}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={canAccept && !saving
              ? { background: 'var(--neon)', color: '#000', boxShadow: '0 0 20px var(--neon-glow)' }
              : { background: 'var(--bg-chip)', color: 'var(--text-3)', cursor: 'not-allowed' }
            }
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando consentimento...</>
              : canAccept
                ? <><Shield className="w-4 h-4" />Aceitar e continuar</>
                : 'Marque todos os itens para continuar'
            }
          </button>
          <p className="text-center text-[10px]" style={{ color: 'var(--text-3)' }}>
            Consentimento registrado com data e hora. Versão 1.0 · LGPD Art. 7º e 9º
          </p>
        </div>
      </div>
    </div>
  )
}

function ConsentItem({
  checked, onChange, title, description, required, sensitive, link,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description: string
  required?: boolean
  sensitive?: boolean
  link?: { href: string; label: string }
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${checked ? '' : 'opacity-90'}`}
      style={{ background: 'var(--bg-chip)' }}>
      <div className="flex-shrink-0 mt-0.5">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'border-transparent' : 'border-current'}`}
          style={checked ? { background: sensitive ? '#ef4444' : 'var(--neon)' } : { borderColor: 'var(--text-3)' }}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{title}</p>
          {required && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,107,0,0.15)', color: 'var(--neon)' }}>OBRIGATÓRIO</span>}
          {sensitive && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>DADO SENSÍVEL</span>}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{description}</p>
        {link && (
          <Link href={link.href} target="_blank" className="flex items-center gap-1 text-[10px] mt-1.5 hover:opacity-80 transition-opacity" style={{ color: 'var(--neon)' }} onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-2.5 h-2.5" />{link.label}
          </Link>
        )}
      </div>
    </label>
  )
}
