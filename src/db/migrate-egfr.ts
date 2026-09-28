import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL tidak tersedia di .env");
    process.exit(1);
  }
  const client = new Client({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const catRes = await client.query(
    `SELECT id FROM test_categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    ["Kimia Klinik"]
  );
  const categoryId = catRes.rows[0]?.id ?? 2;

  const insertRes = await client.query(
    `INSERT INTO test_catalog (code, name, category_id, sample_type, unit, reference_min, reference_text, price, turnaround_hours, active)
     VALUES ($1, $2, $3, 'serum', $4, $5, $6, 0, 4, true)
     ON CONFLICT (code) DO NOTHING
     RETURNING id`,
    ["KIM-045", "eGFR (CKD-EPI 2021)", categoryId, "mL/menit/1,73 m²", "90", ">= 90"]
  );

  if (insertRes.rows.length > 0) {
    console.log("OK : test_catalog KIM-045 eGFR (CKD-EPI 2021) ditambahkan, id =", insertRes.rows[0].id);
  } else {
    console.log("SKIP: KIM-045 sudah ada di test_catalog");
  }

  await client.end();
  console.log("Selesai.");
}

main().catch((e) => {
  console.error("Gagal menjalankan migrasi:", (e as Error).message);
  process.exit(1);
});