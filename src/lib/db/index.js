import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema/index.js'

// Pool de conexões reutilizável (singleton para Next.js)
const globalForDb = globalThis

if (!globalForDb._mysqlPool) {
  globalForDb._mysqlPool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
}

export const db = drizzle(globalForDb._mysqlPool, { schema, mode: 'default' })
