import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="p-2 rounded-xl transition-colors hover:opacity-80" style={{ background: 'var(--bg-chip)', color: 'var(--text-2)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--neon)' }}>
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-1)' }}>Política de Privacidade</h1>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>i9 Fitness · Versão 1.0 · Vigente desde Janeiro de 2025</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>

          {/* Intro */}
          <section className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p>
              A <strong style={{ color: 'var(--text-1)' }}>i9 Fitness</strong> está comprometida com a proteção dos seus dados pessoais
              em conformidade com a <strong style={{ color: 'var(--text-1)' }}>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
              Este documento descreve quais dados coletamos, como são usados, por quanto tempo são retidos e quais são seus direitos.
            </p>
          </section>

          <Section title="1. Quem somos">
            <p>
              O <strong style={{ color: 'var(--text-1)' }}>i9 Fitness</strong> é um sistema de gestão para academias. O controlador dos dados é a academia à qual você está vinculado.
              Para dúvidas sobre privacidade, entre em contato com o administrador da sua academia.
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <SubTitle>2.1 Dados de cadastro</SubTitle>
            <ul className="list-disc ml-5 space-y-1">
              <li>Nome completo, e-mail, telefone</li>
              <li>Data de nascimento e CPF (para identificação)</li>
              <li>Foto de perfil (opcional)</li>
              <li>Endereço (opcional)</li>
            </ul>

            <SubTitle>2.2 Dados de saúde (dados sensíveis)</SubTitle>
            <p className="mb-2">Coletados apenas com seu <strong style={{ color: 'var(--neon)' }}>consentimento explícito</strong>:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Peso, altura, IMC, percentual de gordura</li>
              <li>Massa magra, massa gorda, taxa metabólica basal</li>
              <li>Medidas corporais (braços, cintura, quadril, etc.)</li>
              <li>Fotos de progresso corporal</li>
              <li>Histórico de lesões, condições médicas, medicamentos em uso</li>
              <li>Hábitos de vida (sono, estresse, álcool, tabagismo)</li>
            </ul>

            <SubTitle>2.3 Dados de uso</SubTitle>
            <ul className="list-disc ml-5 space-y-1">
              <li>Histórico de treinos e cargas</li>
              <li>Registros de check-in (data e hora)</li>
              <li>Feedback pós-treino</li>
              <li>Último acesso ao sistema</li>
            </ul>

            <SubTitle>2.4 Dados técnicos</SubTitle>
            <ul className="list-disc ml-5 space-y-1">
              <li>Endereço IP e agente do navegador (logs de acesso)</li>
              <li>Tokens de sessão (gerenciados pelo Supabase Auth)</li>
            </ul>
          </Section>

          <Section title="3. Base legal para tratamento">
            <ul className="list-disc ml-5 space-y-2">
              <li><strong style={{ color: 'var(--text-1)' }}>Consentimento (Art. 7º, I)</strong>: dados de saúde, fotos e dados sensíveis</li>
              <li><strong style={{ color: 'var(--text-1)' }}>Execução de contrato (Art. 7º, V)</strong>: dados necessários para prestação do serviço (treinos, pagamentos)</li>
              <li><strong style={{ color: 'var(--text-1)' }}>Legítimo interesse (Art. 7º, IX)</strong>: logs de segurança e funcionamento do sistema</li>
            </ul>
          </Section>

          <Section title="4. Como usamos seus dados">
            <ul className="list-disc ml-5 space-y-1">
              <li>Gerenciar sua conta e acesso ao sistema</li>
              <li>Acompanhar sua evolução física e treinos</li>
              <li>Permitir que professores personalizem sua programação</li>
              <li>Controlar frequência e pagamentos da academia</li>
              <li>Enviar notificações sobre treinos, avaliações e pagamentos</li>
              <li>Garantir a segurança e o funcionamento do sistema</li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento de dados">
            <p className="mb-3">Seus dados são compartilhados apenas com:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong style={{ color: 'var(--text-1)' }}>Supabase</strong> — banco de dados e armazenamento de arquivos (processador de dados conforme Art. 28 LGPD).
                Política: <span style={{ color: 'var(--neon)' }}>supabase.com/privacy</span>
              </li>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>Vercel</strong> — hospedagem da aplicação. Política: <span style={{ color: 'var(--neon)' }}>vercel.com/legal/privacy-policy</span>
              </li>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>Professores e administradores</strong> da sua academia — para fins de acompanhamento
              </li>
            </ul>
            <p className="mt-3">Não vendemos ou compartilhamos seus dados com terceiros para fins comerciais.</p>
          </Section>

          <Section title="6. Retenção de dados">
            <ul className="list-disc ml-5 space-y-1">
              <li>Dados de conta ativa: mantidos enquanto houver vínculo com a academia</li>
              <li>Após exclusão da conta: dados pessoais removidos em até 30 dias</li>
              <li>Logs de acesso: retidos por até 12 meses e então anonimizados</li>
              <li>Dados financeiros: retidos por 5 anos (obrigação legal fiscal)</li>
            </ul>
          </Section>

          <Section title="7. Seus direitos (LGPD Art. 18)">
            <p className="mb-3">Você tem os seguintes direitos sobre seus dados:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Acesso', desc: 'Confirmar a existência e obter cópia dos seus dados' },
                { title: 'Correção', desc: 'Corrigir dados incompletos ou desatualizados' },
                { title: 'Exclusão', desc: 'Solicitar a eliminação dos seus dados pessoais' },
                { title: 'Portabilidade', desc: 'Exportar seus dados em formato legível' },
                { title: 'Revogação', desc: 'Retirar o consentimento a qualquer momento' },
                { title: 'Informação', desc: 'Saber com quem seus dados são compartilhados' },
              ].map(r => (
                <div key={r.title} className="rounded-xl p-3" style={{ background: 'var(--bg-chip)' }}>
                  <p className="font-semibold text-xs" style={{ color: 'var(--neon)' }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{r.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">
              Para exercer seus direitos, acesse <strong style={{ color: 'var(--text-1)' }}>Perfil → Privacidade & Dados</strong> no aplicativo,
              ou solicite ao administrador da sua academia.
            </p>
          </Section>

          <Section title="8. Segurança">
            <ul className="list-disc ml-5 space-y-1">
              <li>Comunicação criptografada via HTTPS/TLS</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Políticas de segurança em nível de linha (RLS) no banco de dados</li>
              <li>Tokens de sessão gerenciados pelo Supabase Auth</li>
              <li>Sem armazenamento de senhas — gerenciado pelo Supabase Auth</li>
            </ul>
          </Section>

          <Section title="9. Cookies">
            <p>
              Utilizamos cookies técnicos essenciais para autenticação (gerenciados pelo Supabase Auth).
              Não utilizamos cookies de rastreamento ou publicidade. Você pode configurar seu navegador para
              recusar cookies, mas isso pode impedir o funcionamento do sistema.
            </p>
          </Section>

          <Section title="10. Alterações nesta política">
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos você por e-mail ou via notificação
              no aplicativo sobre mudanças significativas. A data de vigência no topo deste documento indica
              a versão atual.
            </p>
          </Section>

          <Section title="11. Contato">
            <p>
              Para dúvidas, solicitações ou exercício de direitos previstos na LGPD, entre em contato com
              o administrador da sua academia. Em caso de incidentes de segurança, notificaremos os titulares
              afetados e a ANPD no prazo legal de 72 horas.
            </p>
          </Section>

        </div>

        <div className="text-center text-xs pb-4" style={{ color: 'var(--text-3)' }}>
          i9 Fitness · Política de Privacidade v1.0 · Lei nº 13.709/2018 (LGPD)
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>{title}</h2>
      {children}
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold mt-3 mb-1" style={{ color: 'var(--text-1)' }}>{children}</p>
}
