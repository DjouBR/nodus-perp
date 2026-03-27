import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import mysql from 'mysql2/promise'

const STAFF_ROLES = ['tenant_admin', 'coach', 'academy_coach']

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!STAFF_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const pool = mysql.createPool(process.env.DATABASE_URL)

  try {
    const [rows] = await pool.query(
      `SELECT id, status, tenant_id, start_datetime FROM training_sessions WHERE id = ? LIMIT 1`,
      [id]
    )
    const ts = rows[0]

    if (!ts)
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

    if (session.user.role !== 'super_admin' && ts.tenant_id !== session.user.tenant_id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (ts.status === 'cancelled')
      return NextResponse.json({ error: 'Sessão cancelada não pode ser iniciada' }, { status: 400 })

    if (ts.status === 'finished')
      return NextResponse.json({ error: 'Sessão já foi encerrada' }, { status: 400 })

    if (ts.status === 'active')
      return NextResponse.json({ error: 'Sessão já está ativa' }, { status: 400 })

    // start_datetime = NOW() — cronômetro real do clique do professor
    // scheduled_start já foi preenchido na criação e permanece imutável
    await pool.query(
      `UPDATE training_sessions
       SET status = 'active', start_datetime = NOW()
       WHERE id = ?`,
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'Sessão iniciada com sucesso',
      started_at: new Date().toISOString(),
    })
  } finally {
    await pool.end()
  }
}
