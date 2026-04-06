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

    // Usa valor UTC explícito do Node.js para evitar o bug de timezone do MySQL NOW()
    // NOW() retorna hora local do servidor MySQL sem indicador de fuso → driver interpreta errado
    const nowUtc = new Date()
    const nowMysql = nowUtc.toISOString().slice(0, 19).replace('T', ' ') // '2026-04-06 21:13:00'

    await pool.query(
      `UPDATE training_sessions
       SET status = 'active', start_datetime = ?
       WHERE id = ?`,
      [nowMysql, id]
    )

    return NextResponse.json({
      success: true,
      message: 'Sessão iniciada com sucesso',
      started_at: nowUtc.toISOString(),
    })
  } finally {
    await pool.end()
  }
}
