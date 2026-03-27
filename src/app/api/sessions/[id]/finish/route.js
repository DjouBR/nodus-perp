import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/libs/db'
import { trainingSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'

const STAFF_ROLES = ['tenant_admin', 'coach', 'academy_coach']

// Pool separado para queries raw (agregações complexas)
function getPool() {
  return mysql.createPool(process.env.DATABASE_URL)
}

// ─────────────────────────────────────────────────────────────
// CÁLCULOS DE MÉTRICAS
// ─────────────────────────────────────────────────────────────

/**
 * TRIMP Banister: Σ (Δt_min × FC_rel × e^(b × FC_rel))
 * b = 1.92 (homens) | 1.67 (mulheres)
 * FC_rel = (FC - FC_repouso) / (FC_max - FC_repouso)
 */
function calcTRIMPBanister(hrseries, hrMax, hrResting, gender) {
  const b = gender === 'female' ? 1.67 : 1.92
  const INTERVAL_MIN = 5 / 60 // throttle de 5s convertido em minutos

  return hrseries.reduce((acc, row) => {
    const fcRel = (row.hr_bpm - hrResting) / (hrMax - hrResting)
    if (fcRel <= 0) return acc
    return acc + INTERVAL_MIN * fcRel * Math.exp(b * fcRel)
  }, 0)
}

/**
 * TRIMP Edwards: Σ (t_z_min × fator_zona)
 * Fatores: Z1=1, Z2=2, Z3=3, Z4=4, Z5=5
 */
function calcTRIMPEdwards(timeByZone) {
  const factors = [0, 1, 2, 3, 4, 5]
  return Object.entries(timeByZone).reduce((acc, [zone, seconds]) => {
    const z = parseInt(zone)
    return acc + (seconds / 60) * (factors[z] ?? 0)
  }, 0)
}

/**
 * Pontuação por zona:
 * Z1=1.0 | Z2=1.5 | Z3=2.5 | Z4=4.0 | Z5=3.0 pts/min
 */
function calcPoints(timeByZone) {
  const factors = { 1: 1.0, 2: 1.5, 3: 2.5, 4: 4.0, 5: 3.0 }
  return Object.entries(timeByZone).reduce((acc, [zone, seconds]) => {
    return acc + (seconds / 60) * (factors[parseInt(zone)] ?? 0)
  }, 0)
}

// ─────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!STAFF_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const pool = getPool()

  try {
    // 1. Busca a sessão
    const [sessions] = await pool.query(
      `SELECT id, status, tenant_id FROM training_sessions WHERE id = ? LIMIT 1`,
      [id]
    )
    const trainingSession = sessions[0]

    if (!trainingSession)
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

    if (session.user.role !== 'super_admin' && trainingSession.tenant_id !== session.user.tenant_id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (trainingSession.status === 'cancelled')
      return NextResponse.json({ error: 'Sessão cancelada' }, { status: 400 })

    if (trainingSession.status === 'finished')
      return NextResponse.json({ error: 'Sessão já encerrada' }, { status: 400 })

    // 2. Busca atletas com check-in
    const [athletes] = await pool.query(
      `SELECT
         sa.athlete_id,
         sa.resting_hr_pre,
         ap.hr_max,
         ap.hr_resting,
         ap.weight_kg,
         u.gender
       FROM session_athletes sa
       JOIN athlete_profiles ap ON ap.user_id = sa.athlete_id
       JOIN users u ON u.id = sa.athlete_id
       WHERE sa.session_id = ? AND sa.checked_in = 1`,
      [id]
    )

    const athleteIds = athletes.map(a => a.athlete_id)

    // 3. Para cada atleta: busca série de FC e calcula métricas
    const updates = await Promise.all(athletes.map(async (athlete) => {
      const [hrseries] = await pool.query(
        `SELECT hr_bpm, hr_zone, calories_acc
         FROM session_hr_series
         WHERE session_id = ? AND athlete_id = ?
         ORDER BY timestamp ASC`,
        [id, athlete.athlete_id]
      )

      if (!hrseries.length) return null

      const hrValues = hrseries.map(r => r.hr_bpm)
      const avgHr    = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
      const maxHr    = Math.max(...hrValues)
      const minHr    = Math.min(...hrValues)
      const calories = parseFloat(hrseries[hrseries.length - 1].calories_acc ?? 0)

      // Tempo por zona (cada registro = 5s de throttle)
      const timeByZone = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      hrseries.forEach(r => {
        const z = r.hr_zone
        if (z >= 1 && z <= 5) timeByZone[z] += 5
      })

      // FC de repouso: usa valor capturado pré-sessão, depois cadastrado, depois estimativa 60bpm
      const hrResting = athlete.resting_hr_pre ?? athlete.hr_resting ?? 60
      const hrMax     = athlete.hr_max ?? 190
      const gender    = athlete.gender ?? 'male'

      const trimp        = calcTRIMPBanister(hrseries, hrMax, hrResting, gender)
      const trimpEdwards = calcTRIMPEdwards(timeByZone)
      const points       = calcPoints(timeByZone)

      return {
        athlete_id:    athlete.athlete_id,
        avg_hr:        avgHr,
        max_hr:        maxHr,
        min_hr:        minHr,
        calories:      calories,
        trimp:         parseFloat(trimp.toFixed(2)),
        trimp_edwards: parseFloat(trimpEdwards.toFixed(2)),
        points:        parseFloat(points.toFixed(2)),
        time_z1_sec:   timeByZone[1],
        time_z2_sec:   timeByZone[2],
        time_z3_sec:   timeByZone[3],
        time_z4_sec:   timeByZone[4],
        time_z5_sec:   timeByZone[5],
        checkout_at:   new Date(),
      }
    }))

    // 4. Persiste os agregados em session_athletes
    await Promise.all(
      updates
        .filter(Boolean)
        .map(u => pool.query(
          `UPDATE session_athletes SET
             avg_hr        = ?,
             max_hr        = ?,
             min_hr        = ?,
             calories      = ?,
             trimp         = ?,
             trimp_edwards = ?,
             points        = ?,
             time_z1_sec   = ?,
             time_z2_sec   = ?,
             time_z3_sec   = ?,
             time_z4_sec   = ?,
             time_z5_sec   = ?,
             checkout_at   = ?
           WHERE session_id = ? AND athlete_id = ?`,
          [
            u.avg_hr, u.max_hr, u.min_hr,
            u.calories, u.trimp, u.trimp_edwards, u.points,
            u.time_z1_sec, u.time_z2_sec, u.time_z3_sec, u.time_z4_sec, u.time_z5_sec,
            u.checkout_at,
            id, u.athlete_id,
          ]
        ))
    )

    // 5. Fecha a sessão
    await pool.query(
      `UPDATE training_sessions SET status = 'finished', end_datetime = NOW() WHERE id = ?`,
      [id]
    )

    // 6. Notifica o ant-server para limpar cache da sessão
    try {
      const antUrl = process.env.ANT_SERVER_URL ?? 'http://localhost:3001'
      await fetch(`${antUrl}/session/ended`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId: id, athleteIds }),
      })
    } catch {
      // ant-server pode estar offline — não bloquear a resposta
      console.warn('[finish] ant-server offline ou sem rota /session/ended')
    }

    // 7. Retorna resumo para exibir na tela
    const summary = updates.filter(Boolean).map(u => ({
      athleteId:   u.athlete_id,
      avgHr:       u.avg_hr,
      maxHr:       u.max_hr,
      calories:    u.calories,
      trimp:       u.trimp,
      trimpEdwards: u.trimp_edwards,
      points:      u.points,
      timeByZone: {
        z1: u.time_z1_sec,
        z2: u.time_z2_sec,
        z3: u.time_z3_sec,
        z4: u.time_z4_sec,
        z5: u.time_z5_sec,
      },
    }))

    return NextResponse.json({
      success: true,
      message: 'Sessão encerrada com sucesso',
      summary,
    })

  } finally {
    await pool.end()
  }
}
