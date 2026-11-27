# NODUS — Convenções do Projeto

> Última atualização: 26/11/2026. Reune as convenções que ficavam no fim do `DEVELOPMENT_PLAN.md`.

## Senhas
- Senha padrão para novos cadastros: `nodus@123`
- Seed de teste usa `atleta123` para academy_athletes
- Coluna no banco: `password_hash` (bcrypt 10 rounds — NUNCA `password`)

## Datas e Timezone
- MySQL configurado com `default-time-zone = '-03:00'` (Brasília) no `my.ini`
- Datas salvas no banco em horário de Brasília — **não usar UTC** nas API routes
- MySQL retorna `date` como ISO string (`2000-01-01T00:00:00.000Z`)
- **Sempre** normalizar com `toDateInput(d)` antes de popular `<input type='date'>`:
  ```js
  const toDateInput = d => {
    if (!d) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }
  ```

## Nullify — Proteção de campos MySQL
- `nullify(v)`: converte `''`, `undefined`, `null` em `null` (campos texto/date)
- `nullifyNum(v)`: converte `''`, `undefined`, `null` em `null`; converte string numérica em Number (campos `int`/`float`)
- **Sempre** aplicar nos campos de formulário antes de enviar ao banco

## Padrão de Commits (Conventional Commits)

| Prefixo | Uso | Aparece no Changelog |
|---|---|---|
| `feat:` | Nova funcionalidade | Sim |
| `fix:` | Correção de bug | Sim |
| `docs:` | Documentação | Sim |
| `refactor:` | Refatoração sem mudar comportamento | Sim |
| `perf:` | Melhoria de performance | Sim |
| `test:` | Testes | Sim |
| `chore:` | Manutenção (configs, deps) | Oculto |
| `style:` | Estilo visual sem lógica | Oculto |

Changelog: `npx release-it`; antes, `npx release-it --dry-run`.

## Rotas por Role

| Role | Prefixo | Rota de atletas | Rota de coaches |
|---|---|---|---|
| `super_admin` | `/admin` | `/athletes` | `/coaches` |
| `tenant_admin` | `/academy` | `/athletes` | `/coaches` |
| `coach` | `/coach` | `/coach/athletes` | — |
| `academy_coach` | `/academy_coach` | `/academy_coach/athletes` | — |
| `receptionist` | `/recepcionist` | `/recepcionist/athletes` | — |
| `academy_athlete` | `/academy_athlete` | — | — |
| `coach_athlete` | `/coach_athlete` | — | — |
| `athlete` | `/athlete` | — | — |

## Padrões de Componente
- Page routes Next.js 15 com `params`: sempre `async function` + `await params`
- Client Components com `params`: usar `use(params)` do React
- Views de detalhe aceitam props diretas: `athleteId`/`coachId` + `backPath` + `canEdit`
- Tables aceitam `detailBasePath` para montar a rota do botão ver perfil dinamicamente
- **Inativar** = `PUT is_active=0` (soft); **Excluir** = `DELETE` (hard delete em cascata)
- Permissões: checar sempre `session.user.role` via `useSession()` — nunca hardcodar `true`
- Diálogos de confirmação: sempre usar `NodusConfirmDialog` ou `NodusDeleteDialog`

## Padrões de Dashboard
- Grid: sempre `<Grid size={{ xs: 12, md: 6 }}>` — API MUI v7
- Gráficos: sempre via `AppReactApexCharts` com `dynamic import` (SSR: false)
- StatCards: usar `<StatCard>` com `CustomAvatar` rounded + `<Chip variant='tonal'>` para trend
- Layout: `contentWidth: 'wide'` no themeConfig

## Status de Sessão
- O banco **sempre** armazena o status original (`scheduled`, `cancelled`)
- A API sobrescreve o status na resposta usando `computeStatus()` (Opção A, ativo agora)
- `cancelled` é imutável — só pode ser definido manualmente pelo coach
- Na Fase 16 (deploy), migrar para Opção B: cron atualizando o banco diretamente

## Arquitetura ANT+ (Fase 7)
- **Servidor ANT+**: processo Node.js separado em `ant-server/` na porta **3001**
- **Lib**: `ant-plus-next` com `GarminStick2` + `HeartRateScanner` em Continuous Scanning Mode
- **DeviceId**: `sensors.serial` armazena o ID numérico ANT+ real (ex.: `42873`) — valores como `ANT0001` são ignorados
- **Zeros no terminal**: gerados internamente pela lib `ant-plus-next` — ignorar
- **Timezone**: MySQL configurado em `-03:00`; `resolveAthleteByDeviceId` usa `NOW()` que agora bate com horário local
- **WebSocket path**: `ws://localhost:3001/ws/heartrate`
- **Throttle banco**: gravação a cada 5 s por atleta; em memória sempre ao vivo para o WS
- **Mensagens servidor para cliente**: `initial_data`, `heartrate`, `reset_all`, `pong`
- **Mensagens cliente para servidor**: `ping`, `request_data`, `reset_calories` (com ou sem `athleteId`), `session_ended`

## Telas de monitoramento (Fase 7)
- HTML estático em `public/monitor/`; um `route.js` serve o arquivo e injeta variáveis globais (`__MONITOR_TOKEN__`, `__SESSION_ID__`, `__ANT_PORT__`).
- Tela 2 é pública por token (`/monitor` está em `PUBLIC_ROUTES` do middleware). Tela 3 exige login e role de coach.
- Rota de Route Handler deve ser `route.js`, nunca `page.jsx` (evita o erro RSC de objeto não serializável).
- Ícones: Font Awesome em `/css/all.css`; cores e animações dos ícones seguem o modelo `heart_rate_monitor`.
- Cores por zona: Z1 verde claro, Z2 ciano, Z3 amarelo, Z4 laranja, Z5 vermelho; sem sinal, cinza.

---

*Fim das convenções. Fase 7 em `fase-07-monitoramento.md`; índice em `README.md`.*
