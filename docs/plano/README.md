# NODUS — Plano de Desenvolvimento (índice)

> Última atualização: 26/11/2026

## Como a documentação está organizada

| Arquivo | Conteúdo | Situação |
|---|---|---|
| `DEVELOPMENT_PLAN.md` (raiz) | Fases 1 a 6, Fase 7 até 03/04/2026 e fases futuras 8 a 16 | **Histórico.** Não editar. As seções 7.4 e 7.5 dele estão desatualizadas |
| `docs/plano/fase-07-monitoramento.md` | Fase 7 completa e atual (ANT+, Lobby, Tela 2, Tela 3) | **Vivo.** Atualizar a cada entrega |
| `docs/plano/convencoes.md` | Convenções do projeto, padrões, rotas por role, arquitetura ANT+ | **Vivo.** Atualizar quando uma regra mudar |
| `docs/plano/README.md` | Este índice, regras de atualização e issues abertas | **Vivo** |

## Regras de atualização

1. Um arquivo por fase em `docs/plano/fase-NN-nome.md`. Cada arquivo fica abaixo de 30 mil caracteres, para sempre poder ser lido e regravado por inteiro sem cortes.
2. Ao concluir uma entrega, regravar o arquivo da fase: marcar o item, anotar a data e o commit (SHA curto) e mover o que sobrar para Pendências.
3. Decisões e descobertas vão na tabela de decisões da fase, com a causa e a solução.
4. Trabalho adiado vira issue no GitHub e é listado na tabela de issues abaixo.
5. Quando uma fase nova começar, criar o arquivo dela e adicionar uma linha na tabela de fases.
6. Pendência: acrescentar no topo do `DEVELOPMENT_PLAN.md` uma linha apontando para este índice. Isso exige regravar o arquivo inteiro e ainda não foi feito.

## Fases

| Fase | Tema | Situação | Onde está |
|---|---|---|---|
| 1 a 6 | Fundação, navegação, atletas, coaches, dashboards, sessões | Concluídas | `DEVELOPMENT_PLAN.md` |
| 4.3 | LGPD: pending deletion e notificações | Pendente | `DEVELOPMENT_PLAN.md` |
| 5.1 / 5.2 | Upload de avatar; dashboard customizável | Pendentes | `DEVELOPMENT_PLAN.md` |
| 7 | Monitoramento ANT+ em tempo real | **Em andamento** | `fase-07-monitoramento.md` |
| 8 a 16 | Prescrição, financeiro, PWA, OAuth, gamificação, permissões, relatórios, páginas por role, deploy | Pendentes | `DEVELOPMENT_PLAN.md` |

## Issues abertas

| # | Assunto | Resumo |
|---|---|---|
| 3 | Sensores | ID do sensor no cadastro do atleta; inventário de sensores da academia para o dropdown do Lobby |
| 4 | ant-server | Reenvio de leituras antigas faz o card voltar a ficar verde nas Telas 2 e 3 |
