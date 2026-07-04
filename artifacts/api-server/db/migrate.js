const fs = require("fs");
const path = require("path");
const { pool } = require("../src/lib/db");

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying migration: ${file}`);
    await pool.query(sql);
  }

  console.log(`Applied ${files.length} migration file(s).`);
}

async function verifySchema() {
  const { rows: columns } = await pool.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('source_documents', 'disclosures')
    ORDER BY table_name, ordinal_position;
  `);

  const { rows: indexes } = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'disclosures'
    ORDER BY indexname;
  `);

  console.log("\n=== Columns ===");
  for (const row of columns) {
    console.log(`${row.table_name}.${row.column_name} (${row.data_type})`);
  }

  console.log("\n=== Indexes on disclosures ===");
  for (const row of indexes) {
    console.log(`${row.indexname}: ${row.indexdef}`);
  }
}

async function main() {
  try {
    await runMigrations();
    await verifySchema();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
