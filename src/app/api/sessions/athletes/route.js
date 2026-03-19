import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { db } from '@/lib/db/index.js'
import { users, athlete_profiles } from '@/lib/db/schema/users'
import { eq, and, inArray } from 'drizzle-orm'

// GET /api/sessions/athletes
// Retorna lista de atletas disponíveis para o usuário logado:
// - tenant_admin / academy_coach  → academy_athlete do mesmo tenant
// - coach independente            → coach_athlete vinculados ao coach
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { role, id: userId, tenant_id: tenantId } = session.user

  try {
    let athletes = []

    if (role === 'coach') {
      // Busca coach_athletes vinculados a este coach via athlete_profiles.coach_id
      athletes = await db
        .select({ id: users.id, name: users.name, avatar_url: users.avatar_url })
        .from(users)
        .innerJoin(athlete_profiles, eq(athlete_profiles.user_id, users.id))
        .where(
          and(
            eq(users.role, 'coach_athlete'),
            eq(athlete_profiles.coach_id, userId)
          )
        )
    } else if (['tenant_admin', 'academy_coach'].includes(role)) {
      athletes = await db
        .select({ id: users.id, name: users.name, avatar_url: users.avatar_url })
        .from(users)
        .where(
          and(
            eq(users.role, 'academy_athlete'),
            eq(users.tenant_id, tenantId)
          )
        )
    }

    return NextResponse.json(athletes)
  } catch (err) {
    console.error('[GET /api/sessions/athletes]', err)
    return NextResponse.json({ error: 'Erro ao buscar atletas' }, { status: 500 })
  }
}
