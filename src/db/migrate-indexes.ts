import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const statements: string[] = [
  "CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients (doctor_id);",
  "CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients (created_by);",
  "CREATE INDEX IF NOT EXISTS idx_test_catalog_category_id ON test_catalog (category_id);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders (patient_id);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor_id ON lab_orders (doctor_id);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_created_by ON lab_orders (created_by);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_validated_by ON lab_orders (validated_by);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders (status);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_created_at ON lab_orders (created_at);",
  "CREATE INDEX IF NOT EXISTS idx_lab_orders_request_date ON lab_orders (request_date);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_test_id ON order_items (test_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_result_status ON order_items (result_status);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_entered_by ON order_items (entered_by);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_validated_by ON order_items (validated_by);",
  "CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log (user_id);",
  "CREATE INDEX IF NOT EXISTS idx_test_package_items_package_id ON test_package_items (package_id);",
  "CREATE INDEX IF NOT EXISTS idx_test_package_items_test_id ON test_package_items (test_id);",
];

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

  for (const s of statements) {
    try {
      await client.query(s);
      console.log("OK :", s.trim().replace(/;$/, ""));
    } catch (e) {
      console.error("ERR:", (e as Error).message);
    }
  }

  await client.end();
  console.log("Selesai.");
}

main().catch((e) => {
  console.error("Gagal menjalankan migrasi:", (e as Error).message);
  process.exit(1);
});