# NODUS — Sistema SaaS PWA de Monitoramento Cardíaco

> Monitoramento em tempo real, análise fisiológica avançada e gestão completa de academias, atletas e coaches.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router) |
| UI | MUI v7 + Tailwind CSS v4 |
| Estilo | Emotion + Vuexy Design System |
| Ícones | Iconify (Tabler Icons) |
| Estado | React Context + Hooks |
| DB | MySQL + Drizzle ORM |
| Auth | NextAuth.js |
| RT | WebSockets (ANT+ / Bluetooth HR) |
| PWA | next-pwa (Service Worker) |

## Perfis de Usuário

- **Admin** — Gerencia clientes, planos e pagamentos
- **Academia** — Gerencia atletas, coaches, aulas e horários
- **Coach** — Acompanha atletas, cria relatórios e planeja treinos
- **Atleta** — Visualiza seus dados, preenche daily logs, consulta histórico

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

## Estrutura do Projeto

```
src/
├── @core/           # utils, hooks, contexts e tema base
├── @layouts/        # VerticalLayout, HorizontalLayout, wrappers
├── @menu/           # sistema de menu expansível/colapsável
├── app/
│   ├── (auth)/      # páginas de login/registro (blank layout)
│   ├── (dashboard)/ # páginas protegidas com sidebar+navbar
│   │   ├── home/        # Dashboard principal
│   │   ├── academies/   # Gestão de academias
│   │   ├── athletes/    # Cadastro e gestão de atletas
│   │   ├── sessions/    # Sessões de treino
│   │   ├── daily-logs/  # Logs diários (HRV, WBS, sono)
│   │   ├── monitoring/  # Monitoramento em tempo real
│   │   ├── reports/     # Relatórios e analytics
│   │   └── settings/    # Configurações
│   ├── globals.css
│   └── layout.jsx
├── components/      # Componentes reutilizáveis NODUS
├── configs/         # Tema, rotas e configurações
├── data/
│   └── navigation/  # Configuração do menu lateral
├── views/           # Views das páginas
└── assets/          # Fontes, ícones, imagens
```
