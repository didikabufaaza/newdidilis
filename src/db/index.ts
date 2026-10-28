import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

interface GlobalDbState {
  pool?: Pool | null;
  db?: NodePgDatabase<typeof schema> | null;
  isAvailable?: boolean | null;
  lastCheck?: number;
  inFlightCheck?: Promise<boolean> | null;
}

const globalForDb = globalThis as unknown as { __lis_db_state?: GlobalDbState };
if (!globalForDb.__lis_db_state) {
  globalForDb.__lis_db_state = {
    pool: null,
    db: null,
    isAvailable: null,
    lastCheck: 0,
    inFlightCheck: null,
  };
}

const state = globalForDb.__lis_db_state;

function getPool(): Pool {
  if (!state.pool) {
    state.pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      max: 15,
      idleTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: databaseUrl?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });

    state.pool.on("error", (err) => {
      console.warn("⚠️ Pool background error:", err.message);
      state.isAvailable = false;
      state.lastCheck = 0;
    });
  }
  return state.pool;
}

export async function isDbAvailable(): Promise<boolean> {
  const now = Date.now();
  // Reuse healthy state for 60s without pinging DB on every request
  if (state.isAvailable !== null && state.isAvailable && now - (state.lastCheck || 0) < 60000) {
    return true;
  }

  if (!databaseUrl) {
    console.warn("⚠️  DATABASE_URL not set. Running in mock mode.");
    state.isAvailable = false;
    state.lastCheck = now;
    return false;
  }

  // Deduplicate concurrent checks during burst traffic
  if (state.inFlightCheck) {
    return state.inFlightCheck;
  }

  state.inFlightCheck = (async () => {
    try {
      const pool = getPool();
      const client = await pool.connect();
      client.release();
      if (!state.db) {
        state.db = drizzle(pool, { schema });
      }
      state.isAvailable = true;
      state.lastCheck = Date.now();
      return true;
    } catch (err) {
      console.warn("⚠️  Database connection failed:", (err as Error).message);
      state.isAvailable = false;
      state.lastCheck = Date.now();
      if (state.pool) {
        try { await state.pool.end(); } catch {}
        state.pool = null;
        state.db = null;
      }
      return false;
    } finally {
      state.inFlightCheck = null;
    }
  })();

  return state.inFlightCheck;
}

export function resetDbCache() {
  state.isAvailable = null;
  state.lastCheck = 0;
  state.inFlightCheck = null;
}

export function getDb() {
  if (!state.db && state.pool) {
    state.db = drizzle(state.pool, { schema });
  }
  return state.db;
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
    const p = state.pool || getPool();
    if (p) {
      const value = Reflect.get(p, prop);
      if (typeof value === "function") return value.bind(p);
      return value;
    }
    return undefined;
  },
});
