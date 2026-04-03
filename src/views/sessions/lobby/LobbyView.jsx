'use client'

/**
 * LobbyView.jsx — Tela 1: Sala de Espera
 *
 * Usada em: src/app/(dashboard)/sessions/[id]/lobby/page.jsx
 *
 * Fluxo:
 *   1. Carrega dados da sessão + lista de atletas (GET /api/sessions/[id])
 *   2. Gera o token de monitor (POST /api/sessions/[id]/token) para obter o link da Tela 2
 *   3. Staff confirma presenças e atribui sensores ANT+
 *   4. Clica em "Iniciar Sessão" → PUT /api/sessions/[id]/start
 *   5. Botões abrem Tela 2 (monitor atletas) e Tela 3 (monitor treinador) em nova aba
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardHeader,
  Button, Chip, CircularProgress,
  Avatar, Tooltip, IconButton,
  MenuItem, Select, FormControl,
  Divider, Typography, Box, Alert,
  Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions,
  TextField, List, ListItem,
  ListItemAvatar, ListItemText,
  ListItemButton,
} from '@mui/material'
import Grid from '@mui/material/Grid'

// ──────────────────────────────────────────────────
// ICONES (inline para não depender de import de lib específica)
const Icon = ({ icon, ...p }) => <i className={`tabler-${icon}`} {...p} />
// ──────────────────────────────────────────────────

// Simula lista de sensores ANT+ disponíveis — substituir pela listagem real do ant-server
const useSensors = () => {
  const [sensors, setSensors] = useState([])
  useEffect(() => {
    // TODO: GET http://localhost:3001/sensors quando o ant-server expuser essa rota
    // Por ora: lista estática para desenvolvimento
    setSensors([
      { id: 'ANT001', label: 'Sensor ANT+ 001' },
      { id: 'ANT002', label: 'Sensor ANT+ 002' },
      { id: 'ANT003', label: 'Sensor ANT+ 003' },
      { id: 'ANT004', label: 'Sensor ANT+ 004' },
      { id: 'ANT005', label: 'Sensor ANT+ 005' },
    ])
  }, [])
  return sensors
}

// ──────────────────────────────────────────────────
// MODAL DE WALK-IN
// ──────────────────────────────────────────────────
function WalkInModal({ open, onClose, sessionId, onAdded, showSnack }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState(null) // athlete_id sendo adicionado

  // Busca atletas do tenant conforme o usuário digita
  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); return }
    if (query.trim().length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/athletes?search=${encodeURIComponent(query)}&limit=20`)
        const data = await res.json()
        setResults(data.athletes ?? data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, open])

  const handleAdd = async (athlete) => {
    setAdding(athlete.id)
    try {
      const res  = await fetch(`/api/sessions/${sessionId}/walkin`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ athleteId: athlete.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        showSnack(data.error ?? 'Erro ao adicionar atleta', 'error')
        return
      }
      // Monta o objeto no mesmo formato que a lista de atletas usa
      onAdded({
        athlete_id: athlete.id,
        name:       athlete.name,
        avatar_url: athlete.avatar_url ?? null,
        hr_max:     athlete.hr_max ?? null,
        checked_in: 1,
        sensor_id:  null,
        walk_in:    true,
      })
      showSnack(`${athlete.name} adicionado como walk-in ✓`, 'success')
      onClose()
    } catch {
      showSnack('Erro de rede ao adicionar atleta', 'error')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon="user-plus" style={{ fontSize: 22 }} />
        Adicionar Atleta — Walk-in
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Busque um atleta cadastrado no sistema para adicioná-lo diretamente nesta sessão,
          sem inscrição prévia.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Buscar pelo nome do atleta…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <Icon icon="search" style={{ fontSize: 18, marginRight: 8, color: '#888' }} />,
            endAdornment: loading ? <CircularProgress size={16} /> : null,
          }}
        />

        {results.length > 0 && (
          <List dense sx={{ mt: 1, maxHeight: 320, overflowY: 'auto' }}>
            {results.map(athlete => (
              <ListItem key={athlete.id} disablePadding>
                <ListItemButton onClick={() => handleAdd(athlete)} disabled={adding === athlete.id}>
                  <ListItemAvatar>
                    <Avatar src={athlete.avatar_url} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                      {athlete.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={athlete.name}
                    secondary={`FC máx: ${athlete.hr_max ?? '--'} bpm`}
                  />
                  {adding === athlete.id
                    ? <CircularProgress size={20} />
                    : <Icon icon="plus" style={{ fontSize: 18, color: '#1aff15' }} />
                  }
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Nenhum atleta encontrado para "{query}".
          </Typography>
        )}

        {query.trim().length < 2 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Digite pelo menos 2 caracteres para buscar.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}

// ──────────────────────────────────────────────────
// CARD DE ATLETA
// ──────────────────────────────────────────────────
function AthleteCard({ athlete, sensors, sessionId, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleCheckin = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/checkin-staff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.athlete_id }),
      })
      const data = await res.json()
      onUpdate(athlete.athlete_id, { checked_in: data.checked_in })
    } finally {
      setLoading(false)
    }
  }

  const handleSensor = async (sensorId) => {
    try {
      await fetch(`/api/sessions/${sessionId}/assign-sensor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.athlete_id, sensorId }),
      })
      onUpdate(athlete.athlete_id, { sensor_id: sensorId })
    } catch (err) {
      console.error('Erro ao atribuir sensor', err)
    }
  }

  const checkedIn = Boolean(athlete.checked_in)

  return (
    <Card
      variant="outlined"
      sx={{
        border: checkedIn ? '2px solid #1aff15' : '2px solid transparent',
        transition: 'border 0.3s',
        opacity: checkedIn ? 1 : 0.7,
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
        {/* Avatar */}
        <Avatar src={athlete.avatar_url} sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>
          {athlete.name?.charAt(0).toUpperCase()}
        </Avatar>

        {/* Nome + status */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" fontWeight={600} noWrap>
              {athlete.name}
            </Typography>
            {athlete.walk_in && (
              <Chip label="Walk-in" size="small" color="warning" variant="tonal" />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            FC máx: {athlete.hr_max ?? '--'} bpm
          </Typography>
        </Box>

        {/* Sensor ANT+ */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={athlete.sensor_id ?? ''}
            onChange={e => handleSensor(e.target.value || null)}
            displayEmpty
            disabled={!checkedIn}
          >
            <MenuItem value=""><em>Sem sensor</em></MenuItem>
            {sensors.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botão check-in */}
        <Tooltip title={checkedIn ? 'Remover check-in' : 'Confirmar presença'}>
          <span>
            <IconButton
              onClick={handleCheckin}
              disabled={loading}
              color={checkedIn ? 'success' : 'default'}
              sx={{
                bgcolor: checkedIn ? 'success.light' : 'action.hover',
                '&:hover': { bgcolor: checkedIn ? 'success.main' : 'action.selected' },
              }}
            >
              {loading
                ? <CircularProgress size={20} />
                : <Icon icon={checkedIn ? 'circle-check' : 'circle'} style={{ fontSize: 22 }} />
              }
            </IconButton>
          </span>
        </Tooltip>
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────────
// LOBBY VIEW PRINCIPAL
// ──────────────────────────────────────────────────
export default function LobbyView({ sessionId }) {
  const sensors    = useSensors()
  const [session,    setSession]    = useState(null)
  const [athletes,   setAthletes]   = useState([])
  const [monitorUrl, setMonitorUrl] = useState('')
  const [antOk,      setAntOk]      = useState(null)   // null=verificando, true/false
  const [starting,   setStarting]   = useState(false)
  const [started,    setStarted]    = useState(false)
  const [snack,      setSnack]      = useState({ open: false, msg: '', severity: 'info' })
  const [walkInOpen, setWalkInOpen] = useState(false)

  const showSnack = (msg, severity = 'info') => setSnack({ open: true, msg, severity })

  // ── Carrega dados da sessão ──
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setSession(data.session ?? data)
        setAthletes(data.athletes ?? [])
        if (data.session?.status === 'active') setStarted(true)
      })
      .catch(() => showSnack('Erro ao carregar sessão', 'error'))
  }, [sessionId])

  // ── Gera token de monitor ao montar o Lobby ──
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/sessions/${sessionId}/token`, { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.monitorUrl) setMonitorUrl(data.monitorUrl) })
      .catch(() => {})
  }, [sessionId])

  // ── Verifica status da antena ANT+ ──
  useEffect(() => {
    const check = () => {
      fetch('http://localhost:3001/status')
        .then(r => r.json())
        .then(d => setAntOk(d?.connected !== false))
        .catch(() => setAntOk(false))
    }
    check()
    const iv = setInterval(check, 10_000)
    return () => clearInterval(iv)
  }, [])

  // ── Atualiza atleta localmente após ação ──
  const handleAthleteUpdate = useCallback((athleteId, patch) => {
    setAthletes(prev =>
      prev.map(a => a.athlete_id === athleteId ? { ...a, ...patch } : a)
    )
  }, [])

  // ── Adiciona walk-in à lista local ──
  const handleWalkInAdded = useCallback((newAthlete) => {
    setAthletes(prev => [...prev, newAthlete])
  }, [])

  // ── Iniciar Sessão ──
  const handleStart = async () => {
    const checkedCount = athletes.filter(a => a.checked_in).length
    if (checkedCount === 0) {
      showSnack('Confirme ao menos 1 atleta antes de iniciar', 'warning')
      return
    }
    setStarting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'PUT' })
      const data = await res.json()
      if (res.ok) {
        setStarted(true)
        showSnack('Sessão iniciada!', 'success')
      } else {
        showSnack(data.error ?? 'Erro ao iniciar sessão', 'error')
      }
    } finally {
      setStarting(false)
    }
  }

  const checkedCount  = athletes.filter(a => a.checked_in).length
  const totalAthletes = athletes.length

  // ── Copiar link do monitor ──
  const copyMonitorUrl = () => {
    navigator.clipboard.writeText(monitorUrl)
    showSnack('Link copiado!', 'success')
  }

  if (!session) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>

      {/* ── HEADER DA SESSÃO ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {session.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {session.scheduled_start
                  ? new Date(session.scheduled_start).toLocaleString('pt-BR')
                  : 'Horário não definido'}
              </Typography>
            </Box>

            {/* Status da antena */}
            <Chip
              label={antOk === null ? 'Verificando antena…' : antOk ? 'Antena conectada' : 'Antena desconectada'}
              color={antOk === null ? 'default' : antOk ? 'success' : 'error'}
              icon={<Icon icon={antOk ? 'wifi' : 'wifi-off'} />}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Contador de presentes */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Icon icon="users" style={{ fontSize: 20 }} />
            <Typography variant="body1">
              <strong>{checkedCount}</strong> de <strong>{totalAthletes}</strong> atleta{totalAthletes !== 1 ? 's' : ''} confirmado{checkedCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── LINK DO MONITOR (Tela 2) ── */}
      {monitorUrl && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Copiar link">
                <IconButton size="small" onClick={copyMonitorUrl}>
                  <Icon icon="copy" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Abrir monitor dos atletas (Tela 2)">
                <IconButton size="small" onClick={() => window.open(monitorUrl, '_blank')}>
                  <Icon icon="external-link" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          <strong>Monitor dos Atletas (TV/SmartTV):</strong>{' '}
          <code style={{ fontSize: 12 }}>{monitorUrl}</code>
        </Alert>
      )}

      {/* ── LISTA DE ATLETAS ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          <Icon icon="list-check" style={{ marginRight: 8 }} />
          Confirmar Presenças
        </Typography>

        {/* Botão Walk-in — visível para staff */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Icon icon="user-plus" />}
          onClick={() => setWalkInOpen(true)}
          sx={{ borderStyle: 'dashed' }}
        >
          + Walk-in
        </Button>
      </Box>

      {athletes.length === 0 ? (
        <Alert severity="warning">Nenhum atleta inscrito nesta sessão. Use o botão Walk-in para adicionar.</Alert>
      ) : (
        <Grid container spacing={2}>
          {athletes.map(athlete => (
            <Grid item xs={12} sm={6} key={athlete.athlete_id}>
              <AthleteCard
                athlete={athlete}
                sensors={sensors}
                sessionId={sessionId}
                onUpdate={handleAthleteUpdate}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── AÇÕES FINAIS ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, flexWrap: 'wrap' }}>

        {/* Botão: Abrir Monitor Treinador (Tela 3) */}
        <Button
          variant="outlined"
          startIcon={<Icon icon="device-tv" />}
          onClick={() => window.open(`/sessions/${sessionId}/monitor`, '_blank')}
        >
          Monitor Treinador
        </Button>

        {/* Botão: Iniciar Sessão */}
        <Button
          variant="contained"
          color={started ? 'success' : 'primary'}
          size="large"
          startIcon={
            starting
              ? <CircularProgress size={18} color="inherit" />
              : <Icon icon={started ? 'circle-check' : 'player-play'} />
          }
          onClick={handleStart}
          disabled={starting || started}
        >
          {started ? 'Sessão Ativa' : 'Iniciar Sessão'}
        </Button>
      </Box>

      {/* ── MODAL WALK-IN ── */}
      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        sessionId={sessionId}
        onAdded={handleWalkInAdded}
        showSnack={showSnack}
      />

      {/* ── SNACKBAR ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
