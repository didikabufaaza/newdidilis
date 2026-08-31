import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;
let _dbAvailable: boolean | null = null;
let _lastCheck = 0;

export async function isDbAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_dbAvailable !== null && now - _lastCheck < 30000) return _dbAvailable;

  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not set. Running in mock mode.");
    _dbAvailable = false;
    _lastCheck = now;
    return false;
  }

  try {
    if (_pool) {
      try { await _pool.end(); } catch {}
    }
    _pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10000,
      ssl: databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
    const client = await _pool.connect();
    client.release();
    _db = drizzle(_pool, { schema });
    _dbAvailable = true;
    _lastCheck = now;
    return true;
  } catch (err) {
    console.warn("⚠️  Database connection failed:", (err as Error).message);
    _dbAvailable = false;
    _lastCheck = now;
    _pool = null;
    _db = null;
    return false;
  }
}

export function resetDbCache() {
  _dbAvailable = null;
  _lastCheck = 0;
}

export function getDb() {
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, _receiver) {
    const instance = getDb();
    if (!instance) {
      throw new Error("Database not available - running in mock mode");
    }
    const value = Reflect.get(instance, prop, instance);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    if (_pool) {
      const value = Reflect.get(_pool, prop);
      if (typeof value === "function") return value.bind(_pool);
      return value;
    }
    return undefined;
  },
});
