/**
 * /api/sessions/[id]/assign-sensor
 *
 * PUT  { athleteId, serial }  -> vincula (ou remove, se serial vazio) o sensor ANT+ ao atleta na sessao.
 *      `serial` e o DeviceId numerico do frequencimetro (o mesmo que o ant-server le no ar).
 *      - Se o serial ainda nao existe em `sensors`, ele e cadastrado automaticamente no tenant.
 *      - Se o serial pertence a outro tenant, recusa.
 *      - Se o sensor ja esta em uso por outro atleta (nesta sessao ou em sessao ativa), recusa (409).
 *      - Grava session_athletes.sensor_id = sensors.id (UUID), que e o que o ant-server usa
 *        em resolveAthleteByDeviceId().
 *
 * GET  -> { sensors: { [athleteId]: serial } } dos atletas da sessao (para exibir no Lobby).
 */

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { training_sessions, session_athletes } from '@/lib/db/schema/sessions'
import { users } from '@/lib/db/schema/users'
import { sensors } from '@/lib/db/schema/config'
import { eq, and, or, isNull, inArray, lte, gte, sql } from 'drizzle-orm'

const STAFF_ROLES = ['super_admin', 'tenant_admin', 'coach', 'academy_coach', 'receptionist']

async function authorize(sessionId) {
  const auth = await getServerSession(authOptions)
  if (!auth?.user) return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  if (!STAFF_ROLES.includes(auth.user.role))
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }

  const [sess] = await db
    .select({
      id:        training_sessions.id,
      tenant_id: training_sessions.tenant_id,
      coach_id:  training_sessions.coach_id,
    })
    .from(training_sessions)
    .where(eq(training_sessions.id, sessionId))
    .limit(1)

  if (!sess) return { error: NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 }) }

  const user = auth.user
  const allowed =
    user.role === 'super_admin' ||
    (user.tenant_id ? sess.tenant_id === user.tenant_id : sess.coach_id === user.id)
  if (!allowed) return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }

  return { user, sess }
}

// ── GET: serials atribuídos na sessão ──
export async function GET(req, { params }) {
  const { id: sessionId } = await params
  const { error } = await authorize(sessionId)
  if (error) return error

  try {
    const rows = await db
      .select({ athlete_id: session_athletes.athlete_id, serial: sensors.serial })
      .from(session_athletes)
      .innerJoin(sensors, eq(sensors.id, session_athletes.sensor_id))
      .where(eq(session_athletes.session_id, sessionId))

    const map = {}
    rows.forEach(r => { map[r.athlete_id] = r.serial })
    return NextResponse.json({ sensors: map })
  } catch (err) {
    console.error('[GET /api/sessions/[id]/assign-sensor]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ── PUT: vincula / desvincula ──
export async function PUT(req, { params }) {
  const { id: sessionId } = await params
  const { error, sess } = await authorize(sessionId)
  if (error) return error

  const body = await req.json()
  const athleteId = body.athleteId
  const rawSerial = body.serial ?? body.sensorId ?? null
  const serial = rawSerial === null || rawSerial === undefined ? '' : String(rawSerial).trim()

  if (!athleteId) return NextResponse.json({ error: 'athleteId é obrigatório' }, { status: 400 })

  try {
    const [enrolled] = await db
      .select({ athlete_id: session_athletes.athlete_id })
      .from(session_athletes)
      .where(and(eq(session_athletes.session_id, sessionId), eq(session_athletes.athlete_id, athleteId)))
      .limit(1)
    if (!enrolled)
      return NextResponse.json({ error: 'Atleta não está inscrito nesta sessão' }, { status: 404 })

    // Desvincular
    if (!serial) {
      await db
        .update(session_athletes)
        .set({ sensor_id: null })
        .where(and(eq(session_athletes.session_id, sessionId), eq(session_athletes.athlete_id, athleteId)))
      return NextResponse.json({ ok: true, sensor_id: null, sensor_serial: null })
    }

    // Valida o formato: DeviceId ANT+ e um numero de 16 bits (1 a 65535)
    if (!/^\d{1,5}$/.test(serial) || Number(serial) < 1 || Number(serial) > 65535) {
      return NextResponse.json(
        { error: 'ID inválido. Informe o número do sensor ANT+ (1 a 65535).' },
        { status: 400 }
      )
    }
    const normalizedSerial = String(Number(serial))

    // Busca (ou cadastra) o sensor
    let [sensor] = await db.select().from(sensors).where(eq(sensors.serial, normalizedSerial)).limit(1)
    let created = false

    if (sensor) {
      if (sensor.tenant_id && sess.tenant_id && sensor.tenant_id !== sess.tenant_id) {
        return NextResponse.json(
          { error: `O sensor ${normalizedSerial} está cadastrado em outra academia.` },
          { status: 409 }
        )
      }
      if (!sensor.is_active) {
        await db.update(sensors).set({ is_active: 1 }).where(eq(sensors.id, sensor.id))
      }
    } else {
      if (!sess.tenant_id) {
        return NextResponse.json(
          { error: 'Cadastro automático de sensor requer uma academia (tenant) na sessão.' },
          { status: 400 }
        )
      }
      const newId = randomUUID()
      await db.insert(sensors).values({
        id:        newId,
        tenant_id: sess.tenant_id,
        serial:    normalizedSerial,
        protocol:  'ANT+',
        is_active: 1,
      })
      sensor = { id: newId, serial: normalizedSerial }
      created = true
    }

    // Verifica se o sensor ja esta em uso por outro atleta:
    //  - nesta mesma sessao, ou
    //  - em qualquer sessao scheduled/active cuja janela de tempo inclui agora
    const conflicts = await db
      .select({
        athlete_id: session_athletes.athlete_id,
        session_id: session_athletes.session_id,
        name:       users.name,
      })
      .from(session_athletes)
      .innerJoin(training_sessions, eq(training_sessions.id, session_athletes.session_id))
      .innerJoin(users, eq(users.id, session_athletes.athlete_id))
      .where(
        and(
          eq(session_athletes.sensor_id, sensor.id),
          or(
            eq(session_athletes.session_id, sessionId),
            and(
              inArray(training_sessions.status, ['scheduled', 'active']),
              lte(training_sessions.start_datetime, sql`NOW()`),
              or(isNull(training_sessions.end_datetime), gte(training_sessions.end_datetime, sql`NOW()`))
            )
          )
        )
      )

    const other = conflicts.find(c => !(c.session_id === sessionId && c.athlete_id === athleteId))
    if (other) {
      return NextResponse.json(
        { error: `O sensor ${normalizedSerial} já está em uso por ${other.name}.` },
        { status: 409 }
      )
    }

    await db
      .update(session_athletes)
      .set({ sensor_id: sensor.id })
      .where(and(eq(session_athletes.session_id, sessionId), eq(session_athletes.athlete_id, athleteId)))

    return NextResponse.json({ ok: true, sensor_id: sensor.id, sensor_serial: normalizedSerial, created })
  } catch (err) {
    console.error('[PUT /api/sessions/[id]/assign-sensor]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
