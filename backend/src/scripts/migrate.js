import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDir = path.join(root, 'migrations');

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

for (const file of files) {
  const already = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
  if (already.rowCount) continue;

  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    await pool.query('COMMIT');
    console.log(`Applied ${file}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

await pool.end();
