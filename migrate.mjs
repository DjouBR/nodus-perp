import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'

const pool = await mysql.createPool({
  uri: process.env.DATABASE_URL,
})

const db = drizzle(pool)

console.log('\u23f3 Rodando migrations...')
await migrate(db, { migrationsFolder: './drizzle/migrations' })
console.log('\u2705 Migrations conclu\u00eddas com sucesso!')

await pool.end()
process.exit(0)
