# FASE 7 — Monitoramento ANT+ em Tempo Real

> Última atualização: 26/11/2026 — Etapas 7.1 a 7.4 concluídas; 7.5 (Tela 3) com as etapas A e B entregues; falta a etapa C.

Pipeline: sensor ANT+ → `ant-server` (porta 3001) → WebSocket `/ws/heartrate` → Tela 2 (TV) e Tela 3 (treinador); gravação em `session_hr_series` a cada 5 s.

## Telas

| Tela | Rota | Acesso | Arquivo |
|---|---|---|---|
| 1 — Lobby | `/sessions/[id]/lobby` | staff | `src/views/sessions/lobby/LobbyView.jsx` |
| 2 — Monitor dos atletas (TV) | `/monitor/[token]` | público, por token | `public/monitor/index.html` + `stale.js` |
| 3 — Monitor do treinador | `/sessions/[id]/monitor` | `tenant_admin`, `coach`, `academy_coach` | `public/monitor/coach.html` |

## Etapas

### ✅ 7.1 — Servidor ANT+/WebSocket (26/03/2026)
- `ant-server/antService.js`: Continuous Scanning Mode, 42+ dispositivos.
- `ant-server/websocketServer.js`: resolve atleta e sessão por `DeviceId`, cache de 10 s, zonas de FC, calorias em memória, broadcast `heartrate`.
- `ant-server/db.js`: consultas MySQL diretas (`resolveAthleteByDeviceId`, `autoCheckin`, `insertHrSeries`, `updateSessionAthleteAggregates`, `getAllActiveSensors`).
- `ant-server/index.js`: HTTP + WebSocket; REST mínima `/health`, `/ant/*`.

### ✅ 7.2 — Persistência de FC (27/03/2026)
- Tabela `session_hr_series`; throttle de 5 s por atleta; `autoCheckin` ao detectar FC em sessão ativa.

### ✅ 7.3 — Lobby (Tela 1) (01 a 03/04/2026 e 11/2026)
- Check-in manual, walk-in (`POST /api/sessions/[id]/walkin`), link do monitor, iniciar sessão.
- **Vínculo de sensor por ID** (`433bae7`): campo numérico (1 a 65535), `PUT /api/sessions/[id]/assign-sensor` valida uso, cadastra o sensor se for novo e permite desvincular. O texto Sensor 42873 do chip é só visual; o valor gravado é `42873`.
- **Correção de resolução de sessão no ant-server** (`ae4310a`): sessões `active` resolvem sem depender da janela de horário (a janela vale só para `scheduled`); sensores cadastrados depois do início do servidor são registrados a cada 15 s; log `[DB] Device N: ...` a cada 30 s para sensor não resolvido.

### ✅ 7.4 — Monitor dos atletas / TV (Tela 2)
- 02/04/2026: tela fullscreen por token, grade por número de atletas, overlays Sessão Encerrada e Sessão em Breve.
- `3d75166`: protocolo real do ant-server (`initial_data`, `heartrate`, `reset_all`, `pong`), filtro por sessão.
- `7634e78`: grade em CSS Grid sem rolagem (a quebra de linha com barra de rolagem empilhava os cards), cabeçalho colado no topo com 100% da largura, nome limitado a 16 caracteres, moedas e anel como no modelo.
- `9fccd57`: card cinza quando passam 10 s sem dado ou a FC é 0 (`public/monitor/stale.js`, injetado por `src/app/monitor/[token]/route.js`).

### 🔄 7.5 — Monitor do treinador (Tela 3)

**Etapa A ✅ (`9fccd57`, 26/11/2026)**
- Três modos: Lista 1 dividida, Lista 2 dividida (padrão) e Cards. Listas até 12 variáveis; cards até 6.
- Diálogo de configuração: escolher, ordenar e remover variáveis; salvo no navegador (`localStorage`, chave `nodus.coachMonitor.v1`).
- Atletas confirmados aparecem desde o início; cinza até chegar dado; alerta visual em Z5.
- Testado pelo responsável com 9 atletas: listas, cards e cinza funcionaram.

**Etapa B ✅ (commit `feat(monitor): etapa B da Tela 3`, 26/11/2026 — ver `git log`)**
- Botão Encerrar: confirma e chama `PUT /api/sessions/[id]/finish`; mostra resumo (FC média e máxima, kcal, TRIMP, pontos).
- Botão Zerar kcal (todos) e menu por atleta (Zerar calorias, Remover da sessão) via mensagem `reset_calories` do WebSocket.
- Remover da sessão: desvincula o sensor (`assign-sensor` com serial nulo) e desfaz o check-in (`checkin-staff`, que alterna o valor); confere de novo após 12 s porque o `autoCheckin` pode refazer o check-in enquanto o cache do ant-server (10 s) ainda resolve o sensor.
- Alertas no cabeçalho: contagem de atletas sem sinal e em Z5; a linha mostra há quanto tempo está sem sinal.
- Os botões de controle somem com a sessão encerrada ou cancelada.
- Ainda não testado em execução.

