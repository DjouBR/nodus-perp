import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { session_monitor_tokens } from '@/lib/db/schema/sessions'
import { eq, and } from 'drizzle-orm'
import mysql from 'mysql2/promise'

const STAFF_ROLES = ['tenant_admin', 'coach', 'academy_coach']

function getPool() {
  return mysql.createPool(process.env.DATABASE_URL)
}

function calcTRIMPBanister(hrseries, hrMax, hrResting, gender) {
  const b = gender === 'female' ? 1.67 : 1.92
  const INTERVAL_MIN = 5 / 60
  return hrseries.reduce((acc, row) => {
    const fcRel = (row.hr_bpm - hrResting) / (hrMax - hrResting)
    if (fcRel <= 0) return acc
    return acc + INTERVAL_MIN * fcRel * Math.exp(b * fcRel)
  }, 0)
}

function calcTRIMPEdwards(timeByZone) {
  const factors = [0, 1, 2, 3, 4, 5]
  return Object.entries(timeByZone).reduce((acc, [zone, seconds]) => {
    const z = parseInt(zone)
    return acc + (seconds / 60) * (factors[z] ?? 0)
  }, 0)
}

function calcPoints(timeByZone) {
  const factors = { 1: 1.0, 2: 1.5, 3: 2.5, 4: 4.0, 5: 3.0 }
  return Object.entries(timeByZone).reduce((acc, [zone, seconds]) => {
    return acc + (seconds / 60) * (factors[parseInt(zone)] ?? 0)
  }, 0)
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!STAFF_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const pool = getPool()

  try {
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

    const [athletes] = await pool.query(
      `SELECT sa.athlete_id, sa.resting_hr_pre, ap.hr_max, ap.hr_resting, ap.weight_kg, u.gender
       FROM session_athletes sa
       JOIN athlete_profiles ap ON ap.user_id = sa.athlete_id
       JOIN users u ON u.id = sa.athlete_id
       WHERE sa.session_id = ? AND sa.checked_in = 1`,
      [id]
    )

    const athleteIds = athletes.map(a => a.athlete_id)

    const updates = await Promise.all(athletes.map(async (athlete) => {
      const [hrseries] = await pool.query(
        `SELECT hr_bpm, hr_zone, calories_acc FROM session_hr_series
         WHERE session_id = ? AND athlete_id = ? ORDER BY timestamp ASC`,
        [id, athlete.athlete_id]
      )
      if (!hrseries.length) return null

      const hrValues    = hrseries.map(r => r.hr_bpm)
      const avgHr       = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
      const maxHr       = Math.max(...hrValues)
      const minHr       = Math.min(...hrValues)
      const calories    = parseFloat(hrseries[hrseries.length - 1].calories_acc ?? 0)
      const timeByZone  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      hrseries.forEach(r => { const z = r.hr_zone; if (z >= 1 && z <= 5) timeByZone[z] += 5 })

      const hrResting = athlete.resting_hr_pre ?? athlete.hr_resting ?? 60
      const hrMaxVal  = athlete.hr_max ?? 190
      const gender    = athlete.gender ?? 'male'
      const trimp        = calcTRIMPBanister(hrseries, hrMaxVal, hrResting, gender)
      const trimpEdwards = calcTRIMPEdwards(timeByZone)
      const points       = calcPoints(timeByZone)

      return {
        athlete_id:    athlete.athlete_id,
        avg_hr:        avgHr, max_hr: maxHr, min_hr: minHr,
        calories,
        trimp:         parseFloat(trimp.toFixed(2)),
        trimp_edwards: parseFloat(trimpEdwards.toFixed(2)),
        points:        parseFloat(points.toFixed(2)),
        time_z1_sec:   timeByZone[1], time_z2_sec: timeByZone[2],
        time_z3_sec:   timeByZone[3], time_z4_sec: timeByZone[4],
        time_z5_sec:   timeByZone[5],
        checkout_at:   new Date(),
      }
    }))

    await Promise.all(
      updates.filter(Boolean).map(u =>
        pool.query(
          `UPDATE session_athletes SET
             avg_hr=?,max_hr=?,min_hr=?,calories=?,trimp=?,trimp_edwards=?,points=?,
             time_z1_sec=?,time_z2_sec=?,time_z3_sec=?,time_z4_sec=?,time_z5_sec=?,
             checkout_at=?
           WHERE session_id=? AND athlete_id=?`,
          [u.avg_hr,u.max_hr,u.min_hr,u.calories,u.trimp,u.trimp_edwards,u.points,
           u.time_z1_sec,u.time_z2_sec,u.time_z3_sec,u.time_z4_sec,u.time_z5_sec,
           u.checkout_at, id, u.athlete_id]
        )
      )
    )

    await pool.query(
      `UPDATE training_sessions SET status='finished', end_datetime=NOW() WHERE id=?`, [id]
    )

    // ── Revoga token de monitor (Tela 2 exibirá "Sessão Encerrada") ──
    try {
      await db
        .update(session_monitor_tokens)
        .set({ revoked: 1 })
        .where(
          and(
            eq(session_monitor_tokens.session_id, id),
            eq(session_monitor_tokens.revoked, 0)
          )
        )
    } catch {
      console.warn('[finish] Falha ao revogar token de monitor — não crítico')
    }

    // ── Notifica ant-server ──
    try {
      const antUrl = process.env.ANT_SERVER_URL ?? 'http://localhost:3001'
      await fetch(`${antUrl}/session/ended`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, athleteIds }),
      })
    } catch {
      console.warn('[finish] ant-server offline')
    }

    const summary = updates.filter(Boolean).map(u => ({
      athleteId: u.athlete_id,
      avgHr: u.avg_hr, maxHr: u.max_hr, calories: u.calories,
      trimp: u.trimp, trimpEdwards: u.trimp_edwards, points: u.points,
      timeByZone: { z1:u.time_z1_sec,z2:u.time_z2_sec,z3:u.time_z3_sec,z4:u.time_z4_sec,z5:u.time_z5_sec },
    }))

    return NextResponse.json({ success: true, message: 'Sessão encerrada com sucesso', summary })
  } finally {
    await pool.end()
  }
}
