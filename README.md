# 🏋️ GymFlow — Sistema de Gestão de Academia

Sistema completo para gestão de academia com Next.js, Supabase, Tailwind CSS e deploy na Vercel.

## 📋 Funcionalidades

### 👤 Administrador
- Dashboard com métricas em tempo real
- Gestão completa de alunos e professores
- Controle de planos e mensalidades
- Relatórios financeiros com gráficos
- Relatórios de presença e frequência
- Exportação de relatórios em PDF
- Logs do sistema

### 🎓 Professor
- Cadastro de alunos
- Criação de fichas de treino (A, B, C ou por dia da semana)
- Biblioteca de exercícios com GIF/vídeo
- Registro de avaliações físicas e medidas corporais
- Upload de fotos de evolução
- Visualização do histórico e evolução dos alunos

### 🏃 Aluno
- Visualização do treino do dia
- Exercícios com demonstração (GIF/vídeo)
- Temporizador de descanso integrado
- Registro de carga utilizada
- Check-in na academia
- Histórico de treinos
- Gráficos de evolução de carga
- Avaliações físicas e fotos de progresso
- Frequência mensal com heatmap

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Estilização | Tailwind CSS |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Deploy | Vercel |
| Tema | next-themes (Dark/Light) |
| PDF | jsPDF + AutoTable |

## 🚀 Configuração

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/seu-usuario/gymflow.git
cd gymflow
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite o `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No painel SQL Editor, execute o arquivo `supabase/schema.sql`
3. Configure os Storage Buckets:
   - `avatares` (público)
   - `exercicios` (público)
   - `fotos-progresso` (privado)
   - `comprovantes` (privado)

4. Configure o Email Template para recuperação de senha em:
   **Authentication > Email Templates > Reset Password**

### 4. Criar usuário administrador inicial

No Supabase SQL Editor:

```sql
-- Depois de criar o primeiro usuário via Auth do Supabase:
-- 1. Vá em Authentication > Users e crie o usuário admin
-- 2. Copie o UUID gerado
-- 3. Execute:

INSERT INTO public.academias (id, nome, email)
VALUES ('SUA-ACADEMIA-UUID', 'Sua Academia', 'admin@suaacademia.com');

-- Substitua 'USER-UUID' pelo UUID do usuário criado
INSERT INTO public.usuarios (id, nome, email, role, academia_id)
VALUES (
  'USER-UUID',
  'Administrador',
  'admin@suaacademia.com',
  'admin',
  'SUA-ACADEMIA-UUID'
);
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🌐 Deploy na Vercel

### Opção 1: Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Opção 2: Deploy via GitHub

1. Push para o GitHub
2. Conecte o repositório na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (sua URL da Vercel)

4. Deploy automático a cada push!

## 📁 Estrutura do Projeto

```
gymflow/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Rotas públicas
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/         # Rotas protegidas
│   │   │   ├── layout.tsx       # Layout com sidebar
│   │   │   ├── dashboard/       # Dashboard principal
│   │   │   ├── admin/           # Área do administrador
│   │   │   │   ├── alunos/
│   │   │   │   ├── professores/
│   │   │   │   ├── financeiro/
│   │   │   │   └── relatorios/
│   │   │   ├── professor/       # Área do professor
│   │   │   │   ├── alunos/
│   │   │   │   ├── exercicios/
│   │   │   │   ├── treinos/
│   │   │   │   └── avaliacoes/
│   │   │   ├── aluno/           # Área do aluno
│   │   │   │   ├── treino/
│   │   │   │   ├── historico/
│   │   │   │   ├── avaliacoes/
│   │   │   │   ├── checkin/
│   │   │   │   └── frequencia/
│   │   │   └── perfil/
│   │   ├── api/                 # API Routes
│   │   │   ├── users/
│   │   │   ├── exercises/
│   │   │   ├── workouts/
│   │   │   ├── payments/
│   │   │   ├── checkin/
│   │   │   ├── notifications/
│   │   │   └── reports/
│   │   └── layout.tsx           # Root layout
│   ├── components/
│   │   ├── ui/                  # Componentes base
│   │   ├── layout/              # Sidebar, Header
│   │   ├── forms/               # Formulários reutilizáveis
│   │   ├── charts/              # Componentes de gráficos
│   │   └── modals/              # Modais
│   ├── lib/
│   │   ├── supabase/            # Cliente Supabase
│   │   ├── hooks/               # Custom hooks (useAuth, etc.)
│   │   ├── utils/               # Funções utilitárias
│   │   └── types/               # TypeScript types
│   ├── styles/
│   │   └── globals.css          # Estilos globais + Tailwind
│   └── middleware.ts            # Auth middleware (RBAC)
├── supabase/
│   └── schema.sql               # Schema completo do banco
├── public/                      # Assets estáticos
├── .env.local.example           # Template de variáveis
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── package.json
```

## 🗄️ Banco de Dados

### Tabelas criadas:
- `usuarios` — Usuários do sistema
- `academias` — Academias (SaaS multi-tenant)
- `professores` — Dados dos professores
- `alunos` — Dados dos alunos
- `planos` — Planos de mensalidade
- `pagamentos` — Pagamentos e mensalidades
- `exercicios` — Biblioteca de exercícios
- `treinos` — Fichas de treino
- `treino_exercicios` — Exercícios por treino
- `historico_treinos` — Sessões realizadas
- `registro_cargas` — Evolução de carga
- `avaliacoes_fisicas` — Avaliações físicas
- `medidas_corporais` — Medidas corporais
- `fotos_progresso` — Fotos de evolução
- `presencas` — Check-ins
- `notificacoes` — Notificações
- `logs_sistema` — Auditoria

### Row Level Security (RLS):
Todas as tabelas possuem RLS configurado com políticas baseadas em:
- `role` do usuário (admin, professor, aluno)
- `academia_id` para isolamento multi-tenant

## 🎨 Design System

O sistema utiliza um design system consistente com:
- **Cores**: Verde primário (#22c55e) como cor da marca
- **Dark Mode**: Suporte completo via next-themes
- **Responsivo**: Mobile-first, breakpoints sm/md/lg/xl
- **Componentes**: Classes utilitárias customizadas no globals.css
- **Ícones**: Lucide React (família consistente)
- **Animações**: Framer Motion + CSS transitions

## 🔐 Segurança

- Autenticação via Supabase Auth (JWT)
- RLS (Row Level Security) no banco
- RBAC (Role-Based Access Control) no middleware
- Senhas hash automaticamente pelo Supabase
- Tokens de refresh automáticos
- Proteção de rotas por perfil

## 📊 API Routes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/users` | Gestão de usuários |
| GET | `/api/exercises` | Listar exercícios |
| GET/POST | `/api/workouts` | Gestão de treinos |
| GET/POST | `/api/checkin` | Check-in na academia |
| GET/POST | `/api/workouts/history` | Histórico de treinos |
| GET/POST | `/api/payments` | Pagamentos |
| GET | `/api/reports` | Relatórios |
| GET/POST | `/api/notifications` | Notificações |

## 🚧 Roadmap

- [ ] PWA com suporte offline
- [ ] Notificações push (FCM)
- [ ] Integração com pagamentos (Stripe/Mercado Pago)
- [ ] App mobile (React Native / Expo)
- [ ] QR Code para check-in
- [ ] Integração com wearables
- [ ] IA para sugestão de treinos
- [ ] Video conferência para treinos online

## 📄 Licença

MIT License © 2024 GymFlow
