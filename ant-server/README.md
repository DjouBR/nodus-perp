# NODUS — ANT+ Server

Servidor Node.js independente responsável por:
- Ler dados de FC de **42+ frequencímetros ANT+** simultaneamente (Continuous Scanning Mode)
- Transmitir os dados em tempo real via **WebSocket** para o frontend Next.js
- Persistir leituras na tabela `heart_rate` do banco MySQL do NODUS
- Fazer **check-in automático** dos atletas ao detectar FC durante uma sessão ativa

---

## Pré-requisitos

- Node.js 20+
- Antena USB Garmin (ANT+ stick)
- Windows: driver **Zadig (WinUSB)** instalado para a antena
- As mesmas variáveis de ambiente do NODUS (`DATABASE_URL`)

---

## Instalação

```bash
cd ant-server
npm install
```

---

## Executar

```bash
# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev

# Produção
npm start
```

O servidor sobe na porta **3001** por padrão.
Para mudar: `ANT_SERVER_PORT=3002 npm start`

---

## Rodar em paralelo com o Next.js

```bash
# Terminal 1 — Next.js
npm run dev          # na raiz do NODUS

# Terminal 2 — ANT+ Server
cd ant-server && npm run dev
```

---

## Endpoints REST

| Método | Rota | Descrição |
|--------|------|----------|
| `GET`  | `/health` | Healthcheck |
| `GET`  | `/ant/status` | Status do serviço + dispositivos |
| `POST` | `/ant/start` | Inicia o AntService manualmente |
| `POST` | `/ant/stop`  | Para o AntService |
| `POST` | `/ant/reset` | Reseta calorias de todos os atletas |

---

## WebSocket

**Endpoint:** `ws://localhost:3001/ws/heartrate`

### Mensagens recebidas (servidor → cliente)

```json
// Snapshot inicial ao conectar
{ "type": "initial_data", "data": [ ...AthleteRealtimeData ] }

// Update em tempo real (a cada leitura ANT+)
{ "type": "heartrate", "data": { ...AthleteRealtimeData } }

// Reset de calorias
{ "type": "reset_all", "data": [ ...AthleteRealtimeData ] }
```

### AthleteRealtimeData

```json
{
  "athleteId":   "uuid",
  "athleteName": "Ana Paula Souza",
  "tenantId":    "uuid",
  "deviceId":    12345,
  "heartRate":   142,
  "calories":    87,
  "zone":        3,
  "maxHeartRate": 192,
  "timestamp":   1711320000000
}
```

### Mensagens enviadas (cliente → servidor)

```json
{ "type": "ping" }                          // keepalive
{ "type": "request_data" }                  // pede snapshot atual
{ "type": "reset_calories", "athleteId": "uuid" }  // reseta um atleta
{ "type": "reset_calories" }                // reseta todos
```

---

## Estrutura dos arquivos

```
ant-server/
├── index.js           # Entry point (HTTP + WS + inicialização)
├── antService.js      # AntService — Continuous Scanning Mode (ant-plus-next)
├── websocketServer.js # HeartRateWebSocketServer — broadcast + calorias + check-in
├── db.js              # Queries MySQL do NODUS (sensors, heart_rate, sessions)
├── package.json       # Dependências do servidor ANT+
└── README.md          # Este arquivo
```

---

## Atualizar `sensors.serial` com o DeviceId real

O seed do NODUS cria sensores com serial `ANT0001`, `ANT0002`, etc. (strings).
Após vincular os dispositivos ANT+ reais, atualize o banco:

```sql
-- Exemplo: atleta 'Ana Paula' usa o dispositivo ANT+ ID 12345
UPDATE sensors
SET serial = '12345'
WHERE athlete_id = (
  SELECT id FROM users WHERE email = 'atleta@nodus.app'
);
```

O `antService.js` tenta converter `serial` para número via `parseInt`.
Seriais não numéricos (ex: `ANT0001`) são ignorados com aviso no console.

---

## Throttle de persistência

- **Broadcast**: sempre imediato (a cada leitura ANT+, ~1s)
- **Banco MySQL**: gravado a cada **5 segundos por atleta** (evita flood)
- Em memória os dados são sempre ao vivo

---

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | `mysql://user:pass@host:3306/nodus_db` |
| `ANT_SERVER_PORT` | ❌ | `3001` | Porta do servidor ANT+ |
| `NODUS_ORIGIN` | ❌ | `http://localhost:3000` | Origin permitida no CORS |