**Etapa C 🔲 (pendente)**
- Gráfico de histórico de FC por atleta em tempo real.

### ✅ `PUT /api/sessions/[id]/finish`
- Implementado (o plano antigo ainda o lista como pendente). Calcula, por atleta com check-in, FC média, máxima e mínima, calorias, TRIMP Banister, TRIMP Edwards e pontos (`Z1×1,0 + Z2×1,5 + Z3×2,5 + Z4×4,0 + Z5×3,0` por minuto), grava em `session_athletes`, marca a sessão como `finished`, revoga o token do monitor e avisa o ant-server.
- Roles: `tenant_admin`, `coach`, `academy_coach`.

### 🔲 7.6 — Check-in automático via FC
- Já funciona pelo `autoCheckin` do ant-server. Falta decidir o que fazer com a remoção manual (ver issue #4, item 5).

## Catálogo de variáveis da Tela 3

| Variável | Ícone | Cor | Situação |
|---|---|---|---|
| FC | heart-pulse | vermelho | Disponível |
| %FCMáx | percent | laranja escuro | Disponível |
| EPOC | fire-flame-curved | vermelho | Em breve (falta fórmula) |
| TRIMP | battery-three-quarters | âmbar | Disponível (estimativa ao vivo) |
| TRIMP/min | gauge-high | vermelho | Disponível (TRIMP do último minuto) |
| MI | person-running | azul | Em breve (precisa de dado de movimento) |
| ML | bolt | ciano | Em breve (precisa de dado de movimento) |
| HRR | arrow-trend-down | verde | Disponível (queda da FC 1 min após o pico dos últimos 5 min) |
| Tempo nas zonas alvo | stopwatch | ciano | Disponível (usa `target_zone_min` e `target_zone_max` da sessão) |
| Deriva cardíaca | arrow-trend-up | laranja | Disponível (2ª metade x 1ª metade da FC média; exige cerca de 10 min) |
| PSE | face-tired | roxo | Em breve (entrada manual) |
| VFC / DFA α1 | wave-square | verde-azulado | Em breve (exige intervalos RR, hoje descartados) |
| kcal | fire (duotone) | laranja/vermelho | Disponível (só nas listas) |
| Pontos | coins (duotone) | dourado/cinza | Disponível |

Os ícones e as cores seguem a primeira linha do esboço `teste-monitor-prof2.html`.

## Decisões e descobertas

| Item | Decisão ou descoberta |
|---|---|
| Zeros no terminal | Vêm da lib `ant-plus-next`; ignorar |
| Timezone MySQL | Rodava em UTC; corrigido com `default-time-zone = '-03:00'` no `my.ini` |
| `sensors.serial` | Guarda o `DeviceId` ANT+ numérico real (ex.: `42873`); valores como `ANT0001` são ignorados |
| `session_id = null` | Ocorre quando a sessão não está `active`; corrigido em `ae4310a` para não depender da janela de horário |
| Grade da Tela 2 | Usar CSS Grid com colunas e linhas fixas; calcular larguras em pixels quebrava linha quando a barra de rolagem aparecia |
| TRIMP ao vivo | Usa a mesma fórmula do `/finish` (sem o fator 0,64 da fórmula original de Banister) para o número da tela bater com o do fechamento. Revisar nos dois lugares |
| Cronômetro da Tela 3 | Conta desde a abertura da tela com a sessão ativa; não usa o horário de início por causa do fuso |
| Zerar calorias | A mensagem `reset_calories` sem `athleteId` zera todos os atletas do ant-server, não só os da sessão |
| Reenvio de leituras | O ant-server reenvia a última leitura de cada atleta ao conectar (`initial_data`) e em `reset_all`; os clientes tratam como leitura nova. Ver issue #4 |
| Configuração da Tela 3 | Salva por navegador; mover para o banco por usuário fica para depois |

## Pendências da Fase 7

- [ ] Issue #4: corrigir o reenvio de leituras antigas (ant-server e clientes).
- [ ] Issue #3: ID do sensor no cadastro do atleta e inventário de sensores da academia.
- [ ] Testar a Tela 3 com mais atletas ao mesmo tempo (testado com 9) e testar a etapa B.
- [ ] Conferir as fórmulas e os dados da Tela 3 (TRIMP, TRIMP/min, HRR, deriva, tempo nas zonas alvo). Conferir também se o FC de repouso (`hr_rest` na API de sessão, `hr_resting` no `/finish`) está chegando; sem ele o cálculo usa 60 bpm.
- [ ] Etapa C: gráfico de histórico de FC por atleta.
- [ ] Fontes de dados para EPOC, MI, ML, PSE e VFC.
- [ ] Salvar a configuração da Tela 3 no banco, por usuário.
- [ ] Mover `stale.js` para dentro do `index.html` (ligado à issue #4).
- [ ] Cronômetro da Tela 3 a partir do início real da sessão.
